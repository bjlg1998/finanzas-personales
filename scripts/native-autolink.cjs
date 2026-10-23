// Explicit native dependency manifest for this Android-only app. Fail on new native packages
// until they are reviewed and registered; do not silently skip native dependencies.
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const definitions=[
  ['@react-native-async-storage/async-storage','com.reactnativecommunity.asyncstorage.AsyncStoragePackage','AsyncStoragePackage','rnasyncstorage',[], 'build/generated/source/codegen/jni/CMakeLists.txt'],
  ['react-native-safe-area-context','com.th3rdwave.safeareacontext.SafeAreaContextPackage','SafeAreaContextPackage','safeareacontext',['RNCSafeAreaProviderComponentDescriptor','RNCSafeAreaViewComponentDescriptor'],'src/main/jni/CMakeLists.txt'],
  ['react-native-svg','com.horcrux.svg.SvgPackage','SvgPackage','rnsvg',null,'src/main/jni/CMakeLists.txt']
];
const fs=require('node:fs');
const reviewed=new Set(definitions.map(item=>item[0]));
for(const name of Object.keys(require('../package.json').dependencies)) {
  if(reviewed.has(name)||name==='react-native')continue;
  const directory=fs.realpathSync(path.join(root,'node_modules',...name.split('/')));
  if(fs.existsSync(path.join(directory,'android','build.gradle')))throw Error(`Review and register the new native dependency: ${name}`);
}
const svgConfig=require('react-native-svg/react-native.config.js');
const dependencies={};
for(const [name,importName,instance,libraryName,components,cmake] of definitions) {
  const packageRoot=path.dirname(require.resolve(`${name}/package.json`));
  const sourceDir=path.join(packageRoot,'android');
  if(!fs.existsSync(sourceDir))throw Error(`Missing Android native source for ${name}`);
  dependencies[name]={root:packageRoot,name,platforms:{android:{sourceDir,packageImportPath:`import ${importName};`,packageInstance:`new ${instance}()`,buildTypes:[],libraryName,componentDescriptors:components||svgConfig.dependency.platforms.android.componentDescriptors,cmakeListsPath:path.join(sourceDir,cmake).replace(/\\/g,'/'),cxxModuleCMakeListsModuleName:null,cxxModuleCMakeListsPath:null,cxxModuleHeaderName:null}}};
}
console.log(JSON.stringify({root,reactNativePath:path.dirname(require.resolve('react-native/package.json')),dependencies,project:{android:{packageName:'com.personal.flujofinanzas',sourceDir:path.join(root,'android')}}}));
