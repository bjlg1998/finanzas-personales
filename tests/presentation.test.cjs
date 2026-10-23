const test=require('node:test');
const assert=require('node:assert/strict');
const {orderedPlan}=require('../src/domain/planOrdering');
const {createNoticeCenter}=require('../src/services/appNotice');
const items=[{id:'z',name:'Zeta',amount:200,paidAmount:0,category:'Servicios',day:2},{id:'a',name:'Agua',amount:400,paidAmount:100,category:'Servicios',day:1},{id:'b',name:'Bus',amount:100,paidAmount:100,category:'Transporte',day:3}];

test('plan order preserves source order by default and never mutates stored expenses',()=>{
  const original=JSON.stringify(items);
  assert.deepEqual(orderedPlan(items,'all','','added',x=>x.day).map(x=>x.id),['z','a','b']);
  assert.deepEqual(orderedPlan(items,'all','','name',x=>x.day).map(x=>x.id),['a','b','z']);
  assert.deepEqual(orderedPlan(items,'all','','amountDesc',x=>x.day).map(x=>x.id),['a','z','b']);
  assert.deepEqual(orderedPlan(items,'all','','amountAsc',x=>x.day).map(x=>x.id),['b','z','a']);
  assert.deepEqual(orderedPlan(items,'all','','date',x=>x.day).map(x=>x.id),['a','z','b']);
  assert.deepEqual(orderedPlan(items,'all','','category',x=>x.day).map(x=>x.id),['z','a','b']);
  assert.equal(JSON.stringify(items),original);
});
test('plan sorting respects search and paid/pending filters without adding sections',()=>{
  assert.deepEqual(orderedPlan(items,'pending','','name',x=>x.day).map(x=>x.id),['a','z']);
  assert.deepEqual(orderedPlan(items,'paid','','name',x=>x.day).map(x=>x.id),['b']);
  assert.deepEqual(orderedPlan(items,'all',' AGUA ','name',x=>x.day).map(x=>x.id),['a']);
});
test('notice center queues messages, keeps actions and cannot dismiss a stale message twice',()=>{
  const center=createNoticeCenter();
  let changes=0;
  const unsubscribe=center.subscribe(()=>changes++);
  const first=center.show('Guardado','Mensaje',[{text:'Reintentar',onPress:()=>42}]);
  const second=center.show('Actualizado','Listo',undefined,{tone:'success'});
  assert.equal(center.getSnapshot().id,first);
  assert.equal(center.getSnapshot().actions[0].onPress(),42);
  assert.equal(center.dismiss(second),false);
  assert.equal(center.dismiss(first),true);
  assert.equal(center.dismiss(first),false);
  assert.equal(center.getSnapshot().tone,'success');
  assert.equal(center.getSnapshot().actions[0].text,'Entendido');
  center.dismiss(second);
  assert.equal(center.getSnapshot(),null);
  assert.equal(changes,4);
  unsubscribe();
  center.show('Otro','Mensaje');
  assert.equal(changes,4);
});
