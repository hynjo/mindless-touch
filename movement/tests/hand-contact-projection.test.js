import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {projectHandContact} from '../hand-contact-projection.js';
import {createSelfConstraints} from '../self-constraints.js';
import {inspectPose} from '../pose-validation.js';
const seeds=JSON.parse(readFileSync(new URL('../hand-grip-solver-results.json',import.meta.url)));
function fixture(s){
 const material=new THREE.MeshStandardMaterial(),dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const rig=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
 rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
 rig.root.position.copy(s.pose.position);rig.joints.forEach((j,i)=>j.group.quaternion.fromArray(s.pose.rotations[i]));
 for(const side of ['left','right'])rig.hands[side].root.position.copy(s.pose.handOffsets[side]);return rig;
}
for(const seed of seeds)test(`seed ${seed.seed}: projection closes both gaps but rejects freely separating contact`,()=>{
 const rig=fixture(seed),before=capturePose(rig.root,rig.joints),r=projectHandContact(rig,{apply:true});
 assert(r.after.every((gap,i)=>gap>=0&&gap<.0002&&gap<r.before[i]));
 assert.equal(r.success,false);assert(r.retention.contact.hookedGripCandidate.pass);
 assert.equal(r.retention.probes.length,5);assert(r.retention.probes.every(p=>p.blockedAt===null));
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
 restorePose(rig.root,rig.joints,r.candidate);
 const self=createSelfConstraints(rig),report=inspectPose(rig,{supportRequirements:['sit-bones']});
 assert.deepEqual(self.contacts(0),[]);assert.deepEqual(self.externalContacts(1e-9),[]);
 assert.deepEqual(report.supports.issues,[]);assert.deepEqual(report.rom.issues,[]);
 for(const [i,j] of rig.joints.entries())if(!/Shoulder|Elbow|Wrist/.test(j.id)&&!j.isFinger)assert(before.rotations[i].angleTo(r.candidate.rotations[i])<1e-7);
 assert.deepEqual(r.candidate.handOffsets,before.handOffsets);
});
test('projection is repeatable and rejects invalid budgets without mutation',()=>{
 const rig=fixture(seeds[0]),before=capturePose(rig.root,rig.joints);
 assert.deepEqual(projectHandContact(rig),projectHandContact(rig));
 assert.throws(()=>projectHandContact(rig,{iterations:-1}),RangeError);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
