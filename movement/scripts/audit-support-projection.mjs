// Read-only catalog audit: candidates remain in memory; only the report is written.
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {yogaPoses} from '../poses.js';
import {applyHandOffsets} from '../hand-offsets.js';
import {applyHandPreset} from '../hands.js';
import {createFloorConstraints} from '../floor-constraints.js';
import {placePalmsOnFloor,palmsAreSupported,placeHandsAndKnees} from '../palm-support.js';
import {capturePose} from '../pole-constraints.js';
import {projectSupportPose} from '../support-solver.js';

const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
const material=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material}),meshes=[];
body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});
const rig={...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))},floor=createFloorConstraints(rig);
const extra=new Set(['Lunge','Lizard','SideLunge','CrookedMonkey','Gate']);
const selected=yogaPoses.filter(p=>p.category==='Standing'||extra.has(p.source.split('/').at(-1)));
const count=result=>({supportFailures:result.supports.issues.length,requirements:result.supports.requirements.map(r=>r.name),failedSupports:result.supports.issues.map(r=>r.name),romFailures:result.rom.issues.length,selfContacts:result.contacts.length,wristFailures:result.wristIssues.length,floorClearanceMm:result.clearance*1000});
const records=[];
for(const pose of selected){
 applyHandOffsets(body.root,pose.handOffsets);body.root.position.fromArray(pose.rootPosition);
 for(const j of body.joints)j.group.rotation.set(...(pose.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 for(const hand of Object.values(body.hands))applyHandPreset(hand,'open');
 if(pose.floorSupport==='palms-knees')placeHandsAndKnees(rig);else if(palmsAreSupported(pose))placePalmsOnFloor(rig);
 floor.settle();
 const saved=capturePose(rig.root,rig.joints),worldBefore=rig.joints.map(j=>j.group.getWorldPosition(new THREE.Vector3()));
 const result=projectSupportPose(rig,pose),current=capturePose(rig.root,rig.joints);
 if(!result.accepted)assert.deepEqual(current,saved,`${pose.name}: rejected candidate changed the rig`);
 rig.root.updateWorldMatrix(true,true);
 records.push({name:pose.name,source:pose.source,category:pose.category,accepted:result.accepted,changed:result.changed,reason:result.reason,
  status:result.accepted?(result.changed?'projected':'baseline-unchanged'):'rejected',before:count(result.before),after:count(result.after),attempted:result.attempted?count(result.attempted):null,
  displacement:{rootMm:saved.position.distanceTo(current.position)*1000,maxJointDegrees:Math.max(...saved.rotations.map((q,i)=>THREE.MathUtils.radToDeg(q.angleTo(current.rotations[i])))),maxJointWorldMm:Math.max(...worldBefore.map((p,i)=>p.distanceTo(rig.joints[i].group.getWorldPosition(new THREE.Vector3()))))*1000},rollbackVerified:!result.accepted});
}
const summary={total:records.length,standing:records.filter(r=>r.category==='Standing').length,baselineUnchanged:records.filter(r=>r.status==='baseline-unchanged').length,projected:records.filter(r=>r.status==='projected').length,rejected:records.filter(r=>r.status==='rejected').length,
 maxAcceptedRootDisplacementMm:Math.max(0,...records.filter(r=>r.accepted).map(r=>r.displacement.rootMm)),maxAcceptedJointDisplacementDegrees:Math.max(0,...records.filter(r=>r.accepted).map(r=>r.displacement.maxJointDegrees)),allRejectedRolledBack:records.filter(r=>!r.accepted).every(r=>r.rollbackVerified)};
await writeFile(new URL('../support-projection-audit.json',import.meta.url),JSON.stringify({scope:'Standing catalog plus Lunge, Lizard, SideLunge, CrookedMonkey and Gate. Runtime placement first; no catalog poses rewritten.',summary,records},null,2)+'\n');
console.log(JSON.stringify({summary,projected:records.filter(r=>r.changed).map(r=>r.name),rejected:records.filter(r=>!r.accepted).map(r=>({name:r.name,reason:r.reason,support:r.before.failedSupports,rom:r.before.romFailures}))},null,2));
