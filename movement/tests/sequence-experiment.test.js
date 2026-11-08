import {test} from 'node:test';
import assert from 'node:assert/strict';
import {experimentOrder} from '../sequence-experiment.js';
test('seed and pose set determine order independently of selection order',()=>{
 const ids=['cat','cow','bridge','cobra'];
 assert.deepEqual(experimentOrder(ids,'42'),experimentOrder([...ids].reverse(),'42'));
 assert.deepEqual(experimentOrder(ids,' 42 '),experimentOrder(ids,'42'));
 assert.deepEqual([...experimentOrder(ids,'42')].sort(),[...ids].sort());
 assert.deepEqual(ids,['cat','cow','bridge','cobra']);
 assert(new Set(Array.from({length:10},(_,i)=>experimentOrder(ids,String(i)).join(','))).size>1);
});
test('invalid experiments are rejected and duplicate choices do not duplicate poses',()=>{
 assert.throws(()=>experimentOrder(['cat'],'1'));
 assert.throws(()=>experimentOrder(['cat','cow'],''));
 assert.deepEqual(experimentOrder(['cat','cow','cat'],'1').sort(),['cat','cow']);
});
