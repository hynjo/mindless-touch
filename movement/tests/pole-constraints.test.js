import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {createPoleConstraints,poleClearance,minPoleClearance,POLE} from '../pole-constraints.js';
import {poleFlow} from '../pole-example.js';
import {createSelfConstraints} from '../self-constraints.js';
import {createTimeline} from '../playback.js';
import {samplePoleMotion} from '../pole-motion.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function fixture() {
  const scene=new THREE.Scene(),material=new THREE.MeshStandardMaterial();
  const body=createBody({scene,dimensions,bodyMaterial:material,jointMaterial:material});
  const byId=Object.fromEntries(body.joints.map(j=>[j.id,j]));
  const meshes=[];body.root.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
  const chain=id=>{const side=id.startsWith('left')?'left':'right';return {upper:byId[side+'Shoulder'].group,middle:byId[side+'Elbow'].group,end:byId[side+'Wrist'].group,a:.29,b:.26};};
  const physics=createPoleConstraints({...body,chain,meshes});
  const apply=step=>{body.root.position.fromArray(step.rootPosition);for(const j of body.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));physics.settle();};
  return {...body,physics,meshes,apply};
}
test('collision volumes detect an enclosed pole and a capsule crossing with clear endpoints',()=>{
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1));sphere.scale.set(.2,.3,.1);sphere.position.y=1;sphere.updateMatrixWorld();assert(poleClearance(sphere)<0);
  const capsule=new THREE.Mesh(new THREE.CapsuleGeometry(.03,.6));capsule.rotation.z=Math.PI/2;capsule.position.y=1;capsule.updateMatrixWorld();assert(poleClearance(capsule)<0);
  capsule.position.z=.06;capsule.updateMatrixWorld();assert(poleClearance(capsule)>0);
  sphere.position.y=4;sphere.updateMatrixWorld();assert.equal(poleClearance(sphere),Infinity);
});
test('fast whole-body drags stop at the pole rather than tunnelling to its opposite side',()=>{
  const {root,physics}=fixture();root.position.set(0,.97,.6);physics.settle();root.position.z=-.6;
  assert.equal(physics.commit(),false);assert(root.position.z>0);assert(physics.clearance()>=POLE.skin-.00002);
});
test('all authored grip poses fit both hands without penetrating the pole',()=>{
  const {hands,root,physics,apply}=fixture();
  for(const step of poleFlow.steps.filter(s=>Object.keys(s.contacts).length)) {
    apply(step);
    for(const side of ['left','right']) {
      assert(physics.attach(side,{height:step.contacts[side+'Wrist'][1],angle:step.orbit.angle}),`${step.id}: ${side} grip must attach`);
      assert(physics.clearance()>=POLE.skin-.00002,`${step.id}: body clearance`);
      const fingers=hands[side].meshes.filter(m=>m.userData.fingerJoint);
      for (const finger of ['Thumb','Index','Middle','Ring','Little']) assert(minPoleClearance(root,fingers.filter(m=>m.userData.fingerJoint.finger===finger))<.0015,`${step.id}: ${finger} should contact the surface`);
    }
  }
});
test('grip limits reach and release allows movement again; serialization restores contacts',()=>{
  const {root,physics,apply}=fixture();apply(poleFlow.steps[1]);assert(physics.attach('left',{height:1.7,angle:0}));
  const snapshot=physics.snapshot();root.position.z+=2;
  assert.equal(physics.commit(),false);assert(root.position.z<1);
  physics.release('left');root.position.z=2;assert(physics.commit());
  physics.restore(snapshot);assert(physics.grips.has('left'));assert(root.position.distanceTo(snapshot.pose.position)<1e-9);
});

test('full pole flow reaches the finish without penetration or blocked motion',()=>{
  const {root,joints,physics,apply}=fixture();
  const self=createSelfConstraints({root,joints});
  const snapshots=poleFlow.steps.map(step=>{
    apply(step);
    for(const side of ['left','right'])if(step.contacts[side+'Wrist'])assert(physics.attach(side,{height:step.contacts[side+'Wrist'][1],angle:step.orbit.angle}));
    return physics.snapshot();
  });
  const frames=snapshots.map(s=>({...s.pose,grips:s.grips}));
  physics.restore(snapshots[0]);self.sync();
  const timeline=createTimeline(poleFlow.steps),fingerIndices=joints.map((j,i)=>j.isFinger?i:-1).filter(i=>i>=0);
  for(let time=0;time<=timeline.duration+.05;time+=.05){
    const sample=timeline.sample(time),motion=samplePoleMotion(poleFlow.steps,frames,sample.index,sample.next,sample.mix,fingerIndices);
    root.position.copy(motion.position);joints.forEach(({group},i)=>group.quaternion.copy(motion.rotations[i]));
    physics.grips.clear();for(const [side,grip] of motion.grips)physics.grips.set(side,{...grip});
    assert(physics.commit(),`Blocked at ${time.toFixed(2)}s`);
    assert(physics.clearance()>=POLE.skin-.00002);
    assert.deepEqual(self.contacts(0),[],`Body overlap at ${time.toFixed(2)}s`);
    assert.deepEqual(self.jointViolations(),[],`Wrist limit at ${time.toFixed(2)}s`);
    assert(self.commit(),`Body sweep blocked at ${time.toFixed(2)}s`);
  }
  assert(root.position.distanceTo(new THREE.Vector3().fromArray(poleFlow.steps.at(-1).rootPosition))<1e-8);
});
