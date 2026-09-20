import * as THREE from 'three';
import {floorClearance,FLOOR_SKIN} from './floor-constraints.js';

// Crow's knee-region contact is between bodies, not a floor anchor. Use the
// distal thigh / proximal shin capsule ends; the rig has no patella landmark.
export function inspectCrowSupport({root,byId}){
 root.updateWorldMatrix(true,true);
 const samples=['left','right'].map(side=>{
  const meshFor=part=>byId[side+part].group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
  const arm=meshFor('Shoulder'),half=arm.geometry.parameters.height/2;
  const a=arm.localToWorld(new THREE.Vector3(0,-half,0)),b=arm.localToWorld(new THREE.Vector3(0,half,0)),axis=b.clone().sub(a);
  const patches=['Hip','Knee'].map(part=>{
   const mesh=meshFor(part),end=part==='Hip'?-1:1;
   const center=mesh.localToWorld(new THREE.Vector3(0,end*mesh.geometry.parameters.height/2,0));
   const t=THREE.MathUtils.clamp(center.clone().sub(a).dot(axis)/axis.lengthSq(),0,1);
   const delta=center.sub(a.clone().addScaledVector(axis,t));
   return {part,gapMm:(delta.length()-mesh.geometry.parameters.radius-arm.geometry.parameters.radius)*1000,alignment:delta.normalize().y};
  });
  const patch=patches.reduce((best,p)=>p.gapMm<best.gapMm?p:best);
  const elbow=byId[side+'Elbow'].group;
  const direction=new THREE.Vector3(0,-1,0).applyQuaternion(elbow.quaternion);
  const bend=-THREE.MathUtils.radToDeg(Math.atan2(-direction.z,-direction.y));
  return {side,...patch,elbowDegrees:bend,pass:patch.gapMm>=-1&&patch.gapMm<=5&&patch.alignment>=.5&&bend>=60&&bend<=110};
 });
 const legMeshes=[];
 for(const side of ['left','right'])byId[side+'Hip'].group.traverse(node=>{if(node.isMesh)legMeshes.push(node);});
 const clearanceMm=Math.min(...legMeshes.map(mesh=>floorClearance(mesh)-FLOOR_SKIN))*1000;
 return {
  'crow-knees-on-arms':{name:'crow-knees-on-arms',kind:'relation',gapMm:Math.max(...samples.map(p=>p.gapMm)),minGapMm:Math.min(...samples.map(p=>p.gapMm)),samples,pass:samples.every(p=>p.pass),note:'Both knee regions contact the upper sides of bent upper arms. Capsule proxy; no force or balance certification.'},
  'legs-airborne':{name:'legs-airborne',kind:'clearance',gapMm:clearanceMm,minGapMm:clearanceMm,pass:clearanceMm>10,note:'All leg and foot meshes must clear the floor by more than 10 mm.'},
 };
}
