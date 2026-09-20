import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {capturePose} from '../pole-constraints.js';
import {inspectScheduledHolds} from '../scheduled-supports.js';
function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
 body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};
 const mountain=yogaPoses.find(p=>p.name==='Mountain');body.root.position.fromArray(mountain.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(mountain.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 createFloorConstraints(rig).settle();
 const frame=capturePose(body.root,body.joints),schedule={version:1,anchors:['left-sole','right-sole'].map(anchor=>({anchor,start:true,end:true}))};
 return {rig,frames:[frame,frame,frame],steps:[{supportRequirements:['soles'],contactSchedule:schedule},{supportRequirements:['soles']}]};
}
test('scheduled hold validation preserves the currently edited pose and accepts grounded endpoints',()=>{
 const {rig,steps,frames}=fixture();rig.root.position.y+=.07;
 const before=capturePose(rig.root,rig.joints);assert.deepEqual(inspectScheduledHolds(rig,steps,frames),[]);
 assert.deepEqual(capturePose(rig.root,rig.joints),before);
});
test('schedule cannot omit one required sole or claim a floating endpoint is grounded',()=>{
 const {rig,steps,frames}=fixture();steps[0].contactSchedule.anchors.pop();
 assert(inspectScheduledHolds(rig,steps,frames).some(i=>/omits required/.test(i.reason)));
 steps[0].contactSchedule.anchors.push({anchor:'right-sole',start:true,end:true});
 frames[1]=structuredClone(frames[1]);frames[1].position=new THREE.Vector3().copy(frames[0].position).add(new THREE.Vector3(0,.04,0));
 // Cloned frame quaternions need their Three.js prototypes for pose restoration.
 frames[1].rotations=frames[0].rotations;frames[1].handOffsets=frames[0].handOffsets;
 assert(inspectScheduledHolds(rig,steps,frames).some(i=>/End contact is not satisfied/.test(i.reason)));
});
test('a sole-pair declaration cannot pass preflight merely because feet touch the floor',()=>{
 const {rig,steps,frames}=fixture();steps[0].supportRequirements=['soles','sole-pair'];
 steps[0].contactSchedule.anchors.push({anchor:'sole-pair',start:true,end:true});
 const issues=inspectScheduledHolds(rig,steps,frames);
 assert(issues.some(i=>/Start contact is not satisfied: sole-pair/.test(i.reason)));
});
test('outgoing schedule needs a destination and neighboring schedules must agree',()=>{
 const {rig,steps,frames}=fixture();
 assert(inspectScheduledHolds(rig,steps.slice(0,1),frames.slice(0,1)).some(i=>/following pose/.test(i.reason)));
 steps.push({supportRequirements:['soles']});steps[1].contactSchedule={version:1,anchors:[{anchor:'left-sole',start:true,end:true}]};
 assert(inspectScheduledHolds(rig,steps,frames).some(i=>/disagree/.test(i.reason)));
});
