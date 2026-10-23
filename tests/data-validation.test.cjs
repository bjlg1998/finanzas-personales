const test=require('node:test');
const assert=require('node:assert/strict');
const {migrateFinanceData}=require('../src/data/migrations');
const {validateFinanceData}=require('../src/domain/dataValidation');
const {createFinanceRepository,STORE_KEY,BACKUP_KEY}=require('../src/services/financeRepository');
const fixture=()=>({salary:1000000,goal:0,fixed:[{id:'light',name:'Luz',amount:150000,paidAmount:60000,installmentsTotal:12,installmentsPaid:3,dueDay:31}],expenses:[],periods:[],activeCycleStart:'2026-10-31T05:00:00.000Z'});
test('stored payment validation rejects malformed balances, identities, installments and dates',()=>{
  for(const patch of [{paidAmount:'invalid'},{paidAmount:NaN},{paidAmount:-1},{paidAmount:150001},{installmentsPaid:13},{installmentsPaid:1.5},{installmentsTotal:-1},{id:''},{id:123},{dueDay:32},{deadlineDay:0},{date:'2026-02-31'},{paid:'yes'}]) {
    const data=fixture();data.fixed[0]={...data.fixed[0],...patch};
    assert.throws(()=>validateFinanceData(data),JSON.stringify(patch));
  }
  const duplicate=fixture();duplicate.fixed.push({...duplicate.fixed[0]});
  assert.throws(()=>validateFinanceData(duplicate));
  assert.throws(()=>validateFinanceData({...fixture(),activeCycleStart:'2026-02-31'}));
});
test('old snapshots without expense IDs, legacy paid flags and unknown fields are retained',()=>{
  const data=fixture();delete data.fixed[0].paidAmount;data.fixed[0].paid=true;
  data.periods=[{id:'old',label:'Historial anterior',income:1000000,spent:150000,saved:850000,fixed:[{name:'Luz',amount:150000,paidAmount:150000,active:true}]}];
  data.customField='preserved';
  const migrated=migrateFinanceData(data);
  assert.deepEqual(migrated.periods,data.periods);
  assert.equal(migrated.fixed[0].paid,true);
  assert.equal(migrated.customField,'preserved');
});
test('malformed stored payment recovers backup and is not overwritten without one',async()=>{
  const broken=fixture();broken.fixed[0].paidAmount='invalid';
  for(const hasBackup of [true,false]) {
    const values=new Map([[STORE_KEY,JSON.stringify(broken)]]);
    if(hasBackup)values.set(BACKUP_KEY,JSON.stringify(fixture()));
    const storage={getItem:async key=>values.get(key)||null,setItem:async(key,value)=>values.set(key,value)};
    const repository=createFinanceRepository(storage);
    if(hasBackup){const result=await repository.load();assert.equal(result.recovered,true);assert.equal(result.data.fixed[0].paidAmount,60000);}
    else await assert.rejects(repository.load());
    assert.equal(values.get(STORE_KEY),JSON.stringify(broken));
    await assert.rejects(repository.save(broken));
  }
});
test('snapshot validation accepts completed installments and rejects overflowing sums',()=>{
  const data=fixture();data.fixed[0].installmentsPaid=12;data.fixed[0].paidAmount=150000;
  assert.equal(validateFinanceData(data),data);
  assert.throws(()=>validateFinanceData({...fixture(),salary:Number.MAX_SAFE_INTEGER,extraIncome:1}));
});
