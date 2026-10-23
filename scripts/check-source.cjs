const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const globals = new Set(['module', 'require', 'Math', 'Date', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Promise', 'Set', 'Map', 'Intl', 'JSON', 'Error', 'console', 'setTimeout', 'clearTimeout', 'undefined']);
let errors = 0;
let files = 0;
function check(file) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'unambiguous', plugins: ['jsx'] });
  const report = (message) => { errors++; console.error(`${file}: ${message}`); };
  files++;
  traverse(ast, {
    Scope(p) {
      for (const [name, binding] of Object.entries(p.scope.bindings)) {
        // Named function self-bindings and intentionally ignored arguments are not dead locals.
        if (binding.referenced || binding.kind === 'local' || binding.kind === 'param' || binding.kind === 'hoisted' || name === 'React') continue;
        const declaration = binding.path.findParent(parent => parent.isExportNamedDeclaration() || parent.isExportDefaultDeclaration());
        if (!declaration) report(`unused binding ${name}`);
      }
    },
    ReferencedIdentifier(p) { if (!p.scope.hasBinding(p.node.name) && !globals.has(p.node.name)) report(`unknown identifier ${p.node.name}`); },
    ImportDeclaration(p) {
      const target = p.node.source.value;
      if (target.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), target);
        if (![resolved, resolved + '.js', path.join(resolved, 'index.js')].some(fs.existsSync)) report(`missing import ${target}`);
      }
      if (file.includes(`${path.sep}domain${path.sep}`) && ['react', 'react-native'].includes(target)) report('domain must not depend on the UI');
    },
    CallExpression(p) {
      if (p.node.callee.name === 'require' && p.node.arguments[0]?.type === 'StringLiteral') {
        const target = p.node.arguments[0].value;
        if (target.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), target);
          if (![resolved, resolved + '.js', path.join(resolved, 'index.js')].some(fs.existsSync)) report(`missing module or asset ${target}`);
        }
      }
    }
  });
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.js')) check(file);
  }
}
check('App.js');
check('index.js');
walk('src');
if (errors) process.exitCode = 1;
else console.log(`${files} source files checked: syntax, bindings and local imports OK.`);
