import { it, expect } from 'vitest';
const core=import.meta.glob('../src/glazing/*.ts',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
it('AC25 glazing core has no environment/engine dependencies',()=>{for(const [name,s] of Object.entries(core)){for(const m of s.matchAll(/(?:from|import)\s*(?:\()?\s*['"]([^'"]+)['"]/g))expect(m[1],name).toMatch(/^\.\//);expect(s,name).not.toMatch(/\b(?:window|document|File|Blob|FileReader|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|process|Date)\b|Math\.random|node:|crypto\./);}});
