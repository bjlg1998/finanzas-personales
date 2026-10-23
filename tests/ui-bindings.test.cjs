// Checks extracted components and their bindings without running an emulator.
// Native layout, gestures, notifications and biometrics still require device QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');
const { migrateFinanceData } = require('../src/data/migrations');

function harness(theme = 'menta', initial = {}, dimensions = {}) {
  const root = path.resolve(__dirname, '..');
  const data = migrateFinanceData({ salary: 1000000, goal: 100000, fixed: [{ id: 'light', name: 'Luz', amount: 150000, paidAmount: 60000, category: 'Servicios', paymentTiming: 'payday' }], expenses: [], periods: [], activeCycleStart: new Date(2026, 9, 31).toISOString(), theme, ...initial });
  const cache = new Map();
  const layoutEffects = [];
  const simulated = { data: {version:1,scenarios:[]} };
  const stateValues = [];
  const fakeReact = { ...React, useLayoutEffect: (fn,deps) => layoutEffects.push({fn,deps}), useSyncExternalStore: (_, snapshot) => snapshot(), useState: (value) => [stateValues.length ? stateValues.shift() : typeof value === 'function' ? value() : value, () => {}], useRef: (current) => ({ current }), useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect: () => {} };
  const native = new Proxy({ StyleSheet: { create: (value) => value, hairlineWidth: 1, absoluteFillObject: {} }, Animated: { Value: class { interpolate() { return 0; } }, View: 'AnimatedView' }, useWindowDimensions: () => ({ width: 400, height: 900, fontScale:1, ...dimensions }), Alert: { alert() {} } }, { get: (value, key) => key in value ? value[key] : String(key) });
  function load(file) {
    const absolute = path.resolve(root, file.endsWith('.js') ? file : file + '.js');
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), { filename: absolute, configFile: false, babelrc: false, plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'] }).code;
    function mockedRequire(name) {
      if (name === 'react') return fakeReact;
      if (name === 'react-native') return native;
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
      if (name === 'lucide-react-native') return new Proxy({}, { get: () => 'Glyph' });
      if (name.includes('FinanceProvider')) return { useFinanceData: () => ({ data, setData() {}, loaded: true, loadError: null, reload() {} }) };
      if (name.includes('usePaymentNotifications')) return { usePaymentNotifications() {} };
      if (name.includes('useSalarySimulation')) return { useSalarySimulation: () => ({simulation:simulated.data, status:'saved', error:'', retry(){}, change:update => {simulated.data=update(simulated.data);}}) };
      if (name.includes('services/notifications')) return { requestPaymentNotifications: async () => true };
      if (name.includes('services/biometrics')) return { authenticate: async () => ({ success: true }), canUseBiometrics: async () => true };
      if (name === 'expo-clipboard') return { setStringAsync: async () => {} };
      if (name.includes('theme/ThemeProvider')) {
        const colors = load('src/theme/palettes').THEMES[theme];
        return { useTheme: () => ({ colors, styles: load('src/theme/styles').default(colors) }) };
      }
      if (name.startsWith('.')) {
        if (/\.(png|jpg)$/.test(name)) return 1;
        return load(path.resolve(path.dirname(absolute), name));
      }
      return require(name);
    }
    new Function('require', 'module', 'exports', code)(mockedRequire, module, module.exports);
    return module.exports;
  }
  return { load, data, layoutEffects, simulated, stateValues, model: load('src/state/useFinanceController').useFinanceController() };
}

test('all extracted screens and modal forms build valid React elements', () => {
  const { load, model } = harness();
  for (const name of ['HomeScreen', 'PlanScreen', 'HistoryScreen', 'CalendarScreen', 'SettingsScreen']) {
    const component = load(`src/screens/${name}`).default;
    assert.equal(React.isValidElement(component.type(model)), true, name);
  }
  assert.ok(React.isValidElement(load('src/components/ExpenseSheets').default(model)));
  const sheets = load('src/components/ExpenseSheets').default(model);
  for (const element of React.Children.toArray(sheets.props.children)) {
    assert.ok(React.isValidElement(element.type(element.props)), element.type.name);
  }
  assert.ok(React.isValidElement(load('src/components/AppShell').default(model)));
});

test('payment detail and edit form retain bindings with an existing expense', () => {
  const { load, model, data } = harness();
  for (const sheet of ['payFixed', 'editFixed', 'editExpense', 'salary', 'goal', 'theme']) {
    const host = load('src/components/ExpenseSheets').default({ ...model, sheet, selectedFixed: data.fixed[0] });
    for (const element of React.Children.toArray(host.props.children)) {
      assert.ok(React.isValidElement(element.type(element.props)), `${sheet}: ${element.type.name}`);
    }
  }
});

test('a protected account remains locked before the authentication effect runs', () => {
  const { model } = harness('menta', { biometric: true });
  assert.equal(model.locked, true);
});

test('extracted expense actions add, edit and close without losing unrelated state', () => {
  const { load, model, data } = harness();
  let state = data;
  let closed = 0;
  const actions = load('src/state/useExpenseActions').useExpenseActions({
    ...model, amount: '20.000', name: 'Bus', category: 'Transporte',
    setData: update => { state = update(state); }, closeSheet: () => { closed++; }
  });
  actions.addExpense();
  assert.equal(state.expenses[0].amount, 20000);
  assert.equal(state.expenses[0].category, 'Transporte');
  assert.deepEqual(state.fixed, data.fixed);
  const editor = load('src/state/useExpenseActions').useExpenseActions({
    ...model, selectedExpense: state.expenses[0], amount: '25.000', name: 'Taxi', category: 'Transporte',
    setData: update => { state = update(state); }, closeSheet: () => { closed++; }
  });
  editor.updateExpense();
  assert.equal(state.expenses.length, 1);
  assert.equal(state.expenses[0].amount, 25000);
  assert.equal(state.expenses[0].name, 'Taxi');
  assert.equal(closed, 2);
});

test('extracted payment actions preserve partial payment and reversal semantics', () => {
  const { load, model, data } = harness();
  let state = data;
  const bind = (amount) => load('src/state/useFixedPaymentActions').useFixedPaymentActions({
    ...model, selectedFixed: state.fixed[0], amount,
    setData: update => { state = update(state); }, closeSheet() {}
  });
  bind('90.000').addFixedPayment();
  assert.equal(state.fixed[0].paidAmount, 150000);
  assert.equal(state.fixed[0].paid, true);
  bind('0').correctFixedPayment();
  assert.equal(state.fixed[0].paidAmount, 0);
  assert.equal(state.fixed[0].paid, false);
});

test('theme-dependent components use their own immutable theme context', () => {
  for (const theme of ['menta', 'oceano', 'violeta', 'coral']) {
    const { load } = harness(theme);
    const ui = load('src/components/ui');
    assert.ok(React.isValidElement(ui.Icon({ name: 'home' })));
    assert.ok(React.isValidElement(ui.Header.type({ title: 'Plan', subtitle: 'Sueldo' })));
  }
});

test('shared category picker keeps category colors, selection and callback', () => {
  const { load } = harness();
  const { PAYMENT_CATEGORIES } = load('src/domain/categories');
  let selected;
  const element = load('src/components/CategoryPicker').default({value:'Servicios',onChange: value => {selected=value;}});
  const options = React.Children.toArray(element.props.children);
  assert.equal(options.length, Object.keys(PAYMENT_CATEGORIES).length);
  const service = options.find(option => option.props.children.props.children === 'Servicios');
  assert.equal(service.props.accessibilityState.selected, true);
  assert.equal(service.props.style[1].borderColor, PAYMENT_CATEGORIES.Servicios);
  service.props.onPress();
  assert.equal(selected, 'Servicios');
});

test('distribution uses stable equal-width columns on small, large and enlarged-font screens', () => {
  for (const [width,fontScale,columns] of [[320,1,1],[400,1,2],[800,1,3],[400,2,1]]) {
    const {load,model}=harness('menta',{}, {width,fontScale});
    const card=load('src/components/IncomeDistribution').default(model);
    const legend=React.Children.toArray(card.props.children)[2];
    const rows=React.Children.toArray(legend.props.children);
    assert.equal(rows.length,model.distribution.length);
    for(const row of rows) assert.equal(row.props.style[1].width,`${100/columns}%`);
  }
});

test('salary actions save configured extra income independently from base salary', () => {
  const {load,model,data}=harness();
  let state=data;
  const actions=load('src/state/useSalaryActions').useSalaryActions({...model,amount:'1.500.000',dueDay:'31',setData:update=>{state=update(state);},closeSheet(){}});
  actions.saveSetup({amount:'250.000',label:'Bono',recurring:true});
  assert.equal(state.salary,1500000);
  assert.equal(state.extraIncome,250000);
  assert.equal(state.extraIncomeLabel,'Bono');
  assert.equal(state.extraIncomeRecurring,true);
});

test('modern notice host renders themed dialog and executes each action only once',async()=>{
  const {load}=harness();
  const {appNotice}=load('src/services/appNotice');
  let called=0;
  appNotice.show('Recordatorios actualizados','Avisos listos',[{text:'Entendido',onPress:()=>called++}],{tone:'success'});
  const element=load('src/components/AppNoticeHost').default();
  assert.equal(element.props.icon,'checkmark');
  assert.ok(React.isValidElement(element.type(element.props)));
  await element.props.actions[0].onPress();
  await element.props.actions[0].onPress();
  assert.equal(called,1);
  assert.equal(appNotice.getSnapshot(),null);
});

test('tab scroll resets to the top without animation and tracks only tab activation',()=>{
  const {load,layoutEffects}=harness();
  const component=load('src/components/TabScrollView').default;
  for(const active of [true,false]) {
    const element=component({active,children:'Content',showsVerticalScrollIndicator:false});
    let position;
    element.props.ref.current={scrollTo:value=>{position=value;}};
    const effect=layoutEffects.at(-1);
    assert.deepEqual(effect.deps,[active]);
    effect.fn();
    assert.deepEqual(position,{x:0,y:0,animated:false});
    assert.equal(element.props.children,'Content');
  }
});

test('pager tells only the selected screen that it is active',()=>{
  const {load,model}=harness();
  for(const tab of ['inicio','plan','calendar','history','settings']) {
    const activeFlags=[];
    function visit(node) {
      if(Array.isArray(node))return node.forEach(visit);
      if(!React.isValidElement(node))return;
      if(typeof node.props.isActive==='boolean')activeFlags.push(node.props.isActive);
      visit(node.props.children);
    }
    visit(load('src/components/AppShell').default({...model,tab}));
    assert.equal(activeFlags.filter(Boolean).length,1);
    assert.equal(activeFlags.length,5);
  }
});

test('variable expenses remain accessible for editing and deletion from the plan panel',()=>{
  const item={id:'bus',name:'Bus',category:'Transporte',amount:20000,date:'2026-10-31T12:00:00.000Z',period:'2026-10'};
  const {load}=harness();
  let edited,removed;
  const element=load('src/components/VariableExpensesList').default.type({currentExpenses:[item],openExpenseEditor:value=>{edited=value;},removeExpense:id=>{removed=id;}});
  const children=React.Children.toArray(element.props.children);
  const row=children.find(child=>child.props.onLongPress);
  row.props.onPress();row.props.onLongPress();
  assert.equal(edited,item);assert.equal(removed,item.id);
});

test('simulator UI selects expenses and adjusts income without changing actual finance data',()=>{
  const {load,model,data,simulated}=harness('oceano',{fixed:[{id:'addi',name:'Addi amor',amount:60000,installmentsTotal:2,installmentsPaid:0,category:'Deudas'}]});
  const original=JSON.stringify(data);
  let closed=0;
  const render=()=>load('src/screens/SalarySimulatorScreen').default({...model,onClose:()=>closed++});
  function nodes(node, predicate, found=[]) {
    if(Array.isArray(node)) {node.forEach(value=>nodes(value,predicate,found));return found;}
    if(!React.isValidElement(node))return found;
    if(predicate(node))found.push(node);
    nodes(node.props.children,predicate,found);return found;
  }
  let tree=render();
  assert.equal(tree.props.onRequestClose instanceof Function,true);
  const checkbox=nodes(tree,node=>node.props.accessibilityRole==='checkbox')[0];
  assert.equal(checkbox.props.accessibilityState.checked,false);
  checkbox.props.onPress();
  assert.equal(simulated.data.scenarios[0].month,'2026-11');
  assert.equal(simulated.data.scenarios[0].payments[0].sourceId,'addi');
  tree=render();
  nodes(tree,node=>node.props.label==='Sueldo estimado')[0].props.onChange('1.200.000');
  assert.equal(simulated.data.scenarios[0].salary,1200000);
  assert.equal(JSON.stringify(data),original);
  render().props.onRequestClose();
  assert.equal(closed,1);
});

test('saved simulation rows stay in the catalog and support amount editing without touching actual expenses',()=>{
  const expense={id:'addi',name:'Addi amor',amount:60000,installmentsTotal:1,installmentsPaid:0,category:'Deudas'};
  const {load,model,data,simulated,stateValues}=harness('menta',{fixed:[expense]});
  const original=JSON.stringify(data);
  const render=()=>load('src/screens/SalarySimulatorScreen').default({...model,onClose(){}});
  function find(node,predicate,result=[]) {
    if(Array.isArray(node)){node.forEach(child=>find(child,predicate,result));return result;}
    if(!React.isValidElement(node))return result;
    if(predicate(node))result.push(node);
    find(node.props.children,predicate,result);return result;
  }
  const before=render();
  const buttonsBefore=find(before,node=>node.props.accessibilityRole==='button').length;
  find(before,node=>node.props.accessibilityRole==='checkbox')[0].props.onPress();
  const selected=render();
  assert.equal(find(selected,node=>node.props.accessibilityRole==='button').length,buttonsBefore);
  assert.equal(find(selected,node=>node.type?.name==='ScenarioPayment').length,0);
  assert.equal(find(selected,node=>node.props.accessibilityLabel==='Ajustar monto simulado de Addi amor').length,1);
  assert.deepEqual(find(selected,node=>node.type==='ScrollView')[0].props.maintainVisibleContentPosition,{minIndexForVisible:0});
  stateValues.push(1,0,'',false,'','','',false,expense,'75.000');
  const editor=render();
  const apply=find(editor,node=>node.props.children?.props?.children==='Aplicar a este sueldo')[0];
  apply.props.onPress();
  assert.equal(simulated.data.scenarios[0].payments[0].amount,75000);
  assert.equal(JSON.stringify(data),original);
});
