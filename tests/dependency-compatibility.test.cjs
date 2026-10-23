const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync}=require('node:child_process');

test('explicit Android autolinking resolves the reviewed native packages after a clean install',()=>{
  const config=JSON.parse(execFileSync(process.execPath,[path.resolve('scripts/native-autolink.cjs')],{encoding:'utf8'}));
  assert.deepEqual(Object.keys(config.dependencies).sort(),['@react-native-async-storage/async-storage','react-native-safe-area-context','react-native-svg']);
  for(const dependency of Object.values(config.dependencies))assert.ok(fs.existsSync(dependency.platforms.android.sourceDir));
  assert.equal(config.project.android.packageName,'com.personal.flujofinanzas');
});

test('migrated lockfile contains no Expo CLI, Forge, old image-size or overrides that hide them', () => {
  const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
  for(const name of ['expo','@expo/cli','node-forge','@expo/code-signing-certificates','image-size']) {
    assert.ok(!Object.keys(lock.packages).some(p=>p.endsWith('node_modules/'+name)),name);
  }
  assert.equal(require('metro/package.json').version,'0.87.1');
  assert.equal(typeof require('metro').runBuild,'function');
});

test('Metro uses React Native initialization, automatic JSX and the existing image registry',async () => {
  const config=await require('../metro.config.cjs');
  assert.ok(config.watchFolders.includes(config.projectRoot));
  assert.equal(config.transformer.assetRegistryPath,'react-native/Libraries/Image/AssetRegistry');
  assert.ok(config.serializer.getModulesRunBeforeMainModule().some(p=>p.includes('InitializeCore')));
  assert.ok(config.serializer.getPolyfills().some(p=>p.includes('error-guard')));
  assert.equal(config.resolver.resolverMainFields[0],'react-native');
  const result=require('@babel/core').transformSync('export default () => <Text>Prueba</Text>',{filename:require('node:path').resolve('src/Test.jsx')});
  assert.ok(result.code.includes('jsx'));
});
