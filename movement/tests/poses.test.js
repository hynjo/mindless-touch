import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {basicPoses,yogaPoses} from '../poses.js';
import {createBody} from '../body.js';
import {applyHandPreset} from '../hands.js';
import {createSelfConstraints} from '../self-constraints.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {placeHandsAndKnees,placePalmsOnFloor,palmsAreSupported} from '../palm-support.js';
test('all 167 library poses clear the floor and nonadjacent body volumes',()=>{
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 const meshes=[];body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 const floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
 assert.equal(new Set(yogaPoses.map(p=>p.id)).size,167);
 assert.equal(new Set(yogaPoses.map(p=>p.source)).size,167);
 assert.equal(yogaPoses.filter(p=>p.draft).length,155);
 for(const pose of yogaPoses){
  body.root.position.fromArray(pose.rootPosition);
  for(const {id,group} of body.joints)group.rotation.set(...(pose.rotations[id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
  if(pose.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(palmsAreSupported(pose))placePalmsOnFloor(rig);
  floor.settle();body.root.updateWorldMatrix(true,true);
  assert.deepEqual(self.contacts(1e-7),[],pose.name);
  if(pose.name==='Lizard') {
   const hip=rig.byId.rightHip.group,knee=rig.byId.rightKnee.group,ankle=rig.byId.rightAnkle.group;
   for(const hand of Object.values(body.hands))assert(Math.abs(hand.wrist.getWorldPosition(new THREE.Vector3()).y-.0157)<.002,'Lizard palms remain grounded');
   assert(Math.abs(hip.rotation.y)<Math.PI/12 && Math.abs(hip.rotation.z)<Math.PI/12,'Trailing hip must not acquire a half-turn');
   assert(knee.rotation.x>0 && knee.rotation.x<Math.PI*5/6,'Trailing knee flexes forward');
   assert(Math.abs(knee.rotation.y)<1e-6 && Math.abs(knee.rotation.z)<1e-6,'Knee stays on its hinge axis');
   assert(new THREE.Vector3(0,0,1).applyQuaternion(knee.getWorldQuaternion(new THREE.Quaternion())).y<-.5,'Trailing knee faces down, not the ceiling');
   assert(Math.abs(ankle.rotation.x)<Math.PI/3,'Foot does not compensate with a reversed ankle');
  }
  for(const mesh of meshes){const positions=mesh.geometry.attributes.position;
   for(let i=0;i<positions.count;i++)assert(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).y>=-1e-7,pose.name);
  }
 }
});
test('Cat–Cow bends pelvis, lumbar and thoracic joints while palms and knees stay anchored',()=>{
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 const byId=Object.fromEntries(body.joints.map(j=>[j.id,j]));
 const rig={...body,byId,dimensions};
 const cat=basicPoses.find(p=>p.name==='Cat'),cow=basicPoses.find(p=>p.name==='Cow');
 const pos=group=>group.getWorldPosition(new THREE.Vector3());
 let anchors;
 for(let frame=0;frame<=40;frame++){
  const mix=frame/40;
  body.root.position.set(0,.46,0);
  for(const {id,group} of body.joints){const a=cat.rotations[id]||[0,0,0],b=cow.rotations[id]||[0,0,0];group.rotation.set(...a.map((v,i)=>THREE.MathUtils.degToRad(v+(b[i]-v)*mix)));}
  placeHandsAndKnees(rig);
  const current=['left','right'].flatMap(side=>[pos(body.hands[side].wrist),pos(byId[side+'Knee'].group)]);
  if(!anchors)anchors=current;
  current.forEach((point,i)=>assert(point.distanceTo(anchors[i])<.0001,`Support moved at ${frame}`));
  assert(Math.abs(body.waist.rotation.x-THREE.MathUtils.degToRad(25-45*mix))<1e-8);
  assert(Math.abs(body.torso.rotation.x-THREE.MathUtils.degToRad(25-45*mix))<1e-8);
 }
});
