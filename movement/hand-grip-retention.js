import * as THREE from 'three';
import {inspectHandContact} from './hand-contact-diagnostics.js';
import {createExternalHandCollisionPairs} from './external-hand-collisions.js';

export function samplePullBlockage(evaluate,indices){
 for(let step=1;step<=10;step++){
  const distance=step*.0001,values=evaluate(distance),index=indices.find(i=>values[i]<-.00001);
  if(index!==undefined)return {blockedAt:distance,index};
 }
 return {blockedAt:null,index:null};
}

// Local rigid pull probes, NOT force closure or proof against arbitrary escape.
// Tight contact is measured on finger capsules, not rendered skin triangles.
export function inspectGripRetention(rig){
 const contact=inspectHandContact(rig,{tolerance:.0005});
 if(!contact.hookedGripCandidate.pass)return {pass:false,reason:'Insufficient nonpenetrating distal contact within 0.5 mm',contact,probes:[],certified:false};
 const left=rig.hands.left.root,right=rig.hands.right.root;
 const saved=[left.position.clone(),right.position.clone()];
 const external=createExternalHandCollisionPairs(rig);
 const indices=external.pairs.flatMap((p,i)=>contact.hookedGripCandidate.contacts.some(c=>c.a===p.a&&c.b===p.b)?[i]:[]);
 const probes=[];
 try{
  rig.root.updateWorldMatrix(true,true);
  const axis=rig.hands.left.wrist.getWorldPosition(new THREE.Vector3()).sub(rig.hands.right.wrist.getWorldPosition(new THREE.Vector3()));
  if(axis.length()<1e-6)return {pass:false,reason:'Undefined pull axis',contact,probes,certified:false};
  axis.normalize();
  const tangent=new THREE.Vector3(1,0,0);if(Math.abs(axis.x)>.9)tangent.set(0,1,0);
  tangent.addScaledVector(axis,-tangent.dot(axis)).normalize();
  const other=axis.clone().cross(tangent);
  const directions=[axis,...[tangent,other].flatMap(t=>[-1,1].map(sign=>axis.clone().addScaledVector(t,sign*.2).normalize()))];
  for(const direction of directions){
   const hit=samplePullBlockage(distance=>{
    // Total hand separation increases by 0.1 mm per sample, up to 1 mm.
    for(const [mount,start,sign] of [[left,saved[0],1],[right,saved[1],-1]]){
     mount.position.copy(start);
     const world=mount.parent.localToWorld(start.clone()).addScaledVector(direction,sign*distance/2);
     mount.position.copy(mount.parent.worldToLocal(world));
    }
    return external.distances();
   },indices);
   probes.push({direction:direction.toArray(),blockedAt:hit.blockedAt,pair:hit.index===null?null:external.pairs[hit.index]});
   left.position.copy(saved[0]);right.position.copy(saved[1]);rig.root.updateWorldMatrix(true,true);
  }
  return {pass:contact.hookedGripCandidate.pass&&probes.every(p=>p.blockedAt!==null),contact,probes,certified:false};
 }finally{
  left.position.copy(saved[0]);right.position.copy(saved[1]);rig.root.updateWorldMatrix(true,true);
 }
}
