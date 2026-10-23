const fs = require('node:fs');
const path = require('node:path');
const {performance} = require('node:perf_hooks');
const {selectPlanSummary} = require('../src/domain/selectors');
const {orderedPlan} = require('../src/domain/planOrdering');
const {cycleFor, planPaymentDate} = require('../src/domain/dates');
const {PAYMENT_CATEGORIES} = require('../src/domain/categories');

const categories = Object.keys(PAYMENT_CATEGORIES);
const start = new Date(2030, 9, 31);
const cycle = cycleFor(start, start.toISOString());
const scenarios = [16, 100, 1000].map(count => {
  const data = {salary: 100000000, extraIncome: 0, goal: 0, expenses: [],
    fixed: Array.from({length: count}, (_, i) => ({id: String(i), name: `Gasto ${i}`,
      amount: 1000 + i, paidAmount: i % 3 ? 0 : 500, category: categories[i % categories.length],
      active: true, dueDay: i % 28 + 1, paymentTiming: 'custom'}))};
  const run = () => {
    const summary = selectPlanSummary(data, cycle);
    orderedPlan(summary.activeFixed, 'all', '', 'date', item => planPaymentDate(start, item));
  };
  for (let i = 0; i < 20; i++) run();
  const timings = Array.from({length: 100}, () => {
    const before = performance.now(); run(); return performance.now() - before;
  }).sort((a, b) => a - b);
  return {expenses: count, samples: timings.length, medianMs: timings[49], p95Ms: timings[94]};
});
const report = {recordedAt: new Date().toISOString(), node: process.version, platform: process.platform,
  note: 'Microbenchmark CPU con datos sintéticos en esta computadora. No mide UI, Hermes Android, FPS ni refresco del teléfono.', scenarios};
const output = path.resolve('reports/performance/domain-baseline.json');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
