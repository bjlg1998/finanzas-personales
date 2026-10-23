const fs = require('node:fs');
const path = require('node:path');

function inventoryComponents(inventory) {
  if (inventory.schemaVersion !== 1 || !Array.isArray(inventory.components) || !inventory.components.length) throw new Error('Inventario nativo vacío o inválido. Ejecuta writeNativeDependencyInventory.');
  const unique = new Map();
  for (const item of inventory.components) {
    if (!['release', 'tooling', 'tests'].includes(item.scope) || !/^[^:]+:[^:]+$/.test(item.name) || typeof item.version !== 'string' || !item.version) throw new Error('Componente Maven inválido');
    const key = `${item.name}@${item.version}`;
    if (!unique.has(key)) unique.set(key, {name: item.name, version: item.version, scopes: []});
    const scopes = unique.get(key).scopes;
    if (!scopes.includes(item.scope)) scopes.push(item.scope);
  }
  return [...unique.values()];
}

async function audit(components, request) {
  const findings = [];
  let pending = components.map(component => ({component, query: {package: {ecosystem: 'Maven', name: component.name}, version: component.version}}));
  for (let page = 0; pending.length; page++) {
    if (page > 100) throw new Error('Paginación OSV incompleta');
    const next = [];
    for (let offset = 0; offset < pending.length; offset += 100) {
      const chunk = pending.slice(offset, offset + 100);
      const response = await request({queries: chunk.map(item => item.query)});
      if (!Array.isArray(response.results) || response.results.length !== chunk.length) throw new Error('Respuesta OSV incompleta');
      response.results.forEach((result, index) => {
        if (!result || result.error || (result.vulns !== undefined && !Array.isArray(result.vulns))) throw new Error('Consulta OSV inválida');
        for (const vulnerability of result.vulns || []) {
          if (typeof vulnerability.id !== 'string' || !vulnerability.id) throw new Error('Hallazgo OSV inválido');
          findings.push({...chunk[index].component, id: vulnerability.id});
        }
        if (result.next_page_token) next.push({...chunk[index], query: {...chunk[index].query, page_token: result.next_page_token}});
      });
    }
    pending = next;
  }
  return findings;
}

async function main() {
  const input = path.resolve(process.argv[2] || 'android/app/build/reports/dependencies/native-inventory.json');
  const output = path.resolve('reports/native-audit.json');
  // Never leave a previous successful result looking like the current failed run.
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify({status: 'incomplete', checkedAt: new Date().toISOString()}, null, 2));
  const components = inventoryComponents(JSON.parse(fs.readFileSync(input, 'utf8')));
  const findings = await audit(components, async body => {
    const response = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) throw new Error(`OSV HTTP ${response.status}`);
    return response.json();
  });
  fs.writeFileSync(output, JSON.stringify({status: 'complete', checkedAt: new Date().toISOString(), source: 'https://api.osv.dev', components, findings}, null, 2) + '\n');
  console.log(`OSV Maven: ${components.length} versiones resueltas, ${findings.length} coincidencias conocidas. ${output}`);
  for (const finding of findings) console.log(`${finding.scopes.join(',')}: ${finding.name}@${finding.version} ${finding.id}`);
  if (findings.length) process.exitCode = 1;
}

module.exports = {inventoryComponents, audit};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
