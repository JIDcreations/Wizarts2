// Prune the mirror down to: homepage + assets it references (incl. via CSS) + hero-concepts
import { readFileSync, statSync, readdirSync, rmSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(ROOT, 'site');
const DRY = process.argv.includes('--dry');
const ASSET_EXT = /\.(css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot|otf|mp4|webm|ogg|json|map)$/i;
const keep = new Set();
const cssQueue = [];

function resolveRef(ref, baseFile){
  if(!ref) return null;
  ref = ref.trim().split('#')[0].split('?')[0];
  if(!ref || /^(https?:|data:|mailto:|tel:|javascript:|\/\/)/i.test(ref)) return null;
  let abs = path.resolve(path.dirname(baseFile), decodeURIComponent(ref));
  if(!abs.startsWith(SITE)) return null;
  try{ if(!statSync(abs).isFile()) return null; }catch{ return null; }
  return abs;
}
function fromHtml(file){
  const html = readFileSync(file,'utf8'); const refs=[];
  let m, a=/\b(?:href|src|poster|data-src|data-bg|data-large_image|data-image)\s*=\s*["']([^"']+)["']/gi;
  while((m=a.exec(html))) refs.push(m[1]);
  let ss=/\b(?:data-)?srcset\s*=\s*["']([^"']+)["']/gi;
  while((m=ss.exec(html))) m[1].split(',').forEach(p=>refs.push(p.trim().split(/\s+/)[0]));
  let u=/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  while((m=u.exec(html))) refs.push(m[1]);
  for(const r of refs){ const abs=resolveRef(r,file);
    if(abs && ASSET_EXT.test(abs) && !keep.has(abs)){ keep.add(abs); if(/\.css$/i.test(abs)) cssQueue.push(abs); } }
}
function fromCss(file){
  let css; try{ css=readFileSync(file,'utf8'); }catch{ return; }
  let m, re=/(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"])/gi;
  while((m=re.exec(css))){ const abs=resolveRef(m[1]||m[2],file);
    if(abs && ASSET_EXT.test(abs) && !keep.has(abs)){ keep.add(abs); if(/\.css$/i.test(abs)) cssQueue.push(abs); } }
}
function walk(dir){ const out=[]; for(const e of readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name);
  if(e.isDirectory()) out.push(...walk(p)); else out.push(p);} return out; }
const human = n => n>1e9?(n/1e9).toFixed(2)+'GB':n>1e6?(n/1e6).toFixed(1)+'MB':n>1e3?(n/1e3).toFixed(0)+'KB':n+'B';

// 1. always keep: homepage + everything under hero-concepts
const HOME = path.join(SITE,'index.html'); keep.add(HOME);
const HC = path.join(SITE,'hero-concepts');
if(existsSync(HC)) walk(HC).forEach(f=>keep.add(f));
// 2. assets referenced by the homepage, then recurse referenced CSS
fromHtml(HOME);
while(cssQueue.length) fromCss(cssQueue.shift());

const all = walk(SITE);
let total=0, keepSz=0, delSz=0; const dels=[];
for(const f of all){ const s=statSync(f).size; total+=s;
  if(keep.has(f)) keepSz+=s; else { delSz+=s; dels.push([f,s]); } }

console.log(`\n${DRY?'DRY RUN':'PRUNING'} — keep homepage + its assets + hero-concepts`);
console.log(`  total : ${all.length} files, ${human(total)}`);
console.log(`  KEEP  : ${keep.size} files, ${human(keepSz)}`);
console.log(`  DELETE: ${dels.length} files, ${human(delSz)}`);

if(!DRY){
  for(const [f] of dels) rmSync(f,{force:true});
  (function pruneEmpty(dir){ let es; try{es=readdirSync(dir);}catch{return;}
    for(const e of es){ const p=path.join(dir,e); try{ if(statSync(p).isDirectory()) pruneEmpty(p);}catch{} }
    try{ if(dir!==SITE && readdirSync(dir).length===0) rmSync(dir,{recursive:true,force:true}); }catch{} })(SITE);
  console.log(`\n  done. site/ is now ${human(walk(SITE).reduce((a,f)=>a+statSync(f).size,0))}`);
}
