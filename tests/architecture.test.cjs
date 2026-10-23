const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { validateFixedExpense } = require('../src/domain/expenseValidation');

test('notification settings view has no dependency on notification scheduling adapters',()=>{
  const ast=parser.parse(fs.readFileSync('src/components/PaymentNotificationSettings.js','utf8'),{sourceType:'module',plugins:['jsx']});
  traverse(ast,{ImportDeclaration(p){assert.ok(!p.node.source.value.includes('services/notifications'));}});
});

test('data and service layers do not depend on React state or presentation',()=>{
  for(const dir of ['src/data','src/services']) for(const name of fs.readdirSync(dir).filter(f=>f.endsWith('.js'))) {
    const file=path.join(dir,name);
    const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'unambiguous'});
    const check=target=>assert.ok(!/\/(state|screens|components)\//.test(target),`${file}: forbidden dependency ${target}`);
    traverse(ast,{ImportDeclaration(p){check(p.node.source.value);},CallExpression(p){if(p.node.callee.name==='require'&&p.node.arguments[0]?.type==='StringLiteral')check(p.node.arguments[0].value);}});
  }
});

test('internal messages cannot use native Android Alert dialogs',()=>{
  function walk(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) {walk(file);continue;}
      if(!file.endsWith('.js'))continue;
      const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'unambiguous',plugins:['jsx']});
      traverse(ast,{ImportDeclaration(p){
        if(p.node.source.value==='react-native') assert.ok(!p.node.specifiers.some(s=>s.imported?.name==='Alert'),`${file}: use appNotice instead of native Alert`);
      }});
    }
  }
  walk('src');
});

test('every direct style reference including the application root has a definition', () => {
  const files=['App.js'];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(file); else if(file.endsWith('.js')) files.push(file);
    }
  }
  walk('src');
  const definitions=new Set();
  const references=[];
  for (const file of files) {
    const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'unambiguous',plugins:['jsx']});
    traverse(ast,{
      CallExpression(p) {
        if(file===path.join('src','theme','styles.js')&&p.node.callee.object?.name==='StyleSheet'&&p.node.callee.property?.name==='create') {
          for(const property of p.node.arguments[0].properties) definitions.add(property.key.name);
        }
      },
      MemberExpression(p) { if(p.node.object.name==='styles'&&!p.node.computed) references.push([file,p.node.property.name]); }
    });
  }
  for(const [file,name] of references) assert.ok(definitions.has(name),`${file}: missing style ${name}`);
});

test('financial domain cannot depend on presentation, state or native services', () => {
  for (const file of fs.readdirSync('src/domain').filter(name => name.endsWith('.js'))) {
    const ast = parser.parse(fs.readFileSync(path.join('src/domain', file), 'utf8'), {sourceType:'unambiguous'});
    const check = target => assert.ok(target.startsWith('./'), `${file}: forbidden dependency ${target}`);
    traverse(ast, {
      ImportDeclaration(p) { check(p.node.source.value); },
      CallExpression(p) {
        if (p.node.callee.name === 'require') check(p.node.arguments[0].value);
      }
    });
  }
});

test('fixed expense validation accepts normal plans and rejects invalid quotas and dates', () => {
  const draft = { amount: 150000, name: 'Luz', dueDay: 31, installmentsTotal: 0, installmentsPaid: 0, deadlineDay: null };
  assert.equal(validateFixedExpense(draft), null);
  assert.equal(validateFixedExpense({...draft, installmentsTotal:12, installmentsPaid:3, deadlineDay:15}), null);
  for (const patch of [{amount:0}, {amount:1.5}, {name:' '}, {dueDay:32}, {deadlineDay:1.5}, {installmentsTotal:-1}, {installmentsPaid:1}, {installmentsTotal:12, installmentsPaid:12}, {installmentsTotal:2.5}]) {
    assert.equal(typeof validateFixedExpense({...draft,...patch}), 'string', JSON.stringify(patch));
  }
});
