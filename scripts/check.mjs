import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const errors=[];let checked=0;
async function walk(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){if(f.name==='node_modules')continue;const p=resolve(dir,f.name);if(f.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const files=await walk(root);
for(const file of files){
  if(!['.html','.css'].includes(extname(file)))continue;
  const text=await readFile(file,'utf8');checked++;
  const refs=extname(file)==='.html'?[...text.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]):[...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]);
  for(const ref of refs){if(/^(https?:|data:|mailto:)/.test(ref))continue;const p=resolve(dirname(file),decodeURIComponent(ref.split('#')[0].split('?')[0]));try{await access(p);}catch{errors.push(`${file}: missing ${ref}`);}}
  if(extname(file)==='.html'){
    const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const seen=new Set();for(const id of ids){if(seen.has(id))errors.push(`${file}: duplicate id ${id}`);seen.add(id);}
    for(const m of text.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby|data-ace-open)="([^"]+)"/g)){for(const id of m[1].split(' ')){if(!seen.has(id))errors.push(`${file}: missing referenced id ${id}`);}}
    if(/https?:\/\//.test(text.replace(/xmlns="[^"]+"/g,'')))errors.push(`${file}: unexpected remote runtime reference`);
  }
}
const css=await readFile(resolve(root,'css/ace-tokens.css'),'utf8');
for(const theme of ['light','sage','eye']){const block=css.match(new RegExp('\\[data-ace-theme="'+theme+'"\\] \\{([^}]+)\\}'))?.[1];if(!block){errors.push(`Missing theme ${theme}`);continue;}if(/--ace-(?:font|space|radius|control|duration|sidebar-width|topbar-height)/.test(block))errors.push(`Theme ${theme} changes geometry`);}
const defined=new Set([...((await Promise.all(files.filter(p=>extname(p)==='.css').map(p=>readFile(p,'utf8')))).join('')).matchAll(/(--ace-[\w-]+)\s*:/g)].map(m=>m[1]));
for(const file of files.filter(p=>extname(p)==='.css')){const text=await readFile(file,'utf8');for(const m of text.matchAll(/var\((--ace-[\w-]+)/g))if(!defined.has(m[1]))errors.push(`${file}: undefined ${m[1]}`);}
const expected=['ace-tokens.css','ace-base.css','ace-components.css','ace-layouts.css','ace-utilities.css'];
const merged=(await Promise.all(expected.map(p=>readFile(resolve(root,'css',p),'utf8')))).map(s=>s.trim()).join('\n\n')+'\n';
assert.equal((await readFile(resolve(root,'dist/ace-ui.css'),'utf8')).replace(/\r/g,''),merged.replace(/\r/g,''),'Merged CSS differs from source');
const icons=JSON.parse(await readFile(resolve(root,'icons/ace-icons.json'),'utf8'));for(const name of Object.keys(icons))await access(resolve(root,'icons/svg',name+'.svg'));
assert.equal(errors.length,0,errors.join('\n'));
console.log(`PASS: ${checked} HTML/CSS files, ${Object.keys(icons).length} icons, links, ARIA references, theme geometry and merged CSS.`);
