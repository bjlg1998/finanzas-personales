const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const PACKAGE = 'com.personal.flujofinanzas';

function summarizeFrames(text) {
  const durations = [], deadlines = [];
  let columns = null;
  for (const line of text.split(/\r?\n/)) {
    const cells = line.trim().split(',');
    if (cells[0] === 'Flags' && cells.includes('IntendedVsync')) {columns = cells; continue;}
    if (!columns || !/^\d+$/.test(cells[0]) || cells.length < columns.length) continue;
    const value = name => Number(cells[columns.indexOf(name)]);
    if (value('Flags') !== 0) continue;
    const start = value('IntendedVsync'), end = value('FrameCompleted');
    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(end) || end <= start || end >= 9e18) continue;
    durations.push((end - start) / 1e6);
    const deadline = value('FrameDeadline');
    if (Number.isFinite(deadline) && deadline > start && deadline < 9e18) deadlines.push(end > deadline);
  }
  durations.sort((a, b) => a - b);
  const percentile = p => durations.length ? durations[Math.max(0, Math.ceil(durations.length * p) - 1)] : null;
  return {
    frames: durations.length, p50Ms: percentile(.5), p95Ms: percentile(.95),
    framesWithDeadline: deadlines.length,
    missedDeadlinePercent: deadlines.length ? deadlines.filter(Boolean).length / deadlines.length * 100 : null,
    note: 'Muestra de frames Android, no FPS sostenidos ni medición del hilo JS. Sin deadline no se infiere un presupuesto fijo de 60/120 Hz.'
  };
}

function main() {
  const [command, serial] = process.argv.slice(2);
  if (!['begin', 'collect'].includes(command) || !serial || !/^[a-zA-Z0-9._:-]+$/.test(serial)) throw new Error('Uso: npm run perf:device -- begin|collect SERIAL_FISICO');
  const adb = process.env.ADB_PATH || (process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb');
  const run = args => execFileSync(adb, ['-s', serial, ...args], {encoding: 'utf8', timeout: 30000});
  if (serial.startsWith('emulator-') || run(['shell', 'getprop', 'ro.kernel.qemu']).trim() === '1') throw new Error('La medición solo admite un teléfono físico.');
  const directory = path.resolve('reports/performance', serial.replace(/[^a-zA-Z0-9_-]/g, '_'));
  fs.mkdirSync(directory, {recursive: true});
  const sessionFile = path.join(directory, 'session.json');
  const version = run(['shell', 'dumpsys', 'package', PACKAGE]).split(/\r?\n/).filter(line => /versionName=|versionCode=|DEBUGGABLE/.test(line)).map(line => line.trim());
  if (!version.length) throw new Error('La app no está instalada');
  if (command === 'begin') {
    run(['shell', 'dumpsys', 'gfxinfo', PACKAGE, 'reset']);
    fs.writeFileSync(sessionFile, JSON.stringify({startedAt: new Date().toISOString(), version,
      model: run(['shell', 'getprop', 'ro.product.model']).trim(),
      sdk: run(['shell', 'getprop', 'ro.build.version.sdk']).trim()
    }, null, 2));
    console.log('Medición iniciada. Abre/desbloquea la app, recorre pestañas y desplaza Plan durante 30–60 segundos; luego ejecuta collect con el mismo serial. No se instala, borra ni cierra la app.');
    return;
  }
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  if (JSON.stringify(session.version) !== JSON.stringify(version)) throw new Error('Cambió la versión: inicia otra sesión.');
  const gfx = run(['shell', 'dumpsys', 'gfxinfo', PACKAGE, 'framestats']);
  const memory = run(['shell', 'dumpsys', 'meminfo', PACKAGE]);
  const display = run(['shell', 'dumpsys', 'display']).split(/\r?\n/).filter(line => /mActiveModeId|mSupportedModes|renderFrameRate|mRefreshRate|mModeId/.test(line)).join('\n');
  const report = {...session, collectedAt: new Date().toISOString(), ...summarizeFrames(gfx)};
  const name = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(directory, `${name}-frames.txt`), gfx);
  fs.writeFileSync(path.join(directory, `${name}-memory.txt`), memory);
  fs.writeFileSync(path.join(directory, `${name}-display.txt`), display);
  fs.writeFileSync(path.join(directory, `${name}-summary.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  console.log(`Archivos locales: ${directory}`);
}

module.exports = {summarizeFrames};
if (require.main === module) {
  try {main();} catch (error) {console.error(error.message); process.exitCode = 1;}
}
