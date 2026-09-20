import {Vector3} from 'three';
// Versioned editorial identities. These are mannequin criteria, not medical ROM.
export const POSE_CONTRACTS = Object.freeze({
 'forward-fold-v1': {requirements:['soles'], form:'fold'},
 'bound-angle-raised-knees-v1': {requirements:['sit-bones','sole-pair'], form:'bound'},
 'crow-bent-arms-v1': {requirements:['palms','crow-knees-on-arms','legs-airborne'], form:'crow'},
 'archer-forward-lean-v1': {requirements:['sit-bones','archer-leg-support','both-toe-grips'], form:'archer-modified'},
 'archer-upright-v1': {requirements:['sit-bones','archer-leg-support','both-toe-grips'], form:'archer-reference'},
 'tabletop-neutral-v1': {requirements:['palms','knees'], form:'tabletop'},
 'cat-rounded-v1': {requirements:['palms','knees'], form:'cat'},
 'cow-extended-v1': {requirements:['palms','knees'], form:'cow'},
 'plank-straight-v1': {requirements:['palms','toes'], form:'plank'},
 'low-plank-v1': {requirements:['palms','toes'], form:'low-plank'},
 'downward-dog-v1': {requirements:['palms','forefeet'], form:'downward-dog'},
 'corpse-supine-v1': {requirements:['seat','back','back-head','heels'], form:'corpse'},
 'bridge-interlaced-v1': {requirements:['soles','back','back-head','upper-arms'], form:'bridge'},
 'bridge-supported-v1': {requirements:['soles','back','back-head'], form:'bridge-supported'},
 'bridge-one-legged-v1': {requirements:['any-sole','back','back-head','upper-arms','hands-together'], form:'bridge-one-legged'},
 'bridge-one-legged-supported-v1': {requirements:['any-sole','back','back-head'], form:'bridge-one-legged-supported'},
 'extended-bridge-preparation-v1': {requirements:['forearms','head'], form:'extended-bridge-preparation'},
});
export function poseContract(pose) {
 if(!pose.poseContract)return null;
 const contract=POSE_CONTRACTS[pose.poseContract];
 if(!contract)throw new Error(`Unknown pose contract: ${pose.poseContract}`);
 return contract;
}
export function inspectPoseForm(rig,pose) {
 const contract=poseContract(pose),checks=[];
 const degrees=id=>rig.byId[id].group.rotation.x*180/Math.PI;
 const check=(name,pass)=>checks.push({name,pass});
 if(contract?.form==='fold')check('Forward hip fold',Math.abs(degrees('leftHip'))>45&&Math.abs(degrees('rightHip'))>45);
 if(contract?.form==='bound')check('Both knees bent',degrees('leftKnee')>60&&degrees('rightKnee')>60);
 if(contract?.form==='crow')check('Both knees tucked',degrees('leftKnee')>90&&degrees('rightKnee')>90);
 if(['tabletop','cat','cow'].includes(contract?.form)) {
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  for(const side of ['left','right']){
   const shoulder=position(side+'Shoulder'),wrist=position(side+'Wrist'),hip=position(side+'Hip'),knee=position(side+'Knee');
   check(`${side} wrist below shoulder`,Math.hypot(wrist.x-shoulder.x,wrist.z-shoulder.z)<.2);
   check(`${side} knee below hip`,Math.hypot(knee.x-hip.x,knee.z-hip.z)<.2);
  }
  if(contract.form==='tabletop')check('Neutral spine',Math.abs(degrees('waist'))<8&&Math.abs(degrees('torso'))<8);
  if(contract.form==='cat')check('Rounded lumbar and thoracic spine',degrees('waist')>12&&degrees('torso')>12&&degrees('neck')>5&&degrees('pelvis')<80);
  if(contract.form==='cow')check('Extended lumbar and thoracic spine',degrees('waist')<-10&&degrees('torso')<-10&&degrees('neck')<-8&&degrees('pelvis')>100);
 }
 if(['plank','low-plank','downward-dog'].includes(contract?.form)) {
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const shoulder=position('leftShoulder'),hip=position('leftHip'),ankle=position('leftAnkle');
  if(contract.form==='downward-dog')check('Hips form the apex',hip.y>shoulder.y+.2&&hip.y>ankle.y+.35);
  else check('Shoulders, hips and ankles align',Math.abs(hip.y-(shoulder.y+ankle.y)/2)<.12);
  if(contract.form==='low-plank')check('Both elbows are bent',degrees('leftElbow')<-45&&degrees('rightElbow')<-45);
  else check('Elbows do not bend backward',degrees('leftElbow')<=5&&degrees('rightElbow')<=5);
 }
 if(contract?.form==='corpse')check('Legs rest nearly straight',Math.abs(degrees('leftKnee'))<10&&Math.abs(degrees('rightKnee'))<10);
 if(contract?.form?.includes('bridge')){
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const hip=position('pelvis'),shoulder=position('leftShoulder');
  check('Pelvis is lifted',hip.y>shoulder.y+.03);
  if(contract.form.includes('one-legged'))check('One knee extends while the other stays bent',Math.min(Math.abs(degrees('leftKnee')),Math.abs(degrees('rightKnee')))<12&&Math.max(degrees('leftKnee'),degrees('rightKnee'))>55);
  if(contract.form.includes('supported'))check('Hands reach the lower back',position('leftWrist').distanceTo(hip)<.3&&position('rightWrist').distanceTo(hip)<.3);
 }
 if(contract?.form.startsWith('archer')) {
  // Reference requires an upright trunk, independently of toe-to-ear distance.
  if(contract.form==='archer-reference') {
   rig.root.updateWorldMatrix(true,true);
   const hip=rig.byId.pelvis.group.getWorldPosition(new Vector3());
   const neck=rig.byId.neck.group.getWorldPosition(new Vector3());
   check('Upright trunk',neck.sub(hip).normalize().y>Math.cos(35*Math.PI/180));
  }
  check('One bent and one extended knee',Math.min(degrees('leftKnee'),degrees('rightKnee'))<=10&&Math.max(degrees('leftKnee'),degrees('rightKnee'))>=60);
 }
 return {contract:pose.poseContract||null,checks,issues:checks.filter(c=>!c.pass)};
}
