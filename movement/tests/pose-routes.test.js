import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findPoseByPath,posePath,poseSlugFromPath} from '../pose-routes.js';

const poses=[
 {id:'library-Bridge',name:'Bridge',source:'https://www.pocketyoga.com/pose/Bridge'},
 {id:'library-CobraFull',name:'Cobra',source:'https://www.pocketyoga.com/pose/CobraFull'},
];

test('pose routes use stable readable source-key slugs',()=>{
 assert.equal(posePath(poses[0]),'/movement/poses/bridge');
 assert.equal(posePath(poses[1]),'/movement/poses/cobra-full');
});

test('pose routes resolve optional trailing slashes',()=>{
 assert.equal(poseSlugFromPath('/movement/poses/bridge/'),'bridge');
 assert.equal(findPoseByPath(poses,'/movement/poses/bridge/'),poses[0]);
 assert.equal(findPoseByPath(poses,'/movement/poses/missing'),null);
});

test('movement assets resolve from nested pose URLs',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/href="\/movement\/style\.css"/);
 assert.match(html,/src="\/movement\/main\.js"/);
 assert.doesNotMatch(html,/href="\.\/style\.css"/);
 assert.doesNotMatch(html,/src="\.\/main\.js"/);
});
