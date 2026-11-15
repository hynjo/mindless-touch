import {Vector3} from 'three';
import {createSelfConstraints} from './self-constraints.js';
import {crookedMonkeySides} from './rear-foot-grip.js';
import {floorClearance} from './floor-constraints.js';
// Versioned editorial identities. These are mannequin criteria, not medical ROM.
export const POSE_CONTRACTS = Object.freeze({
 'deaf-man-grounded-preparation-v1': {requirements:['back','back-head','upper-arms','forearms','knees','foot-tops'],form:'deaf-man-preparation'},
 'crooked-monkey-heel-hold-v1': {requirements:['opposite-sole-knee-palm','rear-foot-grip'],form:'crooked-monkey'},
 'cow-face-preparation-v1': {requirements:['sit-bones'],form:'cow-face-preparation'},
 'butterfly-forward-fold-v1': {requirements:['sit-bones','sole-pair','palms'],form:'butterfly'},
 'caterpillar-palms-v1': {requirements:['sit-bones','palms','heels'],form:'caterpillar'},
 'cobra-grounded-v1': {requirements:['front-core','palms','foot-tops'],form:'cobra'},
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
 if(contract?.form==='deaf-man-preparation'){
  rig.root.updateWorldMatrix(true,true);
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const head=rig.headMesh.getWorldPosition(new Vector3());
  check('Pelvis folds above the head',position('pelvis').y>head.y+.15);
  check('Lumbar and thoracic spine round',degrees('waist')>20&&degrees('torso')>30);
  for(const side of ['left','right']){
   check(`${side} knee remains folded`,degrees(side+'Knee')>45);
   check(`${side} arm extends along the floor`,Math.abs(degrees(side+'Elbow'))<20);
   const upperArm=rig.byId[side+'Shoulder'].group.children.find(m=>m.geometry?.type==='CapsuleGeometry');
   check(`${side} upper arm contacts the floor`,floorClearance(upperArm)<=.0057);
   check(`${side} foot reaches beyond the head`,position(side+'Ankle').z<head.z-.10);
   check(`${side} hand extends away from the feet`,position(side+'Wrist').z>head.z+.10);
  }
  check('Arms clear the head',createSelfConstraints(rig).headContacts(0).length===0);
 }
 if(contract?.form==='crooked-monkey'){
  rig.root.updateWorldMatrix(true,true);
  const {front,rear}=crookedMonkeySides(rig),sign=front==='left'?1:-1;
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const local=id=>rig.root.worldToLocal(position(id));
  check('Front knee bent',degrees(front+'Knee')>55&&degrees(front+'Knee')<125);
  check('Front knee opens outward',local(front+'Knee').x*sign>local(front+'Hip').x*sign+.04);
  check('Rear knee behind pelvis',local(rear+'Knee').z<-.18);
  check('Rear knee folded',degrees(rear+'Knee')>110);
  check('Rear foot lifted',Math.min(...rig.feet[rear].meshes.map(floorClearance))>.10);
  check('Chest twists toward the free hand',rig.byId.torso.group.rotation.y*sign>30*Math.PI/180);
  check('Supporting hand stays inside front foot',local(front+'Ankle').x*sign>local(rear+'Wrist').x*sign+.10);
  check('Arms clear the head',createSelfConstraints(rig).headContacts(0).length===0);
 }
 if(contract?.form==='cow-face-preparation'){
  rig.root.updateWorldMatrix(true,true);
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const hip=position('pelvis'),neck=position('neck');
  check('Upright trunk',neck.clone().sub(hip).normalize().y>Math.cos(15*Math.PI/180));
  const local=id=>rig.byId.torso.group.worldToLocal(position(id));
  for(const side of ['left','right']){
   check(`${side} knee folded`,degrees(side+'Knee')>110);
   check(`${side} hand reaches behind the back`,local(side+'Wrist').z<-.13);
  }
  check('One elbow above the shoulder and one below',position('leftElbow').y>position('leftShoulder').y+.1&&position('rightElbow').y<position('rightShoulder').y-.1);
  check('Arms clear the head',createSelfConstraints(rig).headContacts(0).length===0);
  // This preparation has no grip. Never label it as a completed bind.
  const separation=position('leftWrist').distanceTo(position('rightWrist'));
  check('Hands remain unbound',separation>.2);
  check('Hands approach behind the back',separation<=.30);
  for(const [side,other] of [['left','right'],['right','left']]){
   const wrist=rig.byId[side+'Wrist'].group,origin=position(side+'Wrist');
   const reach=wrist.localToWorld(new Vector3(0,-1,0)).sub(origin).normalize();
   const toward=position(other+'Wrist').sub(origin).normalize();
   check(`${side} hand points toward the other hand`,reach.dot(toward)>.75);
  }
 }
 if(contract?.form==='butterfly'){
  rig.root.updateWorldMatrix(true,true);
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const hip=position('pelvis'),feet=position('leftAnkle').add(position('rightAnkle')).multiplyScalar(.5);
  const forward=feet.clone().sub(hip);forward.y=0;forward.normalize();
  const lateral=new Vector3(forward.z,0,-forward.x);
  check('Trunk folds toward feet',position('neck').sub(hip).dot(forward)>.18);
  check('Rounded lumbar and thoracic spine',degrees('waist')>5&&degrees('torso')>5);
  for(const [side,sign] of [['left',1],['right',-1]]){
   check(`${side} knee opens outward`,position(side+'Knee').sub(feet).dot(lateral)*sign>.12);
   check(`${side} knee stays bent`,degrees(side+'Knee')>60);
   check(`${side} hand reaches beyond feet`,position(side+'Wrist').sub(feet).dot(forward)>.1);
  }
  check('Hands stay separated',position('leftWrist').distanceTo(position('rightWrist'))>.2);
 }
 if(contract?.form==='caterpillar'){
  rig.root.updateWorldMatrix(true,true);
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  const hip=position('pelvis'),neck=position('neck');
  const forward=position('leftAnkle').add(position('rightAnkle')).multiplyScalar(.5).sub(hip);forward.y=0;forward.normalize();
  check('Trunk folds toward the legs',neck.sub(hip).dot(forward)>.25);
  check('Rounded lumbar and thoracic spine',degrees('waist')>5&&degrees('torso')>5);
  for(const side of ['left','right']){
   check(`${side} leg extends forward`,position(side+'Ankle').sub(hip).dot(forward)>.6);
   check(`${side} knee remains nearly extended`,degrees(side+'Knee')>=-1&&degrees(side+'Knee')<15);
  }
 }
 if(contract?.form==='cobra'){
  rig.root.updateWorldMatrix(true,true);
  const position=id=>rig.byId[id].group.getWorldPosition(new Vector3());
  check('Chest rises above pelvis',position('neck').y>position('pelvis').y+.25);
  check('Lumbar and thoracic extension',degrees('waist')<-5&&degrees('torso')<-10);
  const forward=new Vector3(0,0,1).applyQuaternion(rig.byId.torso.group.getWorldQuaternion(rig.root.quaternion.clone()));
  forward.y=0;forward.normalize();
  for(const side of ['left','right']){
   check(`${side} leg extends behind pelvis`,position(side+'Ankle').sub(position('pelvis')).dot(forward)<-.6&&Math.abs(degrees(side+'Knee'))<12);
   check(`${side} elbow stays bent`,degrees(side+'Elbow')<-10&&degrees(side+'Elbow')>-100);
  }
 }
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
