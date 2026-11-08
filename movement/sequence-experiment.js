export function experimentOrder(ids,seed){
 if(typeof seed!=='string'||!seed.trim()||seed.length>80)throw new Error('Enter a seed (1–80 characters).');
 const result=[...new Set(ids)].sort();
 if(result.length<2||result.length>200)throw new Error('Select 2–200 poses.');
 let state=2166136261;for(const c of seed.trim())state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;
 for(let i=result.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=Math.floor(state/4294967296*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
