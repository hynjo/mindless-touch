import * as THREE from 'three';
import {interpolateOrbit} from './pole-example.js';

// Contact changes have explicit approach/curl and uncurl/depart phases.
// Opening reverses the fitted hinge order so a curled fingertip cannot cut through the pole.
export function samplePoleMotion(steps,frames,index,next,mix,fingerIndices) {
  const from=frames[index],to=frames[next],a=new Map(from.grips),b=new Map(to.grips);
  const entering=!a.size&&b.size,leaving=a.size&&!b.size;
  const open=frame=>frame.rotations.map((q,i)=>fingerIndices.includes(i)?new THREE.Quaternion():q);
  let source=from.rotations,target=to.rotations,progress=mix;
  let position=interpolateOrbit(steps[index],steps[next],mix),grips=[];
  if(entering) {
    const amount=Math.min(1,mix/.65);source=from.rotations;target=open(to);progress=amount;
    position=interpolateOrbit(steps[index],steps[next],amount);
    if(mix>=.65) {
      const curl=(mix-.65)/.35;
      const rotations=to.rotations.map(q=>q.clone());
      fingerIndices.forEach((joint,k)=>rotations[joint].identity().slerp(to.rotations[joint],THREE.MathUtils.clamp(curl*fingerIndices.length-k,0,1)));
      return {position:to.position.clone(),rotations,grips:to.grips};
    }
  } else if(leaving) {
    if(mix<=.35) {
      const uncurl=mix/.35;
      const rotations=from.rotations.map(q=>q.clone());
      fingerIndices.forEach((joint,k)=>rotations[joint].slerp(new THREE.Quaternion(),THREE.MathUtils.clamp(uncurl*fingerIndices.length-(fingerIndices.length-1-k),0,1)));
      return {position:from.position.clone(),rotations,grips:from.grips};
    }
    progress=(mix-.35)/.65;source=open(from);target=to.rotations;
    position=interpolateOrbit(steps[index],steps[next],progress);
  } else {
    for(const [side,ga] of a) {
      const gb=b.get(side);
      if(gb)grips.push([side,{height:ga.height+(gb.height-ga.height)*mix,radius:ga.radius+(gb.radius-ga.radius)*mix,angle:steps[index].orbit.angle+(steps[next].orbit.angle-steps[index].orbit.angle)*mix}]);
    }
  }
  return {position:new THREE.Vector3().fromArray(position),rotations:source.map((q,i)=>q.clone().slerp(target[i],progress)),grips};
}
