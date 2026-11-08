import assert from 'node:assert/strict';
import {test} from 'node:test';
import {inspectTransitionSupports} from '../transition-supports.js';
import {addTransitionSteps} from '../transition-steps.js';
import * as T from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {capturePose,restorePose} from '../pole-constraints.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {createSelfConstraints} from '../self-constraints.js';
import {blendHandOffsets} from '../hand-offsets.js';
import {placeHandsAndKnees,placePalmsOnFloor,preparePalmLanding,palmsAreSupported} from '../palm-support.js';
test('legacy Big Toe to Cow route passes collision checks but loses required supports',()=>{
const material=new T.MeshStandardMaterial(),dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const rig=createBody({scene:new T.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});
rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});
const floor=createFloorConstraints(rig),self=createSelfConstraints(rig);
const steps=['Big Toe','Cow'].map(name=>yogaPoses.find(p=>p.name===name));
if(steps.some(p=>!p))throw new Error('Pose not found');
const frames=steps.map(p=>{applyPose(rig,p,{floor});const palm=Object.values(rig.hands).every(h=>new T.Vector3(0,0,-1).applyQuaternion(h.wrist.getWorldQuaternion(new T.Quaternion())).distanceTo(new T.Vector3(0,-1,0))<.001&&Math.abs(h.palm.localToWorld(new T.Vector3(0,0,-.015)).y-.0007)<.001);p={...p,floorSupport:palm?(p.floorSupport==='palms-knees'?'palms-knees':'palms'):'ground'};return {pose:capturePose(rig.root,rig.joints),step:p};});
const stored=frames.map(({pose,step})=>({...step,pose:{rootPosition:pose.position.toArray(),handOffsets:Object.fromEntries(Object.entries(pose.handOffsets).map(([k,v])=>[k,v.toArray()])),rotations:Object.fromEntries(rig.joints.map((j,i)=>[j.id,new T.Euler().setFromQuaternion(pose.rotations[i]).toArray().slice(0,3)]))}}));
const routed=addTransitionSteps(stored);assert.equal(routed.length,4);assert.equal(addTransitionSteps(routed).length,4);
frames.length=0;for(const step of routed){applyPose(rig,step,{floor});frames.push({step,pose:capturePose(rig.root,rig.joints)});}
for(const frame of frames){restorePose(rig.root,rig.joints,frame.pose);assert.deepEqual(self.contacts(),[]);assert.deepEqual(self.jointViolations(),[]);}
let lost=false;
for(const delta of [1/60,1/120,.1,1]){for(let edge=0;edge<frames.length-1;edge++){
 restorePose(rig.root,rig.joints,frames[edge].pose);floor.sync?.();self.sync();
 for(let time=delta;time<=2.2+delta;time+=delta){const progress=Math.min(1,time/2.2),mix=progress*progress*(3-2*progress),from=frames[edge].pose,to=frames[edge+1].pose;
 blendHandOffsets(rig.root,from.handOffsets,to.handOffsets,mix);rig.root.position.lerpVectors(from.position,to.position,mix);rig.joints.forEach((j,i)=>j.group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],mix));
 const a=frames[edge].step,b=frames[edge+1].step,start=palmsAreSupported(a),end=palmsAreSupported(b);
 if(a.floorSupport==='palms-knees'&&b.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(start&&end)placePalmsOnFloor(rig);else if(start||end)preparePalmLanding(rig);
 if((a.floorSupport&&b.floorSupport)||floor.clearance()<.0007)floor.settle();
 const inspection=inspectTransitionSupports(rig,a,b,mix);if(edge===1&&!inspection.pass)lost=true;
 assert(self.commit(),JSON.stringify({edge,delta,time,failure:self.failure()}));assert(floor.clearance()>=.0007-1e-8);
 }
}

}

assert(lost,'Legacy route must not be accepted by support validation');
});
