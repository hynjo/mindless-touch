import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSelfConstraints,segmentDistance} from '../self-constraints.js';
import {createBody} from '../body.js';
import {poseShapes,normalizeRotations} from '../pose-shapes.js';
test('crossing and parallel capsule center lines have stable distances',()=>{
 const v=(x,y,z=0)=>new THREE.Vector3(x,y,z);
 assert.equal(segmentDistance(v(-1,0),v(1,0),v(0,-1),v(0,1)),0);
 assert.equal(segmentDistance(v(0,0),v(1,0),v(0,1),v(1,1)),1);
});
test('a fast arm rotation cannot tunnel through a leg even when both endpoints are clear',()=>{
 const root=new THREE.Group(),arm=new THREE.Group(),leg=new THREE.Group();root.add(arm,leg);leg.position.y=-.5;
 for(const [group,length] of [[arm,.9],[leg,.3]]){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(.05,length-.1));mesh.position.y=-length/2;group.add(mesh);}
 const joints=[{id:'leftShoulder',group:arm},{id:'rightHip',group:leg}];arm.rotation.z=-Math.PI/2;
 const self=createSelfConstraints({root,joints});assert.equal(self.contacts().length,0);
 arm.rotation.z=Math.PI/2;assert.equal(self.contacts().length,0);assert.equal(self.commit(),false);
 assert(arm.rotation.z<0);assert.equal(self.contacts().length,0);
 arm.rotation.z=-Math.PI/2;assert.equal(self.commit(),true);
});
test('Bound Angle clears the thighs after correcting the arms; old overlap can be edited outward',()=>{
 const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
 const mat=new THREE.MeshStandardMaterial(),body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:mat,jointMaterial:mat});
 const rotations=normalizeRotations(poseShapes.BoundAngle);
 for(const j of body.joints)j.group.rotation.set(...(rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
 const self=createSelfConstraints(body);assert.equal(self.contacts().length,0);
 for(const j of body.joints){if(j.id.endsWith('Shoulder'))j.group.rotation.x=THREE.MathUtils.degToRad(-35);if(j.id.endsWith('Elbow'))j.group.rotation.x=THREE.MathUtils.degToRad(-30);}
 assert(self.contacts().some(c=>c.a.includes('Elbow')&&c.b.includes('Hip')));
 self.sync();const depth=()=>self.contacts().reduce((sum,c)=>sum+c.depth,0);const before=depth();
 for(const j of body.joints)if(j.id.endsWith('Shoulder'))j.group.rotation.x=THREE.MathUtils.degToRad(-40);
 self.commit();assert(depth()<before);
});
