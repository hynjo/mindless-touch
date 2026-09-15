import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SEQUENCE_FORMAT,validateSequence,serializeSequence,parseSequence} from '../sequence-file.js';
const context={studio:'movement',dimensions:{pelvisHeight:.97},jointIds:['neck','leftThumb1']};
const pose={rootPosition:[.1,.97,.2],rotations:{neck:[.1,.2,.3],leftThumb1:[.8,0,-.25]},poleContacts:{}};
const document=()=>({format:SEQUENCE_FORMAT,version:1,studio:'movement',dimensions:{pelvisHeight:.97},name:'My flow',steps:[{id:'one',name:'Start',kind:'pose',cue:'Inhale',holdSeconds:3.5,transitionSeconds:1.8,floorSupport:'ground',pose:structuredClone(pose)},{id:'two',name:'Finish',kind:'transition',holdSeconds:.5,transitionSeconds:2,pose:structuredClone(pose)}]});
test('sequence round trip preserves order, names, timing, fingers and positions',()=>{
  const original=document();const saved=serializeSequence(original,context),restored=parseSequence(saved,context);
  assert.deepEqual(restored,validateSequence(original,context));
  assert.deepEqual(restored.steps[0].pose.rotations.leftThumb1,[.8,0,-.25]);
  assert.deepEqual(restored.steps.map(s=>s.id),['one','two']);
  restored.steps[0].pose.rootPosition[0]=4;assert.equal(original.steps[0].pose.rootPosition[0],.1);
});
test('pole grip and unwrapped rotation survive a full turn save/load',()=>{
  const original=document();original.studio='pole';original.steps=original.steps.slice(0,1);delete original.steps[0].floorSupport;
  original.steps[0].pose.rootPosition=[0,.97,.38];original.steps[0].orbit={angle:-2*Math.PI,radius:.38};
  original.steps[0].pose.poleContacts={left:{height:1.7,angle:-2*Math.PI,radius:.049}};
  const poleContext={...context,studio:'pole'};
  const restored=parseSequence(serializeSequence(original,poleContext),poleContext);
  assert.deepEqual(restored.steps[0].pose.poleContacts,original.steps[0].pose.poleContacts);
  assert.equal(restored.steps[0].orbit.angle,-2*Math.PI);
});
test('invalid files reject without mutating the caller document',()=>{
  const original=document();
  assert.throws(()=>parseSequence('{broken',context),/JSON/);
  for(const mutate of [d=>d.version=999,d=>d.steps[0].pose.rotations.neck=[null,0,0],d=>delete d.steps[0].pose.rotations.leftThumb1,d=>d.steps[0].holdSeconds=-1,d=>d.steps[1].id='one',d=>d.dimensions.pelvisHeight=2]) {
    const bad=structuredClone(original);mutate(bad);assert.throws(()=>validateSequence(bad,context));
  }
  assert.equal(original.steps[0].holdSeconds,3.5);
  assert.throws(()=>validateSequence({...original,studio:'pole'},context),/Pole Studio/);
});
test('legacy Download pose files become a one-card sequence',()=>{
  const legacy={version:4,studio:'movement',dimensions:context.dimensions,units:'meters',rotationUnits:'radians',rotationOrder:'XYZ',rootPosition:pose.rootPosition,joints:{neck:{rotation:[.1,.2,.3]}}};
  const restored=validateSequence(legacy,context);
  assert.equal(restored.steps.length,1);assert.deepEqual(restored.steps[0].pose.rotations.neck,[.1,.2,.3]);assert.deepEqual(restored.steps[0].pose.rotations.leftThumb1,[0,0,0]);
});

test('forearm support offsets survive save/load and reject oversized or unknown offsets',()=>{
 const original=document();original.steps[0].floorSupport='forearms';original.steps[0].pose.handOffsets={left:[0,0,-.035],right:[0,0,-.035]};
 assert.deepEqual(parseSequence(serializeSequence(original,context),context).steps[0].pose.handOffsets,original.steps[0].pose.handOffsets);
 for(const offsets of [{left:[0,0,-2]},{other:[0,0,0]},{left:[0,NaN,0]}]){const bad=structuredClone(original);bad.steps[0].pose.handOffsets=offsets;assert.throws(()=>validateSequence(bad,context));}
});
test('explicit support anchors survive save/load and unknown requirements are rejected',()=>{
 const original=document();original.steps[0].supportRequirements=['palms','soles'];
 assert.deepEqual(parseSequence(serializeSequence(original,context),context).steps[0].supportRequirements,['palms','soles']);
 original.steps[0].supportRequirements=['unknown-surface'];assert.throws(()=>validateSequence(original,context),/support requirements/);
});
test('optional transition contact schedules round trip without changing legacy files',()=>{
 const original=document();const legacy=validateSequence(original,context);assert(!('contactSchedule' in legacy.steps[0]));
 original.steps[0].contactSchedule={version:1,anchors:[{anchor:'left-sole',start:true,end:true},{anchor:'right-sole',start:true,end:true,release:[.1,.3],landing:[.7,.9]}]};
 const restored=parseSequence(serializeSequence(original,context),context);
 assert.deepEqual(restored.steps[0].contactSchedule,original.steps[0].contactSchedule);
 restored.steps[0].contactSchedule.anchors[1].release[0]=.2;assert.equal(original.steps[0].contactSchedule.anchors[1].release[0],.1);
 const invalid=structuredClone(original);invalid.steps[0].contactSchedule.anchors[1].landing=[.2,.4];assert.throws(()=>validateSequence(invalid,context),/contact schedule/);
});
