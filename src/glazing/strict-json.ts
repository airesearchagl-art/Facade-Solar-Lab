import { validString, utf8 } from './canonical';
import { check } from './validation';
export const MAX_BYTES=262144;
export function sizeGuard(length:number):void {check(length<=MAX_BYTES,'SIZE_LIMIT_262144');}
/** Small JSON grammar reader: reject duplicate decoded keys before constructing any object. */
export function strictJson(s:string):unknown {
  sizeGuard(utf8(s).length);check(!s.startsWith('\ufeff'),'UTF8_BOM');let i=0;
  const ws=()=>{while(/[\x20\t\n\r]/.test(s[i]??'')&&i<s.length)i++;};
  const string=():string=>{const start=i++;while(i<s.length){const c=s[i++];if(c==='"'){let v:string;try{v=JSON.parse(s.slice(start,i)) as string;}catch{throw Error('JSON_SYNTAX');}validString(v);return v;}if(c==='\\')i++;}throw Error('JSON_SYNTAX');};
  const value=(depth:number):unknown=>{
    check(depth<=64,'JSON_DEPTH');ws();const c=s[i];
    if(c==='"')return string();
    if(c==='{'){i++;ws();const out:Record<string,unknown>={};const keys=new Set<string>();if(s[i]==='}'){i++;return out;}
      while(i<s.length){ws();check(s[i]==='"','JSON_SYNTAX');const k=string();check(!keys.has(k),'DUPLICATE_JSON_KEY');check(!['__proto__','constructor','prototype'].includes(k),'DANGEROUS_KEY');keys.add(k);ws();check(s[i++]===':','JSON_SYNTAX');out[k]=value(depth+1);ws();if(s[i]==='}'){i++;return out;}check(s[i++ ]===',','JSON_SYNTAX');}throw Error('JSON_SYNTAX');}
    if(c==='['){i++;ws();const out:unknown[]=[];if(s[i]===']'){i++;return out;}while(i<s.length){out.push(value(depth+1));ws();if(s[i]===']'){i++;return out;}check(s[i++]===',','JSON_SYNTAX');}throw Error('JSON_SYNTAX');}
    for(const [literal,result] of [['true',true],['false',false],['null',null]] as const)if(s.startsWith(literal,i)){i+=literal.length;return result;}
    const m=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(s.slice(i));check(m,'JSON_SYNTAX');i+=m[0].length;const n=Number(m[0]);check(Number.isFinite(n)&&!Object.is(n,-0),'INVALID_NUMBER');return n;
  };const out=value(0);ws();check(i===s.length,'JSON_SYNTAX');return out;
}
