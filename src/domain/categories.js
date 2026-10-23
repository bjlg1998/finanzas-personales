/** @type {Record<string,string>} */
const PAYMENT_CATEGORIES = {
  Arriendo: '#B399FF',
  Servicios: '#529BFF',
  Deudas: '#FF6666',
  Alimentación: '#FFA447',
  Transporte: '#40D8DE',
  Sueldo: '#A3DB45',
  Ahorro: '#F2D34F',
  Ocio: '#EF82CD',
  Otros: '#A4ADBB'
};
/** @param {string} name */
const predictCategory = name => {
  const text = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  /** @type {Array<[string,RegExp]>} */
  const rules = [['Arriendo', /\b(arriendo|alquiler|renta|arrendamiento)\b/], ['Deudas', /\b(deuda|credito|prestamo|tarjeta|cuota|hipoteca|nu|bancolombia|davivienda|bbva|icetex|sistecredito|addi)\b/], ['Ahorro', /\b(ahorro|ahorros|inversion|inversiones|colchon|emergencia|cdt|alcancia)\b/], ['Sueldo', /\b(sueldo|salario|nomina|pago laboral|honorarios)\b/], ['Servicios', /\b(agua|luz|gas|energia|electricidad|electrohuila|enel|epm|celsia|internet|wifi|telefono|celular|movil|claro|movistar|tigo|wom|acueducto|aseo|administracion)\b/], ['Alimentación', /\b(mercado|comida|alimentacion|supermercado|almuerzo|desayuno|cena|restaurante|domicilio|despensa|exito|d1|ara|jumbo)\b/], ['Transporte', /\b(transporte|gasolina|combustible|diesel|uber|didi|taxi|bus|pasaje|parqueadero|peaje|moto|carro|soat)\b/], ['Ocio', /\b(ocio|netflix|spotify|cine|disney|hbo|max|prime|juego|videojuego|concierto|gimnasio|gym|vacaciones)\b/]];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'Otros';
};
/** @param {string|undefined} category */
const normalizeCategory = category => category === 'Comida' ? 'Alimentación' : category && PAYMENT_CATEGORIES[category] ? category : 'Otros';
/** @param {import('./models').FixedExpense[]} fixed @param {import('./models').VariableExpense[]} expenses @param {number} goal */
const categoryAmountsFor = (fixed, expenses, goal) => {
  /** @type {Record<string,number>} */
  const totals = {
    Ahorro: Number(goal) || 0
  };
  for (const item of [...fixed, ...expenses]) {
    const label = normalizeCategory(item.category);
    totals[label] = (totals[label] || 0) + item.amount;
  }
  return totals;
};
module.exports = {
  PAYMENT_CATEGORIES,
  predictCategory,
  normalizeCategory,
  categoryAmountsFor
};
