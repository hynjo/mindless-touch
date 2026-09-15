// Offline, conservative repairs: publish only candidates that restore required
// soles without new joint-limit issues or self collisions. Never flatten a lifted foot.
import {writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {uncorrectedYogaPoses as yogaPoses} from '../poses.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {placePalmsOnFloor,palmsAreSupported,placeHandsAndKnees} from '../palm-support.js';
import {inspectSupports,inspectJointRanges} from '../pose-validation.js';
import {solve} from '../rig.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))},floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
const pos=g=>g.getWorldPosition(new THREE.Vector3());
const orient=(g,q)=>g.quaternion.copy(g.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
const repairs={},report=[];
for(const pose of yogaPoses){
 applyHandOffsets(body.root,pose.handOffsets);body.root.position.fromArray(pose.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const h of Object.values(body.hands))applyHandPreset(h,'open');
 if(pose.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(palmsAreSupported(pose))placePalmsOnFloor(rig);
 floor.settle();
 const before=inspectSupports(rig,pose),romBefore=inspectJointRanges(body.joints).issues;
 const req=before.requirements.find(r=>['soles','any-sole'].includes(r.name));
 if(!req||req.pass)continue;
 const sides=req.name==='soles'?['left','right']:[['left','right'].sort((a,b)=>before.surfaces[a+'-sole'].gapMm-before.surfaces[b+'-sole'].gapMm)[0]];
 const anchors=Object.fromEntries(sides.map(side=>{
  const foot=body.feet[side],forward=new THREE.Vector3(0,0,1).applyQuaternion(foot.wrist.getWorldQuaternion(new THREE.Quaternion()));
  const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(forward.x,forward.z));
  foot.archJoint.group.rotation.set(THREE.MathUtils.degToRad(8),0,0);orient(foot.wrist,rotation);body.root.updateWorldMatrix(true,true);
  return [side,{rotation,target:pos(foot.wrist).setY(.0707),bend:pos(rig.byId[side+'Knee'].group)}];
 }));
 floor.settle();
 for(let i=0;i<12&&!inspectSupports(rig,pose).requirements.find(r=>r.name===req.name).pass;i++){
  const reach=dimensions.thigh+dimensions.shin-.001;
  const excess=Math.max(0,...sides.map(side=>pos(rig.byId[side+'Hip'].group).y-anchors[side].target.y-reach));
  body.root.position.y-=excess;body.root.updateWorldMatrix(true,true);
  for(const side of sides){
   const upper=rig.byId[side+'Hip'].group,middle=rig.byId[side+'Knee'].group,a=anchors[side];
   const start=pos(upper),target=a.target.clone(),horizontal=new THREE.Vector3(target.x-start.x,0,target.z-start.z);
   const max=Math.sqrt(Math.max(0,reach**2-(start.y-target.y)**2));if(horizontal.length()>max)horizontal.setLength(max);
   target.x=start.x+horizontal.x;target.z=start.z+horizontal.z;
   solve({upper,middle,a:dimensions.thigh,b:dimensions.shin},target,a.bend);
   orient(body.feet[side].wrist,a.rotation);
  }
  if(palmsAreSupported(pose))placePalmsOnFloor(rig);
  floor.settle();
 }
 const after=inspectSupports(rig,pose),rom=inspectJointRanges(body.joints).issues;
 const addedRom=rom.filter(r=>!romBefore.some(b=>b.joint===r.joint&&b.motion===r.motion&&b.excessDegrees>=r.excessDegrees));
 const preservesSupports=before.requirements.filter(r=>r.pass).every(r=>after.requirements.find(a=>a.name===r.name).pass);
 const accepted=after.requirements.find(r=>r.name===req.name).pass&&preservesSupports&&after.issues.length<before.issues.length&&!self.contacts().length&&!addedRom.length;
 report.push({name:pose.name,accepted,before:before.issues.map(r=>r.name),after:after.issues.map(r=>r.name),newRom:addedRom.length,collisions:self.contacts().length});
 if(accepted)repairs[pose.source.split('/').at(-1)]={rootPosition:body.root.position.toArray(),rotations:Object.fromEntries(body.joints.map(j=>[j.id,[j.group.rotation.x,j.group.rotation.y,j.group.rotation.z].map(THREE.MathUtils.radToDeg)]).filter(([id,angles])=>angles.some((value,i)=>Math.abs(value-(pose.rotations[id]?.[i]||0))>.00001)))};
}
await writeFile(new URL('../foot-support-corrections.json',import.meta.url),JSON.stringify(repairs,null,2)+'\n');
await writeFile(new URL('../foot-support-repair-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidates:report.length,repaired:Object.keys(repairs).length,remaining:report.filter(r=>!r.accepted)},null,2));
