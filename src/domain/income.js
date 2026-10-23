/** @param {{salary:number, extraIncome?:number, carry?:number}} data */
function totalIncome(data) {
  return data.salary + (data.extraIncome || 0) + (data.carry || 0);
}
module.exports = {
  totalIncome
};
