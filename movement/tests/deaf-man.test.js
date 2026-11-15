import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuditRig,auditLibraryPose} from '../pose-audit.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {applyPose} from '../apply-pose.js';
import {inspectPose} from '../pose-validation.js';
import {mirrorRotations} from '../ashtanga-shapes.js';
import {supportProfile} from '../support-profiles.js';
import {serializeSequence,parseSequence,SEQUENCE_FORMAT} from '../sequence-file.js';
const pose=yogaPoses.find(p=>p.source.endsWith('/DeafMan'));
function fixture(step=pose){const rig=createAuditRig(),result=applyPose(rig,step,{floor:rig.floor});return {rig,result};}
for(const mirrored of [false,true])test(`Deaf Man preparation ${mirrored?'mirrored':'original'} grounds head, back and both arms without exceeding the editor envelope`,()=>{
 const step={...pose,rotations:mirrored?mirrorRotations(pose.rotations):pose.rotations},{rig,result}=fixture(step),report=inspectPose(rig,step);
 assert.equal(result.accepted,true);assert.deepEqual(report.supports.issues,[]);assert.deepEqual(report.rom.issues,[]);assert.deepEqual(report.form.issues,[]);
 for(const side of ['left','right'])for(const part of ['upper-arm','forearm','knee','foot-top'])assert(report.supports.surfaces[side+'-'+part].gapMm<5);
 assert.deepEqual(rig.self.contacts(0),[]);assert.deepEqual(rig.self.headContacts(0),[]);assert.deepEqual(rig.self.externalContacts(0),[]);assert.deepEqual(rig.self.jointViolations(),[]);
 assert(rig.floor.clearance()>=.0007-1e-9);
});
test('former shoulder-stand-derived draft cannot satisfy grounded Deaf Man supports',()=>{
 const {rig}=fixture(uncorrectedYogaPoses.find(p=>p.source===pose.source)),report=inspectPose(rig,pose);
 assert(report.supports.issues.some(i=>i.name==='forearms'));assert(report.form.issues.some(i=>i.name==='left arm extends along the floor'));
 assert.deepEqual(supportProfile({...pose,supportRequirements:[]}).requirements,supportProfile(pose).requirements);
});
test('lifting either arm or the head fails even if the other floor contacts remain',()=>{
 for(const side of ['left','right']){
  const {rig}=fixture();rig.byId[side+'Shoulder'].group.rotation.x+=.35;
  assert(inspectPose(rig,pose).supports.issues.some(i=>i.name==='forearms'));
 }
 const {rig}=fixture();rig.byId.neck.group.rotation.x+=.6;
 assert(inspectPose(rig,pose).supports.issues.some(i=>i.name==='back-head'));
});
test('preparation never claims a completed ear bind or interlaced grip',()=>{
 assert(pose.name.includes('Preparation'));assert(pose.modification.includes('arms apart'));
 const audit=auditLibraryPose(createAuditRig(),pose,{display_name:'Deaf Man'});
 assert.notEqual(audit.status,'scoped-pass');
 assert.notEqual(audit.relations.find(t=>t.kind==='knees-ears').status,'validated');
 assert.notEqual(audit.relations.find(t=>t.kind==='hands-together').status,'validated');
});
test('saved and loaded preparation retains its contacts and form contract',()=>{
 const {rig}=fixture(),context={studio:'movement',dimensions:rig.dimensions,jointIds:rig.joints.map(j=>j.id)};
 const step={...pose,pose:{rootPosition:rig.root.position.toArray(),rotations:Object.fromEntries(rig.joints.map(j=>[j.id,j.group.rotation.toArray().slice(0,3)])),poleContacts:{}}};
 const doc={format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:rig.dimensions,name:'Preparation',steps:[step]};
 const restored=parseSequence(serializeSequence(doc,context),context).steps[0],other=fixture(restored).rig,report=inspectPose(other,restored);
 assert.equal(restored.poseContract,pose.poseContract);assert.deepEqual(report.supports.issues,[]);assert.deepEqual(report.rom.issues,[]);assert.deepEqual(report.form.issues,[]);
});
