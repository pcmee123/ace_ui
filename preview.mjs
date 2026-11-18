import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=await realpath(fileURLToPath(new URL('.',import.meta.url)));
const port=Number(process.argv[2]||8095);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('端口必须为 1–65535');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let target=resolve(root,'.'+pathname);
    const inside=p=>{const r=relative(root,p);return r!== '..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
    if(!inside(target)){res.writeHead(403);res.end('Forbidden');return;}
    if((await stat(target)).isDirectory())target=resolve(target,'index.html');
    target=await realpath(target);
    if(!inside(target)){res.writeHead(403);res.end('Forbidden');return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return;}
    const data=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'0.0.0.0',()=>console.log(`ACE UI Local: http://192.168.0.62:${port}`));
