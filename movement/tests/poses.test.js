import {applyHandOffsets} from '../hand-offsets.js';
import {wristAngles} from '../wrist-constraints.js';
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
  applyHandOffsets(body.root,pose.handOffsets);
  body.root.position.fromArray(pose.rootPosition);
  for(const {id,group} of body.joints)group.rotation.set(...(pose.rotations[id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
  if(pose.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(palmsAreSupported(pose))placePalmsOnFloor(rig);
  floor.settle();body.root.updateWorldMatrix(true,true);
  assert.deepEqual(self.contacts(1e-7),[],pose.name);
  assert.deepEqual(self.jointViolations(),[],`${pose.name}: wrist direction limits`);
  if(pose.name==='Camel'||pose.name==='Dolphin') {
   for(const side of ['left','right']){
    const isCamel=pose.name==='Camel',joint=rig.byId[side+(isCamel?'Knee':'Elbow')].group;
    const mesh=joint.children.find(m=>m.geometry?.type==='CapsuleGeometry');
    const radius=mesh.geometry.parameters.radius;
    for(const y of [-mesh.geometry.parameters.height/2,0,mesh.geometry.parameters.height/2]){
     const support=mesh.localToWorld(new THREE.Vector3(0,y,isCamel?radius:-radius));
     assert(Math.abs(support.y-.0007)<1e-6,`${pose.name}: whole support segment stays on the floor`);
    }
    assert(Math.abs(joint.getWorldPosition(new THREE.Vector3()).y-radius-.0007)<1e-6,`${pose.name}: joint support height`);
    if(!isCamel)for(const x of [-.018,.018])for(const y of [-.025,.025])assert(Math.abs(body.hands[side].palm.localToWorld(new THREE.Vector3(x,y,-.015)).y-.0007)<1e-6,'Dolphin palms lie flat alongside forearms');
   }
  }
  if(pose.name==='Caterpillar') {
   for(const hand of Object.values(body.hands)){
    assert(Math.abs(wristAngles(hand.wrist.quaternion).bend)<THREE.MathUtils.degToRad(75),'Caterpillar leaves wrist extension margin');
    const dorsal=new THREE.Vector3(0,0,1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
    assert(dorsal.y>.999999,'The striped back of the hand faces away from the floor');
    const normal=new THREE.Vector3(0,0,-1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
    assert(normal.distanceTo(new THREE.Vector3(0,-1,0))<1e-6,'Caterpillar palm faces the floor');
    // Both the heel and the finger-side edge of each palm share the support plane.
    for(const x of [-.018,.018])for(const y of [-.025,.025]){
     const point=hand.palm.localToWorld(new THREE.Vector3(x,y,-.015));
     assert(Math.abs(point.y-.0007)<1e-6,'The whole palm, not only the fingertips, stays grounded');
    }
   }
  }
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
