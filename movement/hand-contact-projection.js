import {capturePose,restorePose} from './pole-constraints.js';
import {createExternalHandCollisionPairs} from './external-hand-collisions.js';
import {createSelfConstraints} from './self-constraints.js';
import {inspectPose} from './pose-validation.js';
import {floorClearance} from './floor-constraints.js';
import {inspectGripRetention} from './hand-grip-retention.js';

// Finite-difference descent on fixed capsule surface gaps. All contacts are
// optimized together; backtracking cannot trade collision for lower gap error.
export function projectHandContact(rig,{iterations=80,apply=false,supportRequirements=['sit-bones']}={}){
 if(!Number.isInteger(iterations)||iterations<0||iterations>500)throw new RangeError('iterations must be 0–500');
 if(!rig.meshes?.length)throw new Error('Projection requires collision meshes');
 const original=capturePose(rig.root,rig.joints),external=createExternalHandCollisionPairs(rig),self=createSelfConstraints(rig);
 const initial=external.distances();
 const indices=[];
 for(const [left,right] of [['Middle','Ring'],['Ring','Middle']]){
  const choices=external.pairs.flatMap((p,i)=>p.a.startsWith('left'+left)&&p.b.startsWith('right'+right)&&/[23]$/.test(p.a)&&/[23]$/.test(p.b)?[i]:[]);
  choices.sort((a,b)=>Math.abs(initial[a]-.0001)-Math.abs(initial[b]-.0001));
  if(choices.length)indices.push(choices[0]);
 }
 const gaps=()=>{const d=external.distances();return indices.map(i=>d[i]);};
 const cost=()=>gaps().reduce((s,d)=>s+(d-.0001)**2,0);
 const guard=()=>{
  rig.root.updateWorldMatrix(true,true);
  const r=inspectPose(rig,{supportRequirements});
  return !r.supports.issues.length&&!r.rom.issues.length&&!self.contacts(0).length&&!self.jointViolations().length&&
   Math.min(...rig.meshes.map(floorClearance))>=.00068&&external.distances().every(d=>d>=-1e-9);
 };
 const stages=[[],[],[]];
 for(const j of rig.joints){
  if(j.isFinger&&['Middle','Ring'].includes(j.finger))stages[0].push({j,axis:'x',min:j.segment===1?Math.min(j.group.rotation.x,.54):j.segment===2?Math.min(j.group.rotation.x,.28):0,max:j.maxBend*Math.PI/180});
  if(/Wrist$/.test(j.id))for(const axis of ['x','y','z'])stages[1].push({j,axis,min:-Infinity,max:Infinity});
  if(/Shoulder$/.test(j.id))for(const axis of ['x','y','z'])stages[2].push({j,axis,min:-Infinity,max:Infinity});
  if(/Elbow$/.test(j.id))stages[2].push({j,axis:'x',min:-Infinity,max:Infinity});
 }
 let result,steps=0,rejections=0;
 try{
  if(indices.length!==2||!guard())return {success:false,reason:'Input lacks required pairs or fails guards'};
  const before=gaps(),trace=[],variables=[];let current=cost();
  for(let stage=0;stage<stages.length;stage++){
   variables.push(...stages[stage]);
   for(let iteration=0;iteration<iterations;iteration++){
    if(gaps().every(d=>Math.abs(d-.0001)<.00002))break;
    const saved=variables.map(v=>v.j.group.rotation[v.axis]),gradient=[];
    for(let k=0;k<variables.length;k++){
     const v=variables[k],r=v.j.group.rotation,delta=1e-5;
     r[v.axis]=saved[k]+delta;const plus=cost();r[v.axis]=saved[k]-delta;const minus=cost();r[v.axis]=saved[k];
     gradient.push((plus-minus)/(2*delta));
    }
    const norm=Math.hypot(...gradient);if(norm<1e-14)break;
    let accepted=false;
    for(let scale=.03;scale>=.000001;scale/=2){
     variables.forEach((v,k)=>{v.j.group.rotation[v.axis]=Math.max(v.min,Math.min(v.max,saved[k]-scale*gradient[k]/norm));});
     const next=cost();
     if(next<current-1e-16&&guard()){current=next;accepted=true;steps++;break;}
     rejections++;
    }
    if(!accepted){variables.forEach((v,k)=>{v.j.group.rotation[v.axis]=saved[k];});break;}
   }
   trace.push({stage:['fingers','wrists','arms'][stage],gaps:gaps()});
  }
  const after=gaps(),retention=inspectGripRetention(rig);
  result={success:guard()&&retention.pass,before,after,pairs:indices.map(i=>external.pairs[i]),trace,steps,rejections,retention,candidate:capturePose(rig.root,rig.joints)};
  return result;
 }finally{
  if(!result?.success||!apply)restorePose(rig.root,rig.joints,original);
  rig.root.updateWorldMatrix(true,true);
 }
}
