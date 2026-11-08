import * as THREE from 'three';
import {createExternalHandCollisionPairs} from './external-hand-collisions.js';

// Geometric task criteria, not proof of mechanical grip or anatomical feasibility.
// Keep reach success separate from contact safety; all negative margins are reported.
export function inspectHandContact(rig,{targets,tolerance=.005}={}){
 const {root,joints,hands}=rig;
 root.updateWorldMatrix(true,true);
 const byId=Object.fromEntries(joints.map(j=>[j.id,j]));
 const tip=side=>{
  const joint=byId[side+'Middle3'],mesh=joint.group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
  const length=mesh.geometry.parameters.height+2*mesh.geometry.parameters.radius;
  return joint.group.localToWorld(new THREE.Vector3(0,-length,0));
 };
 const residuals=targets?Object.fromEntries(['left','right'].map(side=>[side,tip(side).distanceTo(new THREE.Vector3(...targets[side]))])):null;
 const external=createExternalHandCollisionPairs(rig),values=external.distances();
 const pairs=external.pairs.map((pair,i)=>({...pair,gap:values[i]}));
 const overlaps=pairs.filter(p=>p.gap< -1e-9);
 const contacts=pairs.filter(p=>!p.kind.endsWith('core')&&p.gap>=-1e-9&&p.gap<=tolerance);
 const normal=side=>new THREE.Vector3(0,0,-1).applyQuaternion(hands[side].wrist.getWorldQuaternion(new THREE.Quaternion()));
 const normalDot=normal('left').dot(normal('right'));
 const opposed=normalDot<-.8;
 const curled=Object.fromEntries(['left','right'].map(side=>[side,['Index','Middle','Ring','Little'].filter(finger=>
  byId[side+finger+'2'].group.rotation.x>Math.PI/6&&byId[side+finger+'3'].group.rotation.x>Math.PI/12)]));
 // Two independently contacting fingers on EACH hand; curled fists alone cannot pass.
 const hookedContacts=contacts.filter(p=>p.kind==='opposite-fingers'&&/([23])$/.test(p.a)&&/([23])$/.test(p.b)&&
  curled.left.some(f=>p.a.includes(f))&&curled.right.some(f=>p.b.includes(f)));
 const distinct=side=>new Set(hookedContacts.map(p=>(side==='left'?p.a:p.b).replace(/[123]$/,''))).size;
 const safe=overlaps.length===0;
 return {
  fingertipReach:{pass:!!residuals&&Object.values(residuals).every(d=>d<=tolerance),residuals},
  opposedContact:{pass:safe&&opposed&&contacts.length>0,normalDot,contacts},
  hookedGripCandidate:{pass:safe&&opposed&&distinct('left')>=2&&distinct('right')>=2,curled,contacts:hookedContacts,certified:false},
  overlaps,externalClear:safe,
 };
}
