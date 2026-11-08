import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {samplePullBlockage} from '../hand-grip-retention.js';
import {segmentDistance} from '../self-constraints.js';
const v=(x,y)=>new THREE.Vector3(x,y,0);
test('local pull distinguishes approaching finger surfaces from freely separating ones',()=>{
 // Two parallel 5 mm-radius distal capsules, initially 0.2 mm apart.
 const gaps=(distance,sign)=>[segmentDistance(v(0,0),v(0,.02),v(.0102+sign*distance,0),v(.0102+sign*distance,.02))-.01];
 const blocked=samplePullBlockage(d=>gaps(d,-1),[0]);
 assert.equal(blocked.index,0);assert(Math.abs(blocked.blockedAt-.0003)<1e-10);
 assert.equal(samplePullBlockage(d=>gaps(d,1),[0]).blockedAt,null);
});
test('an unrelated collision cannot count as finger retention',()=>{
 assert.equal(samplePullBlockage(d=>[.001+d,-.02],[0]).blockedAt,null);
 assert.equal(samplePullBlockage(()=>[-.02],[]).blockedAt,null);
});
test('numerical touching without penetration is not blockage',()=>{
 assert.equal(samplePullBlockage(()=>[-1e-10],[0]).blockedAt,null);
});
