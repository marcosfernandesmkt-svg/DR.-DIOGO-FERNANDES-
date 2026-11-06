import sharp from "sharp"; import { readdirSync } from "node:fs";
const [,, prefix, cols="3", w="620", dest] = process.argv; const dir=new URL("./out/",import.meta.url).pathname;
const fs=readdirSync(dir).filter(f=>f.startsWith(prefix+"-")&&f.endsWith(".jpg")).sort();
const W=+w; const metas=await sharp(dir+fs[0]).metadata(); const H=Math.round(W*metas.height/metas.width); const c=+cols;
const comp=await Promise.all(fs.map(async(f,i)=>({input:await sharp(dir+f).resize(W,H).toBuffer(),left:(i%c)*(W+8),top:Math.floor(i/c)*(H+8)})));
await sharp({create:{width:c*(W+8),height:Math.ceil(fs.length/c)*(H+8),channels:3,background:"#444"}}).composite(comp).jpeg({quality:82}).toFile(dest??(dir+"sheet-"+prefix+".jpeg")); console.log(fs.join(" "));
