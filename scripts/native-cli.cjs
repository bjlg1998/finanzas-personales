// Android-only Metro adapter. No Expo CLI, prebuild, remote signing or iOS tooling.
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const Metro = require('metro');
  const config = await require('../metro.config.cjs');
  const [command, ...argv] = process.argv.slice(2);
  const args = {};
  for (let i=0;i<argv.length;i++) {
    const name=argv[i].replace(/^--/,'');
    args[name]=argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;
  }
  if(command==='start') { await Metro.runServer(config,{port:Number(args.port)||8081}); return; }
  if(command!=='bundle') throw new Error('Supported commands: bundle, start');
  if(!args['bundle-output'] || !args['entry-file'] || args.platform!=='android') throw new Error('Android bundle requires entry-file and bundle-output');
  await fs.mkdir(path.dirname(args['bundle-output']),{recursive:true});
  if(args['sourcemap-output']) await fs.mkdir(path.dirname(args['sourcemap-output']),{recursive:true});
  const bundle=await Metro.runBuild(config,{
    entry:path.resolve(args['entry-file']),platform:'android',dev:args.dev==='true',
    minify:args.minify!==undefined?args.minify==='true':args.dev!=='true',
    bundleOut:args['bundle-output'],sourceMapOut:args['sourcemap-output'],
    sourceMap:Boolean(args['sourcemap-output']),sourceMapUrl:args['sourcemap-output']?path.basename(args['sourcemap-output']):undefined,
    unstable_transformProfile:'hermes-stable',assets:true
  });
    const assets=bundle.assets || [];
    if(args['assets-dest']) for(const asset of assets) {
      const identifier=`${asset.httpServerLocation}/${asset.name}`.replace(/^\//,'').toLowerCase().replace(/\//g,'_').replace(/[^a-z0-9_]/g,'').replace(/^assets_/,'');
      for(let i=0;i<asset.files.length;i++) {
        const density={0.75:'ldpi',1:'mdpi',1.5:'hdpi',2:'xhdpi',3:'xxhdpi',4:'xxxhdpi'}[asset.scales[i]];
        const image=['png','jpg','jpeg','gif','webp','xml'].includes(asset.type);
        if(image&&!density) throw new Error(`Unsupported Android asset scale: ${asset.scales[i]}`);
        const destination=path.join(args['assets-dest'],image?`drawable-${density}`:'raw',`${identifier}.${asset.type}`);
        await fs.mkdir(path.dirname(destination),{recursive:true});
        await fs.copyFile(asset.files[i],destination);
      }
    }
    console.log(`Android bundle created with ${assets.length} assets.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
