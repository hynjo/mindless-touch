import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuditRig,auditLibraryPose,summarizeAudit} from '../pose-audit.js';
import {yogaPoses,uncorrectedYogaPoses} from '../poses.js';
import {referenceTasks} from '../pose-audit-reference.js';

const pose=key=>yogaPoses.find(p=>p.source.endsWith('/'+key));
const reference={display_name:'Audit fixture reference',two_sided:true};
test('the repaired Crooked Monkey is a control across original, mirror and JSON restore',()=>{
 const entry=pose('CrookedMonkey'),before=JSON.stringify(entry),audit=auditLibraryPose(createAuditRig(),entry,reference);
 assert.equal(audit.status,'scoped-pass');assert.equal(audit.roundTrip.pass,true);
 assert.deepEqual(audit.detected,[]);assert.deepEqual(audit.mirror.supportIssues,[]);assert.deepEqual(audit.mirror.formIssues,[]);
 assert.equal(audit.relations[0].status,'validated');assert.equal(JSON.stringify(entry),before);
});
test('nearby bounds never certify an unvalidated Bow hold',()=>{
 const audit=auditLibraryPose(createAuditRig(),pose('Bow'),reference);
 assert.equal(audit.relations[0].status,'near-unverified');assert.equal(audit.status,'review-required');
 assert(audit.coverage.includes('Required bind/contact has no precise validator'));
});
test('large missing cradle relationships produce measured findings even without a form contract',()=>{
 const audit=auditLibraryPose(createAuditRig(),pose('Cradle'),reference);
 assert(audit.detected.includes('reference-relationship'));
 assert(audit.relations.some(t=>t.required&&t.status==='separated'&&t.gapLowerBoundMm>100));
 assert.equal(audit.status,'measured-findings');
});
test('Deaf Man audit measures ear approach, grounded feet and extended floor arms independently',()=>{
 const audit=auditLibraryPose(createAuditRig(),uncorrectedYogaPoses.find(p=>p.source.endsWith('/DeafMan')),reference);
 for(const kind of ['hands-together','knees-ears','feet-floor','arms-floor']){
  const task=audit.relations.find(t=>t.kind===kind);assert(task,kind);assert.equal(task.status,'separated',kind);assert(task.gapLowerBoundMm>100,kind);
 }
 assert(audit.support.issues.some(r=>r.name==='back'));assert(audit.rom.issues.some(r=>r.joint==='leftHip'));
});
test('optional holds and explicitly named preparations are not flagged as failed full binds',()=>{
 const bridge=auditLibraryPose(createAuditRig(),pose('Bridge'),reference);
 assert.equal(bridge.relations.find(t=>t.kind==='hands-together').required,false);
 assert.equal(bridge.detected.includes('reference-relationship'),false);
 const prep=auditLibraryPose(createAuditRig(),pose('KneePileBind'),reference);
 assert.equal(prep.relations[0].status,'explicit-modification');
 assert.equal(prep.detected.includes('reference-relationship'),false);
 assert(prep.mirror.formIssues.length>0,'the existing side-specific contract is exposed by the mirror audit');
 assert(prep.coverage.some(c=>c.includes('Mirrored')));
 assert(referenceTasks('ForwardBendBigToe')[0].exempt);
});
test('every unchecked form and missing reference remains visible rather than becoming a pass',()=>{
 const audit=auditLibraryPose(createAuditRig(),pose('BridgeSupported'),undefined);
 assert.equal(audit.reference.matched,false);assert.equal(audit.status,'review-required');
 assert(audit.coverage.includes('No versioned pose-form checks'));
 assert(audit.coverage.includes('Source key absent from the current reference dictionary'));
});
test('shared-rig audit findings do not depend on which pose was applied previously',()=>{
 const rig=createAuditRig(),control=auditLibraryPose(rig,pose('CrookedMonkey'),reference);
 auditLibraryPose(rig,pose('Cradle'),reference);
 const again=auditLibraryPose(rig,pose('CrookedMonkey'),reference);
 assert.deepEqual(again,control);
});
test('summary counts poses once per result and exposes overlapping failure dimensions',()=>{
 const rig=createAuditRig(),results=['CrookedMonkey','Cradle','BridgeSupported'].map(key=>auditLibraryPose(rig,pose(key),key==='BridgeSupported'?undefined:reference)),summary=summarizeAudit(results);
 assert.equal(summary.total,3);assert.equal(summary.otherPoses,2);assert.equal(summary.crookedMonkeyControl,'scoped-pass');
 assert.equal(Object.values(summary.statuses).reduce((a,b)=>a+b,0),3);
 assert.equal(Object.values(summary.byCategory).reduce((n,c)=>n+c.total,0),3);
 assert.equal(summary.roundTripFailures,0);assert.equal(summary.missingReferences,1);
});
