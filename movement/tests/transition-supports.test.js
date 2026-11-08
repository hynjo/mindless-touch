import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {applyPose} from '../apply-pose.js';
import {yogaPoses} from '../poses.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {changesFootSupport,inspectTransitionSupports} from '../transition-supports.js';
function fixture(){
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43},material=new THREE.MeshStandardMaterial();
 const rig=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});rig.dimensions=dimensions;rig.byId=Object.fromEntries(rig.joints.map(j=>[j.id,j]));rig.meshes=[];rig.root.traverse(m=>{if(m.isMesh)rig.meshes.push(m)});return {...rig,floor:createFloorConstraints(rig)};
}
test('shared palm support cannot be replaced with fingertips',()=>{
 const rig=fixture(),cow=yogaPoses.find(p=>p.name==='Cow');applyPose(rig,cow,{floor:rig.floor});
 const a={supportRequirements:['palms','knees']},b={supportRequirements:['palms','forefeet']};
 assert(inspectTransitionSupports(rig,a,b,.5).pass);
 // Tilt palm upright, then floor settling protects fingers by lifting the body.
 for(const side of ['left','right'])rig.byId[side+'Wrist'].group.rotation.set(0,0,0);
 rig.floor.settle();const result=inspectTransitionSupports(rig,a,b,.5);
 assert.equal(result.pass,false);assert(result.startIssues.some(i=>i.name==='palms'));
});
test('legacy route support intent survives missing metadata and unknown intent is explicit',()=>{
 const rig=fixture();
 const r=inspectTransitionSupports(rig,{kind:'transition',name:'Release hands'},{kind:'transition',name:'Prepare palm landing'},.5);
 assert.equal(r.evaluated,true);
 assert.equal(inspectTransitionSupports(rig,{}, {},.5).evaluated,false);
});
test('composite opposite-leg support activates ankle-aware foot transfer',()=>{
 assert.equal(changesFootSupport({supportRequirements:['palms','forefeet']},{supportRequirements:['palms','opposite-sole-toe']}),true);
 assert.equal(changesFootSupport({supportRequirements:['palms','toes']},{supportRequirements:['palms','toes']}),false);
});
