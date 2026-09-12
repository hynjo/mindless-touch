import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {createFloorConstraints,floorClearance,FLOOR_SKIN} from '../floor-constraints.js';
import {createTimeline} from '../playback.js';
import {sunSalutation} from '../examples.js';
import {placePalmsOnFloor,palmsAreSupported,preparePalmLanding} from '../palm-support.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function fixture() {
  const scene=new THREE.Scene(),material=new THREE.MeshStandardMaterial();
  const body=createBody({scene,dimensions,bodyMaterial:material,jointMaterial:material});
  const meshes=[];body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
  const floor=createFloorConstraints({...body,meshes});floor.settle();
  return {...body,floor,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
}
test('floor uses rotated body volumes, not just joint centers',()=>{
  const part=new THREE.Mesh(new THREE.SphereGeometry(1));part.scale.set(.1,.3,.1);part.position.y=.2;part.updateMatrixWorld();assert(floorClearance(part)<0);
  part.rotation.z=Math.PI/2;part.updateMatrixWorld();assert(Math.abs(floorClearance(part)-.1)<1e-8);
});
test('downward body drags stop at the floor and upward drags remain available',()=>{
  const {root,floor}=fixture();const start=root.position.y;root.position.y-=3;
  assert.equal(floor.commit(),false);assert(Math.abs(root.position.y-start)<.0001);
  root.position.y+=.3;assert(floor.commit());assert(floor.clearance()>.29);
});
test('the complete yoga timeline stays above the floor, including support changes',()=>{
  const rig=fixture();const {root,joints,floor}=rig;
  const frames=sunSalutation.steps.map(step=>{
    root.position.fromArray(step.rootPosition);
    for(const joint of joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
    if(palmsAreSupported(step))placePalmsOnFloor(rig);
    floor.settle();return floor.snapshot().pose;
  });
  const timeline=createTimeline(sunSalutation.steps);
  for(let time=0;time<=timeline.duration+.05;time+=.05) {
    const sample=timeline.sample(time),from=frames[sample.index],to=frames[sample.next];
    root.position.lerpVectors(from.position,to.position,sample.mix);
    joints.forEach(({group},i)=>group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],sample.mix));
    const a=palmsAreSupported(sunSalutation.steps[sample.index]),b=palmsAreSupported(sunSalutation.steps[sample.next]);
    if(a&&b)placePalmsOnFloor(rig);else if(a||b)preparePalmLanding(rig);
    floor.settle();assert(floor.clearance()>=FLOOR_SKIN-1e-8);
    if(a&&b)for(const hand of Object.values(rig.hands)){
      assert(Math.abs(floorClearance(hand.palm)-FLOOR_SKIN)<.0001,`Palm detached at ${time}`);
      const normal=new THREE.Vector3(0,0,-1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
      assert(normal.distanceTo(new THREE.Vector3(0,-1,0))<1e-8);
    }
    assert(floor.contacts().length>0);
  }
  const ids=sunSalutation.steps.map(step=>step.id);
  assert(ids.indexOf('plant-hands')<ids.indexOf('step-back'));
  assert(ids.indexOf('step-forward')<ids.indexOf('step-together'));
  assert(ids.indexOf('step-together')<ids.indexOf('half-lift-end'));
  assert(root.position.distanceTo(frames.at(-1).position)<1e-8);
});
test('both Forward Folds keep rendered hand vertices above the floor with flat palms',()=>{
 const rig=fixture();
 for(const step of sunSalutation.steps.filter(step=>step.id.startsWith('fold-'))){
  assert.equal(step.floorSupport,'palms');
  rig.root.position.fromArray(step.rootPosition);
  for(const joint of rig.joints)joint.group.rotation.set(...(step.rotations[joint.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
  placePalmsOnFloor(rig);rig.floor.settle();rig.root.updateWorldMatrix(true,true);
  for(const hand of Object.values(rig.hands)){
   for(const mesh of hand.meshes){
    const vertices=mesh.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++)assert(new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld).y>=-1e-7);
   }
   const normal=new THREE.Vector3(0,0,-1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
   assert(normal.distanceTo(new THREE.Vector3(0,-1,0))<1e-8);
  }
 }
});
