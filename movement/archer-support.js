import * as THREE from 'three';

export function inspectArcherLegs(rig,surfaces){
 const bend=side=>Math.abs(THREE.MathUtils.radToDeg(rig.byId[side+'Knee'].group.rotation.x));
 const lifted=bend('left')>bend('right')?'left':'right',grounded=lifted==='left'?'right':'left';
 const knee=bend(grounded),heel=surfaces[grounded+'-heel'],leg=surfaces[grounded+'-back-leg'];
 const footClearance=surfaces[lifted+'-foot-edge'].gapMm;
 const ear=rig.byId.neck.group.localToWorld(new THREE.Vector3(lifted==='left'?.12:-.12,.12,0));
 const toe=rig.feet[lifted].joints[0].group.localToWorld(new THREE.Vector3(0,0,.025));
 const earDistanceMm=ear.distanceTo(toe)*1000;
 return {name:'archer-leg-support',kind:'relation',gapMm:Math.max(heel.gapMm,leg.gapMm),minGapMm:Math.min(heel.minGapMm,leg.minGapMm),liftedSide:lifted,supportingKneeDegrees:knee,footClearanceMm:footClearance,earDistanceMm,
  pass:knee<=10&&bend(lifted)>=60&&heel.pass&&leg.pass&&footClearance>20&&earDistanceMm<200,
  note:'Modified Archer: seated support is checked separately; supporting leg/heel grounded with up to 10 degrees of knee softness, opposite foot lifted toward an approximate ear landmark.'};
}
