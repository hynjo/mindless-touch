import * as THREE from 'three';
import {supportProfile} from './support-profiles.js';
const supports=p=>{try{return supportProfile(p).requirements;}catch{return [];}};
// Ranking affinity only: these surfaces are NOT interchangeable in validation.
const feet=new Set(['soles','forefeet','toes','heels']);
const affinity=(a,b)=>a===b?1:feet.has(a)&&feet.has(b)?.75:0;
function torsoDirection(p){
 const data=p.pose||p,scale=p.pose?1:Math.PI/180,q=new THREE.Quaternion();
 for(const id of ['pelvis','waist','torso'])q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...(data.rotations?.[id]||[0,0,0]).map(v=>v*scale))));
 return new THREE.Vector3(0,0,1).applyQuaternion(q);
}
function distance(a,b){
 const x=a.pose||a,y=b.pose||b,scaleA=a.pose?1:Math.PI/180,scaleB=b.pose?1:Math.PI/180;
 let sum=0,count=0;
 for(const id of ['pelvis','waist','torso','leftHip','rightHip','leftKnee','rightKnee','leftShoulder','rightShoulder','leftElbow','rightElbow']){
  const q=(r,scale)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...(r||[0,0,0]).map(v=>v*scale)));
  sum+=q(x.rotations?.[id],scaleA).angleTo(q(y.rotations?.[id],scaleB));count++;
 }
 return sum/count+Math.abs((x.rootPosition?.[1]??0)-(y.rootPosition?.[1]??0));
}
export function suggestRoutePoses(catalog,from,to,limit=12){
 const a=supports(from),b=supports(to);
 return catalog.filter(p=>p.id!==from.id&&p.id!==to.id&&p.name!==from.name&&p.name!==to.name).map(p=>{
  const s=supports(p),overlap=x=>x.length?x.reduce((sum,v)=>sum+Math.max(0,...s.map(w=>affinity(v,w))),0)/x.length:0;
  const orientation=torsoDirection(p),detour=Math.max(0,Math.min(orientation.angleTo(torsoDirection(from)),orientation.angleTo(torsoDirection(to)))-Math.PI/3);
  const score=(2-overlap(a)-overlap(b))*3+distance(from,p)+distance(p,to)+detour*3;
  return {pose:p,score,supports:s};
 }).sort((a,b)=>a.score-b.score||(a.pose.id<b.pose.id?-1:a.pose.id>b.pose.id?1:0)).slice(0,limit);
}
export function visibleRouteSuggestions(ranked,selected,query='',limit=12){
 const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const words=normalize(query).split(' ').filter(Boolean);
 const matching=ranked.filter(r=>words.every(w=>normalize(r.pose.name).includes(w))).slice(0,limit);
 return [...ranked.filter(r=>selected.has(r.pose.id)),...matching.filter(r=>!selected.has(r.pose.id))];
}
export function selectedRoutePoses(catalog,ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>6||new Set(ids).size!==ids.length)throw new Error('Select 1–6 distinct poses.');
 return ids.map(id=>{const p=catalog.find(p=>p.id===id);if(!p)throw new Error('Unknown candidate pose.');return p;});
}
