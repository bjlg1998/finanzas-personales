const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

function format(file) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'unambiguous', plugins: ['jsx'] });
  fs.writeFileSync(file, generate(ast, { comments: true, compact: false }, source).code + '\n');
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.js')) format(file);
  }
}
format('App.js');
format('index.js');
walk('src');
