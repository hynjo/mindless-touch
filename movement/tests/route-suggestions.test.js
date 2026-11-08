import {test} from 'node:test';
import assert from 'node:assert/strict';
import {suggestRoutePoses,selectedRoutePoses} from '../route-suggestions.js';
const pose=(id,supportRequirements,y=1)=>({id,name:id,supportRequirements,rootPosition:[0,y,0],rotations:{leftHip:[-90,0,0]}});
test('suggestions rank shared supports ahead of unrelated poses, omit endpoints and are stable',()=>{
 const from=pose('from',['soles']),to=pose('to',['palms','knees']);
 const bridge=pose('bridge',['soles','palms','knees']),unrelated=pose('head',['head']);
 const catalog=[from,unrelated,to,bridge];
 assert.equal(suggestRoutePoses(catalog,from,to)[0].pose.id,'bridge');
 assert.deepEqual(suggestRoutePoses(catalog,from,to),suggestRoutePoses([...catalog].reverse(),from,to));
 assert.equal(suggestRoutePoses(catalog,from,to).length,2);
});
test('serialized radians and authored degrees produce equivalent ranking',()=>{
 const a=pose('a',['soles']),b=pose('b',['palms']),catalog=[pose('c',['soles']),pose('d',['knees'])];
 const stored={...a,pose:{rootPosition:a.rootPosition,rotations:{leftHip:[-Math.PI/2,0,0]}}};
 assert.deepEqual(suggestRoutePoses(catalog,a,b),suggestRoutePoses(catalog,stored,b));
});
test('worker candidate selection is exact and rejects empty, duplicate or unknown choices',()=>{
 const catalog=[pose('a',[]),pose('b',[])];
 assert.deepEqual(selectedRoutePoses(catalog,['b']),[catalog[1]]);
 for(const ids of [[],['a','a'],['unknown'],Array(7).fill('a')])assert.throws(()=>selectedRoutePoses(catalog,ids));
});
test('Big Toe to Cow includes Downward-Facing Dog ahead of opposite-facing bridges',async()=>{
 const {yogaPoses}=await import('../poses.js');
 const ranked=suggestRoutePoses(yogaPoses,yogaPoses.find(p=>p.name==='Big Toe'),yogaPoses.find(p=>p.name==='Cow'),yogaPoses.length);
 const index=name=>ranked.findIndex(r=>r.pose.name===name);
 assert(index('Downward-Facing Dog')>=0&&index('Downward-Facing Dog')<12);
 assert(index('Downward-Facing Dog')<index('Wheel'));
 assert(index('Downward-Facing Dog')<index('Upward Plank'));
});
test('full-library filtering includes low-ranked poses and retains selected choices',async()=>{
 const {visibleRouteSuggestions}=await import('../route-suggestions.js');
 const ranked=Array.from({length:30},(_,i)=>({pose:{id:String(i),name:i===29?'Downward-Facing Dog':`Pose ${i}`}}));
 const selected=new Set(['2','25']);
 const result=visibleRouteSuggestions(ranked,selected,'downward facing');
 assert.deepEqual(result.map(r=>r.pose.id),['2','25','29']);
 assert.deepEqual(visibleRouteSuggestions(ranked,selected,'no match').map(r=>r.pose.id),['2','25']);
 assert.equal(selected.size,2);
});
