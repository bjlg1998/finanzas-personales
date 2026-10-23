const {
  seed
} = require('./defaults');
const {
  cycleFor
} = require('../domain/dates');
const {
  normalizeCategory,
  predictCategory
} = require('../domain/categories');
const {
  SCHEMA_VERSION,
  validateFinanceData
} = require('../domain/dataValidation');
function migrateFinanceData(input, now = new Date()) {
  if (input !== null) validateFinanceData(input);
  const saved = {
    ...seed,
    ...(input || {}),
    fixed: input?.fixed || [],
    expenses: input?.expenses || [],
    periods: input?.periods || []
  };
  if (!saved.activeCycleStart) {
    const base = input ? cycleFor(now).start : now;
    saved.activeCycleStart = new Date(base.getFullYear(), base.getMonth(), Math.min(saved.payDay, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate())).toISOString();
  }
  delete saved.salaryReceived;
  const classifyExisting = saved.categoryDetectionVersion !== 1;
  saved.fixed = saved.fixed.map(item => {
    const detected = classifyExisting ? predictCategory(item.name || '') : 'Otros';
    return {
      ...item,
      category: detected !== 'Otros' ? detected : normalizeCategory(item.category),
      budgetGroup: 'auto',
      active: item.active !== false
    };
  });
  saved.expenses = saved.expenses.map(item => ({
    ...item,
    category: normalizeCategory(item.category)
  }));
  saved.categoryDetectionVersion = 1;
  saved.schemaVersion = SCHEMA_VERSION;
  return validateFinanceData(saved);
}
module.exports = {
  SCHEMA_VERSION,
  validateFinanceData,
  migrateFinanceData
};
