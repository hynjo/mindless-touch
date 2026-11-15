import * as THREE from 'three';
import {capsuleEllipsoidGap,handFootContacts} from './toe-grip.js';
import {segmentDistance} from './self-constraints.js';
import {boxDistance} from './hand-collisions.js';

export function crookedMonkeySides(rig){
 const flexion=side=>-new THREE.Euler().setFromQuaternion(rig.byId[side+'Hip'].group.quaternion,'XZY').x;
 const front=flexion('left')>=flexion('right')?'left':'right';
 return {front,rear:front==='left'?'right':'left'};
}
function capsule(mesh){
 const half=(mesh.geometry.parameters.height||0)/2;
 return {a:mesh.localToWorld(new THREE.Vector3(0,-half,0)),b:mesh.localToWorld(new THREE.Vector3(0,half,0)),r:mesh.geometry.parameters.radius};
}
const capsuleMesh=joint=>joint.group.children.find(mesh=>mesh.geometry?.type==='CapsuleGeometry');

// Primitive contact evidence for the static rear-heel hold, not force/friction
// simulation. Include the palm, all fingers, both feet and both legs in clearance.
export function inspectRearFootGrip(rig){
 rig.root.updateWorldMatrix(true,true);
 const {front,rear}=crookedMonkeySides(rig),hand=rig.hands[front],heel=rig.feet[rear].sole;
 const fingers=['Index','Middle'].map(finger=>{
  const joints=hand.joints.filter(j=>j.finger===finger),gaps=joints.map(j=>capsuleEllipsoidGap(capsule(capsuleMesh(j)),heel));
  const bends=joints.map(j=>THREE.MathUtils.radToDeg(j.group.rotation.x));
  return {finger,gapsMm:gaps.map(g=>g*1000),bends,pass:gaps.every(g=>g>=-.0005)&&gaps.slice(1).every(g=>g<=.005)&&bends[1]>=35&&bends[2]>=20};
 });
 const thumb=hand.joints.filter(j=>j.finger==='Thumb').map(j=>capsuleEllipsoidGap(capsule(capsuleMesh(j)),heel));
 const thumbPass=thumb.every(g=>g>=-.0005)&&thumb.some(g=>g<=.005);
 const contacts=handFootContacts(rig);
 for(const side of ['left','right'])for(const joint of rig.joints.filter(j=>/Hip$|Knee$/.test(j.id))){
  const limb=capsule(capsuleMesh(joint));
  for(const mesh of rig.hands[side].meshes.filter(m=>!m.userData.handNail)){
   let gap;
   if(mesh.userData.boxHalfExtents)gap=boxDistance(mesh.worldToLocal(limb.a.clone()),mesh.worldToLocal(limb.b.clone()),mesh.userData.boxHalfExtents)-limb.r;
   else {const c=capsule(mesh);gap=segmentDistance(c.a,c.b,limb.a,limb.b)-c.r-limb.r;}
   if(gap<-.0005)contacts.push({hand:side,limb:joint.id,part:mesh.userData.fingerJoint?.id||'palm',depth:-gap});
  }
 }
 const gaps=fingers.flatMap(f=>f.gapsMm).concat(thumb.map(g=>g*1000));
 return {name:'rear-foot-grip',kind:'relation',frontSide:front,rearSide:rear,fingers,thumbGapsMm:thumb.map(g=>g*1000),contacts,gapMm:Math.max(...fingers.flatMap(f=>f.gapsMm.slice(1)),Math.min(...thumb.map(g=>g*1000))),minGapMm:Math.min(...gaps),pass:fingers.every(f=>f.pass)&&thumbPass&&contacts.length===0,note:'Free-hand index/middle hooks and thumb meet the opposite raised heel within 5 mm; hand/foot and hand/leg primitive overlaps exceeding 0.5 mm are rejected. Static contact does not certify grip forces or a transition.'};
}
