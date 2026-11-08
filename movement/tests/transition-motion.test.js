import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {encodeTransitionMotion,compileTransitionMotion,normalizeTransitionMotion,sameMotionFrame,motionFrame} from '../transition-motion.js';
const frame=x=>({position:new T.Vector3(x,1,0),rotations:[new T.Quaternion()],handOffsets:{left:new T.Vector3(),right:new T.Vector3()}});
function fixture(){return encodeTransitionMotion([{id:'pelvis'}],[{name:'Test motion',supportRequirements:['soles'],frames:[frame(0),frame(.1)]}]);}
test('packed motion round-trips little-endian float tracks and stationary joints',()=>{
 const encoded=fixture(),compiled=compileTransitionMotion(normalizeTransitionMotion(JSON.parse(JSON.stringify(encoded)),['pelvis']),['pelvis']);
 assert(sameMotionFrame(compiled.start,frame(0)));assert(sameMotionFrame(compiled.end,frame(.1)));
 assert.equal(compiled.phases[0].indices.length,0);
 assert(sameMotionFrame(motionFrame(compiled.phases[0],1),frame(.1)));
});
test('malformed, disconnected and unbounded saved tracks fail closed',()=>{
 for(const mutate of [
  m=>m.phases[0].samples=0,
  m=>m.phases[0].samples=242,
  m=>m.phases[0].values='???',
  m=>m.phases[0].values=m.phases[0].values.slice(4),
  m=>m.phases[0].supportRequirements=[],
  m=>m.phases[0].supportRequirements=['invented-contact'],
  m=>m.phases[0].joints=['unknown'],
  m=>m.start.rotations.pelvis=[0,0,0,2],
  m=>m.start.position[0]=.5,
  m=>m.start.handOffsets.left=[.1,0,0],
  m=>m.phases=Array.from({length:21},()=>m.phases[0]),
 ]){const motion=fixture();mutate(motion);assert.throws(()=>compileTransitionMotion(motion,['pelvis']),/Invalid transition motion/);}
 assert.equal(normalizeTransitionMotion(undefined,['pelvis']),undefined);
});
