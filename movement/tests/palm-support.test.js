import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBody} from '../body.js';
import {floorClearance,FLOOR_SKIN} from '../floor-constraints.js';
import {placePalmsOnFloor,palmsAreSupported} from '../palm-support.js';
import {sunSalutation} from '../examples.js';
const dimensions={pelvisHeight:.97,torso:.48,shoulderWidth:.44,hipWidth:.22,upperArm:.29,forearm:.26,thigh:.43,shin:.43};
function fixture(){const material=new THREE.MeshStandardMaterial();const body=createBody({scene:new THREE.Scene(),dimensions,bodyMaterial:material,jointMaterial:material});const meshes=[];body.root.traverse(m=>{if(m.isMesh)meshes.push(m);});return {...body,dimensions,meshes,byId:Object.fromEntries(body.joints.map(j=>[j.id,j]))};}
test('all palm-supported cards put the full palm plane on the floor without penetration',()=>{
  const rig=fixture();
  for(const step of sunSalutation.steps.filter(palmsAreSupported)){
    rig.root.position.fromArray(step.rootPosition);
    for(const j of rig.joints)j.group.rotation.set(...(step.rotations[j.id]||[0,0,0]).map(THREE.MathUtils.degToRad));
    rig.root.updateWorldMatrix(true,true);placePalmsOnFloor(rig);rig.root.updateWorldMatrix(true,true);
    for(const hand of Object.values(rig.hands)){
      const normal=new THREE.Vector3(0,0,-1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
      assert(normal.distanceTo(new THREE.Vector3(0,-1,0))<1e-8,step.id+' palm normal');
      for(const [x,y] of [[-.025,-.03],[.025,-.03],[-.025,.03],[.025,.03]]){
        const corner=hand.palm.localToWorld(new THREE.Vector3(x,y,-.015));
        assert(Math.abs(corner.y-FLOOR_SKIN)<.0001,`${step.id}: palm height ${corner.y}`);
      }
    }
    assert(Math.min(...rig.meshes.map(floorClearance))>=FLOOR_SKIN-.00002,step.id+' collision');
  }
});
