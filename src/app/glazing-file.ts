import type { HashPort } from '../glazing/types';
import { sizeGuard } from '../glazing/strict-json';
import type { GlazingSession } from '../glazing/workspace';
export const browserHash:HashPort=async bytes=>new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)));
export function decodeUtf8(bytes:Uint8Array):string {
  sizeGuard(bytes.length);if(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf)throw Error('UTF8_BOM');
  try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('INVALID_UTF8');}
}
export async function readGlazingFile(file:File):Promise<string>{sizeGuard(file.size);const raw=new Uint8Array(await file.arrayBuffer());return decodeUtf8(raw);}
export function downloadBytes(bytes:Uint8Array):void{
  sizeGuard(bytes.length);const blob=new Blob([new Uint8Array(bytes)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='Facade_Solar_Lab_Glazing_Workspace.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
/** A failing validation or a superseded session can never reach the download port. */
export async function saveGlazingFile(session:GlazingSession,save:(bytes:Uint8Array)=>void=downloadBytes):Promise<void>{const bytes=await session.export();save(bytes);}
