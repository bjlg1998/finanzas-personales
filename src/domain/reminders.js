const {
  planPaymentDate
} = require('./dates');
const {
  fixedPaidAmount
} = require('./payments');
const {
  money
} = require('./money');
/** @param {import('./models').FinanceData} data @param {Date} [now] */
function reminderSpecs(data, now = new Date()) {
  if (!data.activeCycleStart) return [];
  const start = new Date(data.activeCycleStart);
  return data.fixed.flatMap(item => {
    const remaining = item.amount - fixedPaidAmount(item);
    if (item.active === false || remaining <= 0) return [];
    const paymentDate = planPaymentDate(start, item);
    paymentDate.setHours(9, 0, 0, 0);
    return [1, 0].flatMap(daysBefore => {
      const date = new Date(paymentDate);
      date.setDate(date.getDate() - daysBefore);
      if (date <= now) return [];
      const key = `finance:v2:${item.id}:${date.getTime()}:${remaining}:${encodeURIComponent(item.name)}`;
      return [{
        key,
        expenseId: item.id,
        name: item.name,
        remaining,
        daysBefore,
        cycleStart: data.activeCycleStart,
        title: `${daysBefore ? 'Mañana' : 'Hoy'} · ${item.name}`,
        body: `${fixedPaidAmount(item) > 0 ? 'Saldo pendiente' : 'Por pagar'}: ${money(remaining)}. Toca para ver el gasto y registrar tu pago.`,
        date
      }];
    });
  });
}
/** @param {{notification?:{request?:{content?:{data?:{type?:string,cycleStart?:string,expenseId?:string}}}}}|null} response @param {import('./models').FinanceData} data */
function expenseFromNotification(response, data) {
  const meta = response?.notification?.request?.content?.data;
  if (meta?.type !== 'payment' || meta.cycleStart && meta.cycleStart !== data.activeCycleStart) return null;
  return data.fixed.find(item => item.id === meta.expenseId && item.active !== false) || null;
}
module.exports = {
  reminderSpecs,
  expenseFromNotification
};
