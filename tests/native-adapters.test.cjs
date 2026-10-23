const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const babel=require('@babel/core');

function harness() {
  const scheduled=new Map(),listeners=new Map(),copied=[];
  let enrolled=true,last=null,configured=0,authenticated=true;
  const phone={
    canAuthenticate:async()=>enrolled,authenticate:async()=>authenticated,copyText:async text=>copied.push(text),
    configureNotifications:async()=>configured++,notificationsEnabled:async()=>true,
    scheduledNotifications:async()=>JSON.stringify([...scheduled.values()]),
    scheduleNotification:async(id,date,title,body,data)=>scheduled.set(id,{identifier:id,date,content:{title,body,data:JSON.parse(data)}}),
    cancelNotification:async id=>scheduled.delete(id),
    lastNotificationResponse:async()=>last,clearNotificationResponse:async()=>{last=null;}
  };
  const native={NativeModules:{FinanceNative:phone},Platform:{Version:35},PermissionsAndroid:{PERMISSIONS:{POST_NOTIFICATIONS:'notifications'},RESULTS:{GRANTED:'granted'},request:async()=>'granted'},NativeEventEmitter:class {addListener(name,fn){listeners.set(name,fn);return{remove:()=>listeners.delete(name)};}}};
  const cache=new Map();
  function load(file) {
    const absolute=path.resolve(file.endsWith('.js')?file:file+'.js');
    if(cache.has(absolute))return cache.get(absolute).exports;
    const module={exports:{}};cache.set(absolute,module);
    const code=babel.transformSync(fs.readFileSync(absolute,'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
    const mockRequire=name=>name==='react-native'?native:name.startsWith('.')?load(path.resolve(path.dirname(absolute),name)):require(name);
    new Function('require','module','exports',code)(mockRequire,module,module.exports);
    return module.exports;
  }
  return{load,scheduled,copied,listeners,native,setEnrolled:value=>{enrolled=value;},setAuthenticated:value=>{authenticated=value;},setLast:value=>{last=value;},getConfigured:()=>configured};
}
test('Android biometrics and clipboard adapters preserve service contracts',async()=>{
  const h=harness();
  const biometrics=h.load('src/services/biometrics');
  assert.equal(await biometrics.canUseBiometrics(),true);
  assert.deepEqual(await biometrics.authenticate(),{success:true});
  h.setEnrolled(false);
  assert.deepEqual(await biometrics.authenticate(),{success:false,unavailable:true});
  await h.load('src/services/nativePhone').copyText('123456');
  assert.deepEqual(h.copied,['123456']);
});
test('native notification adapter schedules remaining balances, stays idempotent and cancels paid bills',async()=>{
  const h=harness();const notifications=h.load('src/services/notifications');
  assert.equal(await notifications.requestPaymentNotifications(),true);
  assert.equal(await notifications.paymentNotificationPermission(),'granted');
  const data={activeCycleStart:new Date(2030,9,31).toISOString(),fixed:[{id:'light',name:'Luz',amount:100,paidAmount:30,paymentTiming:'payday'}]};
  await notifications.synchronizePaymentNotifications(data);
  await notifications.synchronizePaymentNotifications(data);
  assert.equal(h.scheduled.size,2);
  for(const record of h.scheduled.values()) {
    assert.equal(new Date(record.date).getHours(),9);
    assert.equal(record.content.data.expenseId,'light');
    assert.match(record.content.body,/70/);
  }
  await notifications.synchronizePaymentNotifications({...data,fixed:[{...data.fixed[0],paidAmount:100}]});
  assert.equal(h.scheduled.size,0);assert.ok(h.getConfigured()>0);
});
test('native notification responses work for cold start and live events and unsubscribe safely',async()=>{
  const h=harness();const notifications=h.load('src/services/notifications');
  const response={notification:{request:{identifier:'test',content:{data:{type:'payment',expenseId:'light'}}}}};
  h.setLast(JSON.stringify(response));
  const received=[];
  const unsubscribe=notifications.observePaymentNotificationResponses(value=>received.push(value));
  await Promise.resolve();await Promise.resolve();
  h.listeners.get('FinanceNotificationResponse')({responseJson:JSON.stringify(response)});
  h.listeners.get('FinanceNotificationResponse')({responseJson:'{broken'});
  assert.equal(received.length,2);assert.deepEqual(received[0],response);
  unsubscribe();assert.equal(h.listeners.size,0);
  await notifications.clearPaymentNotificationResponse();
});
test('a missing Android module is explicit and never reports authentication success',()=>{
  const h=harness();delete h.native.NativeModules.FinanceNative;
  assert.throws(()=>h.load('src/services/nativePhone').phoneModule(),/no está instalado/);
});

test('canceling biometric authentication never unlocks successfully',async()=>{
  const h=harness();h.setAuthenticated(false);
  assert.deepEqual(await h.load('src/services/biometrics').authenticate(),{success:false});
});

test('denied Android notification permission is explicit and old Android does not request the runtime permission',async()=>{
  const h=harness();const notifications=h.load('src/services/notifications');
  let requested=0;
  h.native.PermissionsAndroid.request=async()=>{requested++;return 'denied';};
  assert.equal(await notifications.requestPaymentNotifications(),false);
  assert.equal(requested,1);
  h.native.Platform.Version=32;
  assert.equal(await notifications.requestPaymentNotifications(),true);
  assert.equal(requested,1);
});
