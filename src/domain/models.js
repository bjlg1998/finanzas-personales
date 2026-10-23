/**
 * @typedef {Object} FixedExpense
 * @property {string} id Stable identifier, retained across salary periods.
 * @property {string} name
 * @property {number} amount Whole COP pesos.
 * @property {string} [category]
 * @property {boolean} [active]
 * @property {number|null} [deadlineDay]
 * @property {string[]} [notificationIds]
 * @property {string} [paymentUrl]
 * @property {string} [paymentReference]
 * @property {number} [paidAmount] Accumulated payment in the current plan only.
 * @property {boolean} [paid] Legacy completion flag; paidAmount is authoritative.
 * @property {'payday'|'nextday'|'other'} [paymentTiming]
 * @property {number} [dueDay] Day in the month following the salary.
 * @property {number} [installmentsTotal]
 * @property {number} [installmentsPaid]
 * @property {boolean} [installmentAdvanced] Whether this plan added one installment.
 *
 * @typedef {Object} FinanceData
 * @property {number} salary
 * @property {number} [extraIncome] Additional income counted in the current plan.
 * @property {string} [extraIncomeLabel]
 * @property {boolean} [extraIncomeRecurring] Repeat the configured extra, not the prior surplus.
 * @property {number} carry Legacy carry, preserved when loading old plans.
 * @property {number} goal Reserved savings, separate from payment transactions.
 * @property {FixedExpense[]} fixed
 * @property {VariableExpense[]} expenses Variable expenses, keyed by salary period.
 * @property {Period[]} periods Immutable snapshots of closed plans.
 * @property {string|null} activeCycleStart ISO date; plan never advances automatically.
 * @property {number} payDay
 * @property {string} [planOrder]
 *
 * @typedef {Object} VariableExpense
 * @property {string} id
 * @property {string} name
 * @property {number} amount
 * @property {string} category
 * @property {string} date
 * @property {string} period
 *
 * @typedef {Object} Period
 * @property {string} id
 * @property {string} label
 * @property {number} income
 * @property {number} spent
 * @property {number} saved
 * @property {Array<Omit<FixedExpense,'id'> & {id?:string}>} [fixed]
 *
 * @typedef {Object} Cycle
 * @property {Date} start
 * @property {Date} end
 * @property {string} id
 */
module.exports = {};
