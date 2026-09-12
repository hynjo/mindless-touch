import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {poleFlow,interpolateOrbit} from '../pole-example.js';
import {solve} from '../rig.js';
const point = group => group.getWorldPosition(new THREE.Vector3());
test('orbital transitions follow the pole perimeter without cutting through it',() => {
  for(let i=0;i<poleFlow.steps.length-1;i++) {
    const from=poleFlow.steps[i],to=poleFlow.steps[i+1];
    for(let j=0;j<=20;j++) {
      const mix=j/20,[x,y,z]=interpolateOrbit(from,to,mix);
      assert(Math.abs(Math.hypot(x,z)-(from.orbit.radius+(to.orbit.radius-from.orbit.radius)*mix))<1e-9);
      assert(y>0);assert(Math.hypot(x,z)>=.379);
    }
  }
});
test('both hands can reach authored pole contacts throughout the turn',() => {
  const root=new THREE.Group(),torso=new THREE.Group();torso.position.set(0,.11,0);root.add(torso);
  for(const [side,sign] of [['left',1],['right',-1]]) {
    const upper=new THREE.Group(),middle=new THREE.Group(),end=new THREE.Group();
    upper.position.set(sign*.22,.35,0);middle.position.y=-.29;end.position.y=-.26;
    torso.add(upper);upper.add(middle);middle.add(end);
    for(let i=1;i<poleFlow.steps.length-2;i++) {
      const from=poleFlow.steps[i],to=poleFlow.steps[i+1];
      for(let j=0;j<=10;j++) {
        const mix=j/10;root.position.fromArray(interpolateOrbit(from,to,mix));
        root.rotation.y=from.orbit.angle+(to.orbit.angle-from.orbit.angle)*mix+Math.PI;
        const target=new THREE.Vector3().fromArray(from.contacts[side+'Wrist']);
        solve({upper,middle,a:.29,b:.26},target,point(upper).add(new THREE.Vector3(sign*.35,-.3,-.15).applyQuaternion(root.quaternion)));
        assert(point(end).distanceTo(target)<1e-6,`${side}: ${from.id}, t=${mix}`);
        assert(Math.abs(point(upper).distanceTo(point(middle))-.29)<1e-9);
        assert(Math.abs(point(middle).distanceTo(point(end))-.26)<1e-9);
      }
    }
    torso.remove(upper);
  }
});
