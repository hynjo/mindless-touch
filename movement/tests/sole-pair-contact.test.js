import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {inspectSolePair} from '../sole-pair-contact.js';

function fixture(){
 const root=new THREE.Group(),feet={};
 for(const [side,sign] of [['left',-1],['right',1]]){
  const wrist=new THREE.Group();root.add(wrist);wrist.position.set(sign*.03,.04,0);wrist.rotation.z=-sign*Math.PI/2;
  const pad=z=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1));m.scale.set(.04,.03,.05);m.position.z=z;wrist.add(m);return m;};
  const sole=pad(0),ball=pad(.12);feet[side]={wrist,sole,meshes:[sole,null,ball]};
 }
 return {root,feet};
}
test('grounded paired ellipsoid heel and forefoot patches meet with opposite normals',()=>{
 const {feet}=fixture(),result=inspectSolePair(feet);
 assert(result.pass,JSON.stringify(result));assert.equal(result.patches.length,2);
 for(const patch of result.patches){assert(Math.abs(patch.gapMm)<1e-9);assert(patch.tangentMm<1e-9);}
});
test('separation, penetration and same-facing feet cannot pass as sole contact',()=>{
 for(const [name,change] of [
  ['separation',f=>{f.right.wrist.position.x+=.006;}],
  ['overlap',f=>{f.right.wrist.position.x-=.002;}],
  ['same facing',f=>{f.right.wrist.rotation.z=f.left.wrist.rotation.z;}],
 ]){const {feet}=fixture();change(feet);assert.equal(inspectSolePair(feet).pass,false,name);}
});
test('matching heel and forefoot pads cannot hide a toe crossing into the other foot',()=>{
 const {feet}=fixture();
 const toe=new THREE.Mesh(new THREE.CapsuleGeometry(.008,.03));
 toe.position.set(0,-.04,.2);feet.left.wrist.add(toe);feet.left.meshes.push(toe);
 const result=inspectSolePair(feet);
 assert(result.patches.every(p=>p.pass),'the original contact pads remain aligned');
 assert(result.separatingPlaneOverrunMm>1);assert.equal(result.pass,false);
});
test('heel-only contact and tangential height/length offsets fail',()=>{
 for(const change of [f=>{f.right.meshes[2].position.y-=.008;},f=>{f.right.wrist.position.y+=.008;},f=>{f.right.wrist.position.z+=.008;}]){
  const {feet}=fixture();change(feet);assert.equal(inspectSolePair(feet).pass,false);
 }
});
test('outward-facing separated feet fail orientation but report positive separation',()=>{
 const {feet}=fixture();
 feet.left.wrist.position.x=-.65;feet.right.wrist.position.x=.65;
 feet.left.wrist.rotation.z=-Math.PI/2;feet.right.wrist.rotation.z=Math.PI/2;
 const result=inspectSolePair(feet);
 assert.equal(result.pass,false);assert(result.alignment<result.minimumAlignment);
 assert(result.gapMm>1200);assert(result.minGapMm>1200);
 for(const patch of result.patches)assert(patch.gapMm>0);
});
test('ellipsoid support transforms consistently through world rotation and nonuniform scale',()=>{
 const {feet,root}=fixture();root.rotation.set(.3,.7,.4);root.scale.set(2,1.5,.8);
 // Scaling along the shared principal contact axis retains exact contact.
 const result=inspectSolePair(feet);assert(result.pass,JSON.stringify(result));
 for(const patch of result.patches)assert(Math.abs(patch.gapMm)<1e-8);
 feet.right.wrist.position.x+=.003;assert.equal(inspectSolePair(feet).pass,false,'world separation is 6 mm after scale');
});
