import * as THREE from 'three';
import {capturePose,restorePose} from './pole-constraints.js';
import {createSelfConstraints} from './self-constraints.js';
import {createExternalHandCollisionPairs} from './external-hand-collisions.js';
import {inspectHandContact} from './hand-contact-diagnostics.js';
import {inspectPose} from './pose-validation.js';
import {floorClearance} from './floor-constraints.js';
import {inspectGripRetention} from './hand-grip-retention.js';
import {projectHandContact} from './hand-contact-projection.js';

// Bounded deterministic static search. Does not certify retention or transitions.
// Failed searches restore the exact input; success is gated independently of cost.
export function solveHandGrip(rig,{iterations=20000,seed=17,supportRequirements=['sit-bones'],apply=true}={}){
 if(!Number.isInteger(iterations)||iterations<0||iterations>20000)throw new RangeError('iterations must be 0–20000');
 const original=capturePose(rig.root,rig.joints),self=createSelfConstraints(rig),external=createExternalHandCollisionPairs(rig);
 const meshes=rig.meshes||[];if(!meshes.length)throw new Error('Grip solver requires floor collision meshes');
 const variables=[];
 for(const j of rig.joints){
  if(/Shoulder$|Wrist$/.test(j.id))for(const axis of ['x','y','z'])variables.push({j,axis,step:.12});
  else if(/Elbow$/.test(j.id))variables.push({j,axis:'x',step:.1});
  else if(j.isFinger&&j.finger!=='Thumb')variables.push({j,axis:'x',step:.15,min:0,max:THREE.MathUtils.degToRad(j.maxBend)});
 }
 const normal=side=>new THREE.Vector3(0,0,-1).applyQuaternion(rig.hands[side].wrist.getWorldQuaternion(new THREE.Quaternion()));
 function measure(){
  rig.root.updateWorldMatrix(true,true);
  const distances=external.distances(),report=inspectPose(rig,{supportRequirements});
  const body=self.contacts(0),wrist=self.jointViolations();
  const floor=Math.min(...meshes.map(floorClearance));
  let cost=0;
  // Seek multiple distal contacts rather than only a fingertip target.
  for(const side of ['left','right'])for(const finger of ['Middle','Ring']){
   const candidates=external.pairs.flatMap((p,i)=>p.kind==='opposite-fingers'&&
    (p.a.startsWith(side+finger)||p.b.startsWith(side+finger))&&/[23]$/.test(p.a)&&/[23]$/.test(p.b)?[Math.abs(distances[i]-.0001)]:[]);
   cost+=Math.min(...candidates)**2*1e5;
  }
  cost+=Math.max(0,normal('left').dot(normal('right'))+.9)**2*100;
  for(const v of variables)if(v.j.isFinger&&['Middle','Ring'].includes(v.j.finger)){
   const minimum=v.j.segment===1?.7:v.j.segment===2?.4:0;
   cost+=Math.max(0,minimum-v.j.group.rotation.x)**2*10;
  }
  cost+=distances.reduce((s,d)=>s+Math.min(0,d)**2*1e7,0);
  cost+=body.reduce((s,p)=>s+p.depth**2*1e7,0)+wrist.length*1000;
  cost+=Math.max(0,.00068-floor)**2*1e7;
  cost+=report.rom.issues.reduce((s,i)=>s+i.excessDegrees**2*10,0)+report.supports.issues.length*1000;
  const guards=!body.length&&!wrist.length&&!report.rom.issues.length&&!report.supports.issues.length&&floor>=.00068&&distances.every(d=>d>=-1e-9);
  return {cost,guards,blockers:{body,wrist,rom:report.rom.issues,supports:report.supports.issues,floor,external:external.pairs.flatMap((p,i)=>distances[i]<-1e-9?[{...p,gap:distances[i]}]:[])}};
 }
 let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 let best,performed=0,result;
 try{
  best=measure();
  for(let i=0;i<=iterations;i++){
   if(best.guards){const retention=inspectGripRetention(rig);if(retention.pass){result={success:true,pose:capturePose(rig.root,rig.joints),contact:retention.contact,retention};break;}}
   if(i===iterations)break;
   const variable=variables[Math.floor(random()*variables.length)],rotation=variable.j.group.rotation,previous=rotation[variable.axis];
   const scale=.2+.8*(1-i/Math.max(1,iterations));
   rotation[variable.axis]=THREE.MathUtils.clamp(previous+(random()-.5)*2*variable.step*scale,variable.min??-Infinity,variable.max??Infinity);
   const candidate=measure();performed++;
   if(candidate.cost<best.cost)best=candidate;else rotation[variable.axis]=previous;
  }
  if(!result){
   const projection=best.guards&&iterations>0?projectHandContact(rig,{apply:true,supportRequirements}):null;
   result=projection?.success?
    {success:true,pose:capturePose(rig.root,rig.joints),contact:projection.retention.contact,retention:projection.retention,projection}:
    {success:false,reason:'No guarded tight-contact candidate passed local pull probes within budget',contact:inspectHandContact(rig),retention:inspectGripRetention(rig),projection};
  }
  return {...result,iterations:performed,cost:best.cost,blockers:best.blockers,certified:false};
 }finally{
  if(!result?.success||!apply)restorePose(rig.root,rig.joints,original);
  rig.root.updateWorldMatrix(true,true);
 }
}
