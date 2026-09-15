import {captureHandOffsets,applyHandOffsets,blendHandOffsets} from './hand-offsets.js';
import * as THREE from 'three';
import { aim, solve } from './rig.js';
import { applyHandPreset, setFingerBend, setFingerSpread, applyFingerSpread } from './hands.js';
import {setToeBend,applyToePreset,setFootShape,applyFootShape} from './feet.js';
import {createSelfConstraints} from './self-constraints.js';
import {createBody} from './body.js';
import {colorBody,bodyParts} from './body-colors.js';
import {createPoleConstraints,POLE,capturePose} from './pole-constraints.js';
import {SEQUENCE_FORMAT,SEQUENCE_VERSION,MAX_STEPS,parseSequence,serializeSequence} from './sequence-file.js';
import { sunSalutation } from './examples.js';
import {neckStretching} from './neck-example.js';
import {ashtangaShortPractice} from './ashtanga-example.js';
import {yogaPoses} from './poses.js';
import { createTimeline } from './playback.js';
import { poleFlow } from './pole-example.js';
import {samplePoleMotion} from './pole-motion.js';
import {createFloorConstraints} from './floor-constraints.js';
import {placeHandsAndKnees,placePalmsOnFloor,palmsAreSupported,preparePalmLanding} from './palm-support.js';
const poleStudio = document.body.dataset.studio === 'pole';
const examples = poleStudio ? [poleFlow] : [sunSalutation,neckStretching,ashtangaShortPractice];
// Browsers may restore live form values across Vite reloads. Reset transient
// controls so their visible values match the freshly-created application state.
const exampleControl=document.querySelector('#example'),speedControl=document.querySelector('#playback-speed');
for(const example of examples)if(!exampleControl.querySelector(`option[value="${example.id}"]`))exampleControl.add(new Option(example.name,example.id));
exampleControl.value=poleStudio?'pole-flow':'';speedControl.value='1';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {enableStageResize} from './stage-resize.js';
import {enableSequencePanel} from './sequence-panel.js';
import {inspectSupports} from './pose-validation.js';
import {supportProfile} from './support-profiles.js';
import {projectSupportPose} from './support-solver.js';
import {sampleContactSchedule} from './contact-schedule.js';
import {inspectScheduledHolds} from './scheduled-supports.js';
import {enablePlaybackToolbar,setPlaybackIcon} from './playback-toolbar.js';
enablePlaybackToolbar();

// Dimensions remain separate from pose data so proportions can become editable.
const dimensions = { pelvisHeight: 0.97, torso: 0.48, shoulderWidth: 0.44, hipWidth: 0.22, upperArm: 0.29, forearm: 0.26, thigh: 0.43, shin: 0.43 };
const viewport = document.querySelector('#viewport');
const scene = new THREE.Scene();
// Continue the studio backdrop above the floor horizon instead of showing a
// black band that looks like unused space above the canvas.
scene.background = new THREE.Color('#2d2c24');
// Blend the lit floor into the unlit backdrop before the far clipping plane.
scene.fog = new THREE.Fog(scene.background, 10, 40);
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.append(renderer.domElement);
// Let ordinary wheel gestures scroll the page; reserve modified gestures for zoom.
renderer.domElement.addEventListener('wheel', event => {
  if (!event.ctrlKey && !event.metaKey) event.stopImmediatePropagation();
}, {capture:true,passive:true});
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.98, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.88;
scene.add(new THREE.HemisphereLight(0xffffff, 0x55533b, 1.8));
const light = new THREE.DirectionalLight(0xfff7e5, 3.5);
light.position.set(3, 6, 4);light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
scene.add(light);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#10110d', roughness: 1 }));
floor.rotation.x = -Math.PI / 2;floor.receiveShadow = true;scene.add(floor);
const grid = new THREE.GridHelper(6, 30, '#454631', '#26281e');grid.position.y = 0.002;scene.add(grid);
const pole = new THREE.Group();pole.visible = poleStudio;scene.add(pole);
const poleShaft = new THREE.Mesh(new THREE.CylinderGeometry(.023,.023,2.7,32),new THREE.MeshStandardMaterial({color:'#c6c3d0',metalness:.75,roughness:.25}));
poleShaft.position.y = 1.35;poleShaft.castShadow = true;pole.add(poleShaft);
const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.018,32),new THREE.MeshStandardMaterial({color:'#706477',metalness:.6,roughness:.4}));
poleBase.position.y = .009;pole.add(poleBase);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#d8d4aa', roughness: 0.65 });
const jointMaterial = new THREE.MeshStandardMaterial({ color: '#98934e', roughness: 0.5 });
const selectedMaterial = new THREE.MeshStandardMaterial({ color: '#fff875', emissive: '#5b3309', roughness: 0.4 });
const {root,torso,neck,headMesh,joints,markers,hands,feet} = createBody({scene,dimensions,bodyMaterial,jointMaterial});
colorBody({root,joints,bodyMaterial});
const bodyKey=document.createElement('div');bodyKey.className='body-key';bodyKey.setAttribute('aria-label','Body part colors');
for(const {label,color,rightColor} of Object.values(bodyParts)){const item=document.createElement('span');item.style.setProperty('--part-color',rightColor?`linear-gradient(90deg,${color} 50%,${rightColor} 50%)`:color);item.textContent=rightColor?`${label} · L / R`:label;bodyKey.append(item);}
const orientationNote=document.createElement('p');orientationNote.className='body-key-note';orientationNote.textContent='L / R follows the model. Subtle stripes mark the back of the body, arms, legs and hands.';bodyKey.append(orientationNote);
document.querySelector('label[for=joint]').before(bodyKey);
// Local-axis rings rotate the neck while keeping its attachment to the torso fixed.
const headRings = new THREE.Group();
neck.add(headRings);
const ringMeshes = [];
for (const [axis, color] of [['x', '#d16a59'], ['y', '#55986b'], ['z', '#568fc7']]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.285, .009, 10, 96), new THREE.MeshBasicMaterial({color, depthTest:false, transparent:true, opacity:.85}));
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  if (axis === 'y') ring.rotation.x = Math.PI / 2;
  ring.userData.axis = axis;ring.renderOrder = 4;headRings.add(ring);ringMeshes.push(ring);
}
headRings.visible = false;
const byId = Object.fromEntries(joints.map(item => [item.id, item]));
const handles = joints.filter(({id,isFinger,isToe,isFootJoint}) => !isFinger && !isToe && !isFootJoint && !/Shoulder|Hip/.test(id));
jointMaterial.depthTest = false; selectedMaterial.depthTest = false;
for (const marker of markers) {marker.visible = handles.includes(marker.userData.joint);marker.renderOrder = 2;}
const select = document.querySelector('#joint');
for (const item of handles) select.add(new Option(item.label, item.id));
let selected, mode, drag;
let focusedHand = null, selectedFinger = null, savedHandView = null;
const closeupVisibility = new Map();
const fileContext={studio:poleStudio?'pole':'movement',dimensions,jointIds:joints.map(j=>j.id)};
const emptySequence=()=>({format:SEQUENCE_FORMAT,version:SEQUENCE_VERSION,studio:fileContext.studio,dimensions:{...dimensions},name:'Untitled sequence',steps:[]});
let sequence=emptySequence();
let timeline=createTimeline(sequence.steps);
const sequenceHistory=[];
const playback = {playing:false,time:0,speed:1,lastTick:null,index:0,edited:false};
const sequenceFrames = [];
const sequenceBounds = new THREE.Box3();
const position = group => group.getWorldPosition(new THREE.Vector3());
function choose(id) {
  endDrag();
  if (focusedHand && id !== `${focusedHand.side}${focusedHand.isFoot?'Ankle':'Wrist'}`) closeHand();
  selected = byId[id];select.value = id;
  syncHeadRings();
  syncJointAppearance();
  updateContactUI();
  document.querySelector('#selection-help').textContent = id === 'pelvis' ? 'Drag the hips to move the whole body.' : id.endsWith('Wrist') ? 'Drag the wrist handle to reach, or a ring to rotate the hand. Palm / back changes the facing direction.' : id.endsWith('Ankle') ? 'Drag the ankle handle to reach, or a ring to rotate the foot and change the sole direction.' : /Elbow|Knee/.test(id) ? 'Drag to change the bend direction.' : ['neck','waist','torso'].includes(id) ? 'Drag a ring: red to bend or arch, green to twist, blue to tilt. Select a motion below to isolate its ring.' : 'Drag to tilt the chest.';
}
select.addEventListener('change', () => choose(select.value));
function endDrag() {
  const previous = drag;drag = null;
  for (const ring of ringMeshes) ring.material.opacity = .85;
  if (previous && renderer.domElement.hasPointerCapture(previous.pointerId)) renderer.domElement.releasePointerCapture(previous.pointerId);
  document.querySelector('.stage').dataset.dragging = 'false';
}
function setMode(next) {
  if (next === 'pose') pausePlayback();
  endDrag(); mode = next;controls.enabled = mode === 'view';syncHeadRings();
  syncJointAppearance();
  updateFloorContacts();
  document.querySelector('.stage').dataset.mode = mode;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
  document.querySelector('#mode-hint').textContent = focusedHand ? (mode === 'pose' ? 'Drag a ring to rotate - Drag a finger or toe to bend' : 'Drag to orbit the detail - Pinch or Ctrl/⌘ + scroll to zoom') : mode === 'pose' ? 'Drag a body handle - Switch views to adjust depth' : 'Drag to orbit - Pinch or Ctrl/⌘ + scroll to zoom';
}
function syncJointAppearance() {
  for (const marker of markers) {
    marker.material = mode === 'view'
      ? marker.userData.bodyMaterial
      : marker.userData.joint === selected ? selectedMaterial : jointMaterial;
    marker.visible = handles.includes(marker.userData.joint) && !focusedHand;
    marker.renderOrder = mode === 'view' ? 0 : 2;
  }
  syncFingerAppearance();
}
function syncHeadRings() {
  const wrist=selected?.id.endsWith('Wrist'),ankle=selected?.id.endsWith('Ankle');
  headRings.visible = mode === 'pose' && (wrist||ankle||['neck','waist','torso'].includes(selected?.id));
  headRings.scale.setScalar(wrist ? (focusedHand ? .25 : .5) : ankle ? (focusedHand ? .30 : .65) : 1);
  const activeAxis=document.querySelector('[data-head-axis][aria-pressed=true]')?.dataset.headAxis||'all';
  for(const ring of ringMeshes)ring.visible=activeAxis==='all'||ring.userData.axis===activeAxis;
  if (headRings.visible) selected.group.add(headRings);
  const back = selected?.id !== 'neck';
  document.querySelector('.head-axis-controls').setAttribute('aria-label',ankle?'Ankle rotation axes':wrist?'Wrist rotation axes':back?'Spine rotation axes':'Head rotation axes');
  document.querySelector('#head-controls .eyebrow').textContent = ankle?'ANKLE ROTATION':wrist?'WRIST ROTATION':back ? 'SPINE ROTATION' : 'HEAD ROTATION';
  document.querySelector('[data-head-axis=x]').textContent = ankle?'Point / flex':wrist?'Bend':back ? 'Bend / arch' : 'Nod';
  document.querySelector('[data-head-axis=y]').textContent = ankle?'Turn':wrist?'Palm / back':back ? 'Twist' : 'Turn';
  document.querySelector('[data-head-axis=z]').textContent=ankle?'Sole tilt':'Tilt';
  document.querySelector('#head-controls').hidden = !headRings.visible;
  document.querySelector('#head-controls > p:last-child').textContent=ankle?'Drag a ring to rotate the foot. Point / flex moves the toes; Sole tilt rolls the sole inward or outward. Drag the ankle handle to move the foot.':wrist?'Drag a ring to rotate the hand. Palm / back twists around the forearm axis. Drag the wrist handle to move the hand.':'Drag the colored ring around the selected joint. For an edge-on ring, change the viewing angle.';
}
function syncFingerAppearance() {
  for (const hand of [...Object.values(hands),...Object.values(feet)]) for (const mesh of hand.meshes) {
    mesh.material = focusedHand === hand && mode === 'pose' && mesh.userData.fingerJoint === selectedFinger ? fingerMaterial:mesh.userData.bodyMaterial;
  }
}
const fingerMaterial = bodyMaterial.clone();fingerMaterial.color.set('#fff875');
function updateFingerUI() {
  if (!selectedFinger) return;
  document.querySelector('#finger-joint').value = selectedFinger.id;
  const base=!selectedFinger.isToe&&focusedHand.joints.find(j=>j.finger===selectedFinger.finger&&j.segment===0);
  document.querySelector('#finger-angle').textContent = `${selectedFinger.label}: ${Math.round(THREE.MathUtils.radToDeg(selectedFinger.group.rotation.x))}° bend${base?` / ${Math.round(THREE.MathUtils.radToDeg(base.group.rotation.z/base.spreadDirection))}° spread`:''}`;
  syncFingerAppearance();
}
function focusHand(side,isFoot=false) {
  pausePlayback();endDrag();
  if (!savedHandView) savedHandView = {position:camera.position.clone(),target:controls.target.clone(),min:controls.minDistance,max:controls.maxDistance};
  focusedHand = (isFoot?feet:hands)[side];selectedFinger = focusedHand.joints[0];
  root.traverse(object => {
    if (!object.isMesh) return;
    if (!closeupVisibility.has(object)) closeupVisibility.set(object,object.visible);
    object.visible = focusedHand.meshes.includes(object);
  });
  selected = byId[`${side}${isFoot?'Ankle':'Wrist'}`];select.value = selected.id;
  const jointSelect = document.querySelector('#finger-joint');jointSelect.replaceChildren();
  for (const joint of focusedHand.joints) jointSelect.add(new Option(joint.label,joint.id));
  document.querySelector('#hand-detail').hidden = false;
  document.querySelector('#foot-shape-controls').hidden=!isFoot;
  document.querySelector('#finger-spread-controls').hidden=isFoot;
  document.querySelector('#finger-straighten').textContent=isFoot?'Lift 5°':'Straighten 5°';
  document.querySelector('#hand-detail .file-note').textContent=isFoot?'Toe bends are editable approximations. Lift the foot to curl freely above the floor.':'Hand shapes are editable approximations.';
  document.querySelector('label[for=finger-joint]').textContent=isFoot?'Toe joint':'Finger joint';
  document.querySelector('#hand-help').textContent=isFoot?'In Pose, drag a toe to bend it or an ankle ring to rotate the foot. Floor collision stays active.':'Drag a finger sideways to spread, up/down to bend, or a wrist ring to turn the hand. Nails and the center stripe mark the back.';
  for(const button of document.querySelectorAll('[data-grip]')){button.hidden=isFoot&&button.dataset.grip==='fist';button.textContent=(isFoot?{open:'Neutral',relaxed:'Lift toes',wrap:'Curl toes'}:{open:'Open',relaxed:'Relaxed',wrap:'Wrap',fist:'Fist'})[button.dataset.grip]||'Fist';}
  for(const button of document.querySelectorAll('[data-focus-foot]'))button.setAttribute('aria-pressed',String(isFoot&&button.dataset.focusFoot===side));
  document.querySelectorAll('[data-focus-hand]').forEach(button => button.setAttribute('aria-pressed',String(!isFoot&&button.dataset.focusHand === side)));
  const center = focusedHand.wrist.localToWorld(new THREE.Vector3(...(isFoot?[0,-.025,.065]:[0,-.08,0])));
  const direction = new THREE.Vector3(...(isFoot?[.5,.8,1]:[side === 'left' ? -.25:.25,-.12,-1])).normalize().applyQuaternion(focusedHand.wrist.getWorldQuaternion(new THREE.Quaternion()));
  if (center.y+direction.y*.43<.08) direction.set(side==='left' ? -.7:.7,.55,.7).normalize();
  controls.minDistance = .16;controls.maxDistance = 1.5;
  controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,.43);
  controls.update();setMode(mode);updateFingerUI();updateContactUI();updateFloorContacts();
  document.querySelector('#selection-help').textContent = isFoot?'Foot close-up. Drag an ankle ring to rotate, or a toe to bend.':'Hand close-up. In Pose, drag a ring to rotate the wrist or a finger to bend it.';
}
function closeHand() {
  if (!focusedHand) return;
  endDrag();focusedHand = null;selectedFinger = null;
  for (const [mesh,visible] of closeupVisibility) mesh.visible = visible;
  closeupVisibility.clear();
  document.querySelector('#hand-detail').hidden = true;
  document.querySelectorAll('[data-focus-hand],[data-focus-foot]').forEach(button => button.setAttribute('aria-pressed','false'));
  controls.minDistance = savedHandView.min;controls.maxDistance = savedHandView.max;
  camera.position.copy(savedHandView.position);controls.target.copy(savedHandView.target);savedHandView = null;
  controls.update();setMode(mode);updateFloorContacts();
}
document.querySelectorAll('[data-focus-hand]').forEach(button => {button.onclick = () => focusHand(button.dataset.focusHand);});
document.querySelectorAll('[data-focus-foot]').forEach(button=>{button.onclick=()=>focusHand(button.dataset.focusFoot,true);});
document.querySelector('#hand-back').onclick = closeHand;
document.querySelector('#finger-joint').onchange = event => {selectedFinger = focusedHand.joints.find(joint => joint.id === event.target.value);updateFingerUI();};
function editFinger(delta) {
  if (!selectedFinger) return;
  pausePlayback();setMode('pose');playback.edited = true;
  (selectedFinger.isToe?setToeBend:setFingerBend)(selectedFinger,selectedFinger.group.rotation.x+THREE.MathUtils.degToRad(delta));enforcePole();updateFingerUI();
}
document.querySelector('#finger-straighten').onclick = () => editFinger(-5);
document.querySelector('#finger-curl').onclick = () => editFinger(5);
document.querySelectorAll('[data-finger-spread]').forEach(button=>{button.onclick=()=>{
 if(!focusedHand||focusedHand.isFoot)return;
 pausePlayback();setMode('pose');playback.edited=true;applyFingerSpread(focusedHand,Number(button.dataset.fingerSpread));enforcePole();updateFingerUI();
};});
document.querySelectorAll('[data-grip]').forEach(button => {button.onclick = () => {
  if (!focusedHand) return;
  pausePlayback();setMode('pose');playback.edited = true;
  if(focusedHand.isFoot){applyToePreset(focusedHand,button.dataset.grip);enforcePole();}
  else {
    const hand=focusedHand,before=hand.joints.map(j=>j.group.quaternion.clone());
    applyHandPreset(hand,button.dataset.grip);
    const targets=new Map(hand.joints.map(j=>[j,j.group.quaternion.clone()]));
    hand.joints.forEach((j,i)=>j.group.quaternion.copy(before[i]));
    let blocked=false;
    // Close the fingers before opposing the thumb; clamp each joint independently.
    const fingers=hand.joints.filter(j=>j.finger!=='Thumb'),thumb=hand.joints.filter(j=>j.finger==='Thumb');
    for(const joint of (button.dataset.grip==='open'?[...thumb,...fingers]:[...fingers,...thumb])){
      joint.group.quaternion.copy(targets.get(joint));enforcePole();blocked ||= selfStatus.dataset.error==='true';
    }
    if(blocked){selfStatus.textContent='Hand shape stopped at contact. Adjust a finger to make room.';selfStatus.dataset.error='true';}
  }
  updateFingerUI();
};});
const axisVectors = {x:new THREE.Vector3(1,0,0), y:new THREE.Vector3(0,1,0), z:new THREE.Vector3(0,0,1)};
document.querySelectorAll('[data-head-axis]').forEach(button => {
  button.onclick = () => {
    endDrag();
    const axis = button.dataset.headAxis;
    for (const ring of ringMeshes) ring.visible = axis === 'all' || ring.userData.axis === axis;
    document.querySelectorAll('[data-head-axis]').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
  };
});
function startHeadRotation(hit, event) {
  const axis = hit.object.userData.axis;
  const origin = position(selected.group);
  const worldAxis = axisVectors[axis].clone().applyQuaternion(selected.group.getWorldQuaternion(new THREE.Quaternion()));
  const radius = hit.point.clone().sub(origin);
  const tangent = new THREE.Vector3().crossVectors(worldAxis,radius);
  const rect = renderer.domElement.getBoundingClientRect();
  const start = hit.point.clone().project(camera);
  const next = hit.point.clone().add(tangent).project(camera);
  const screenTangent = new THREE.Vector2((next.x-start.x)*rect.width/2,-(next.y-start.y)*rect.height/2);
  if (screenTangent.length() < 8) return;
  drag = {pointerId:event.pointerId, rotation:true, axis, startX:event.clientX,startY:event.clientY, archAngle:selected.id.endsWith('Ankle')?feet[selected.id.startsWith('left')?'left':'right'].archJoint.group.rotation.x:0,joint:selected, quaternion:selected.group.quaternion.clone(), tangent:screenTangent};
  hit.object.material.opacity = 1;
  renderer.domElement.setPointerCapture(event.pointerId);
  document.querySelector('.stage').dataset.dragging = 'true';
}
function chain(id) {
  const side = id.startsWith('left') ? 'left':'right';
  const arm = /Wrist|Elbow/.test(id);
  return {upper:byId[side+(arm ? 'Shoulder':'Hip')].group,middle:byId[side+(arm ? 'Elbow':'Knee')].group,end:byId[side+(arm ? 'Wrist':'Ankle')].group,a:arm ? dimensions.upperArm:dimensions.thigh,b:arm ? dimensions.forearm:dimensions.shin};
}
const physicalMeshes = [];
root.traverse(object => {if (object.isMesh && (object.userData.boxHalfExtents || ['SphereGeometry','CapsuleGeometry'].includes(object.geometry.type))) physicalMeshes.push(object);});
const poleConstraints = poleStudio ? createPoleConstraints({root,joints,hands,chain,meshes:physicalMeshes}) : null;
const floorConstraints = !poleStudio ? createFloorConstraints({root,joints,meshes:physicalMeshes}) : null;
const selfConstraints=createSelfConstraints({root,joints});
let lastSelfPlaybackTime=0;
const selfStatus=document.createElement('p');selfStatus.id='self-contact-status';selfStatus.setAttribute('role','status');document.querySelector('label[for=joint]').before(selfStatus);
function updateSelfContactUI(blocked=false){const overlaps=selfConstraints.contacts(),limits=selfConstraints.jointViolations();selfStatus.textContent=limits.length?`${limits[0].id}: wrist bend or tilt exceeds its range. Adjust the hand or arm before playback.`:overlaps.length?`Body overlap: ${overlaps[0].a} / ${overlaps[0].b}. Move the parts apart before playback.`:blocked?'Movement stopped at contact or a wrist limit.':'Body and hand collision · Wrist limits on';selfStatus.dataset.error=String(blocked||overlaps.length>0||limits.length>0);}
const palmRig = {root,hands,byId,dimensions,meshes:physicalMeshes};
const supportRig={...palmRig,joints,feet,headMesh,self:selfConstraints};
const fitSupportsButton=document.createElement('button');fitSupportsButton.type='button';fitSupportsButton.id='fit-supports';fitSupportsButton.textContent='Fit supports';fitSupportsButton.hidden=poleStudio;
const fitSupportsStatus=document.createElement('p');fitSupportsStatus.id='fit-supports-status';fitSupportsStatus.setAttribute('role','status');fitSupportsStatus.hidden=true;
document.querySelector('label[for=joint]').before(fitSupportsButton,fitSupportsStatus);
fitSupportsButton.addEventListener('click',()=>{
 const step=sequence.steps[playback.index];if(!step?.supportRequirements?.length)return;
 closeHand();pausePlayback();endDrag();
 const previousCard=capturedStep(step);
 const result=projectSupportPose(supportRig,step,{maxPasses:32});
 fitSupportsStatus.hidden=false;
 if(!result.accepted){fitSupportsStatus.textContent=result.reason==='unsupported-support-family'?'This support combination needs a different repair method. The pose was kept unchanged.':'Could not fit every support within the joint and collision limits. The pose was kept unchanged.';return;}
 if(!result.changed){fitSupportsStatus.textContent='All required supports and current pose checks already pass.';return;}
 // Keep the previous card for Undo, then commit the accepted pose without a
 // subsequent floor-settle pass that could detach one of its supports.
 sequence.steps[playback.index]=previousCard;rememberSequence();sequence.steps[playback.index]=capturedStep(step);playback.edited=false;
 const accepted=capturePose(root,joints);floorConstraints.restore({pose:accepted,safe:accepted});selfConstraints.sync();
 rebuildSequence();selectExampleStep(playback.index,false);
 fitSupportsStatus.hidden=false;fitSupportsStatus.textContent='Supports fitted. Undo restores the previous card.';
});
const floorContactMarkers = new THREE.Group();floorContactMarkers.visible=!poleStudio;scene.add(floorContactMarkers);
for (let i=0;i<4;i++) {const marker = new THREE.Mesh(new THREE.RingGeometry(.057,.064,32),new THREE.MeshBasicMaterial({color:'#397b5a',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false,depthTest:false}));marker.rotation.x=-Math.PI/2;marker.renderOrder=3;floorContactMarkers.add(marker);}
function updateFloorContacts() {
  if (!floorConstraints) return;
  floorContactMarkers.visible = mode === 'pose' && !focusedHand;
  const contacts=floorConstraints.contacts();
  const points=[];
  for (const contact of contacts) if (!points.some(point=>point.distanceTo(contact.position)<.09)) points.push(contact.position);
  floorContactMarkers.children.forEach((marker,i)=>{marker.visible=!!points[i];if(points[i])marker.position.copy(points[i]);});
  const status=document.querySelector('#floor-contact-status');
  if(status) status.textContent=`Floor collision on / ${points.length} contact area${points.length===1 ? '':'s'}`;
  const step=sequence.steps[playback.index];
  fitSupportsButton.disabled=playback.playing||!step?.supportRequirements?.length;
  if(status&&step?.supportRequirements?.length&&!playback.playing){
    const inspection=inspectSupports({root,byId,hands,feet,headMesh},step);
    status.dataset.error=String(inspection.issues.length>0);
    status.textContent=inspection.issues.length?`Support needs adjustment: ${inspection.issues.map(issue=>issue.name).join(', ')}. Floor clearance alone does not confirm support.`:'Required floor supports are in contact.';
  }else if(status)status.dataset.error='false';
}
function updateContactUI(message) {
  if (!poleStudio) return;
  const side = focusedHand?.side || (selected?.id.startsWith('right') ? 'right':'left');
  const attached = poleConstraints.grips.has(side);
  document.querySelector('#release-pole').disabled = !attached||!!focusedHand?.isFoot;
  document.querySelector('#attach-pole').disabled=!!focusedHand?.isFoot;
  document.querySelector('#attach-pole').textContent = `Grip pole (${side})`;
  document.querySelector('#pole-contact-status').textContent = message || (attached ? `${side === 'left' ? 'Left':'Right'} hand attached. Release to move it freely.` : 'Drag a hand near the pole to grip. Body collisions are always on.');
}
function enforcePole() {
 const surface=poleConstraints||floorConstraints;
 const before=selfConstraints.snapshot(),surfaceBefore=surface.snapshot();
 let bodyAccepted=selfConstraints.commit();
 const surfaceAccepted=surface.commit();
 if(!selfConstraints.commit()){
  bodyAccepted=false;
  surface.restore({...surfaceBefore,pose:before.safe,safe:before.safe});selfConstraints.restore(before);
 }
 updateSelfContactUI(!bodyAccepted);
 updateFloorContacts();updateContactUI();
 if(!surfaceAccepted&&floorConstraints)document.querySelector('#floor-contact-status').textContent='Movement stopped at the floor.';
 if(selectedFinger)updateFingerUI();
}

if (poleStudio) {
  document.querySelector('#attach-pole').onclick = () => {
    pausePlayback();endDrag();playback.edited = true;
    const side = focusedHand?.side || (selected.id.startsWith('right') ? 'right':'left');
    const previous=poleConstraints.snapshot(),selfBefore=selfConstraints.snapshot();
    let attached = poleConstraints.attach(side);
    if(attached&&!selfConstraints.commit()){poleConstraints.restore(previous);selfConstraints.restore(selfBefore);attached=false;}
    updateSelfContactUI();
    updateContactUI(attached ? undefined : 'The hand cannot reach a clear grip. Move the body closer first.');
    if (focusedHand) focusHand(side);
  };
  document.querySelector('#release-pole').onclick = () => {
    const side = focusedHand?.side || (selected.id.startsWith('right') ? 'right':'left');
    pausePlayback();poleConstraints.release(side);selfConstraints.sync();updateSelfContactUI();playback.edited = true;updateContactUI();if(selectedFinger)updateFingerUI();
  };
}
const raycaster = new THREE.Raycaster();
function ray(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
}
renderer.domElement.addEventListener('pointerdown', event => {
  if (mode !== 'pose' || drag || event.button !== 0) return;
  pausePlayback();
  ray(event);
  if (headRings.visible) {
    const ringHit = raycaster.intersectObjects(ringMeshes.filter(ring => ring.visible))[0];
    if (ringHit) {startHeadRotation(ringHit,event);return;}
  }
  if (focusedHand) {
    const hit = raycaster.intersectObjects(focusedHand.meshes)[0];
    if (!hit?.object.userData.fingerJoint) return;
    selectedFinger = hit.object.userData.fingerJoint;updateFingerUI();
    drag = {pointerId:event.pointerId,finger:selectedFinger,startX:event.clientX,startY:event.clientY,startAngle:selectedFinger.group.rotation.x,base:focusedHand.joints.find(j=>j.finger===selectedFinger.finger&&j.segment===0),startSpread:focusedHand.isFoot?0:focusedHand.joints.find(j=>j.finger===selectedFinger.finger&&j.segment===0).group.rotation.z};
    if(!focusedHand.isFoot){
      const origin=position(drag.base.group).project(camera);
      const outward=drag.base.group.localToWorld(new THREE.Vector3(drag.base.spreadDirection*.01,0,0)).project(camera);
      drag.spreadSign=Math.sign(outward.x-origin.x)||1;
    }
    renderer.domElement.setPointerCapture(event.pointerId);document.querySelector('.stage').dataset.dragging = 'true';return;
  }
  const hit = raycaster.intersectObjects([...markers.filter(marker => marker.visible),headMesh])[0];if (!hit) return;
  if (hit.object === headMesh) {choose('neck');return;}
  choose(hit.object.userData.joint.id);
  if (['neck','waist','torso'].includes(selected.id)) return;
  const origin = position(selected.group);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),origin);
  const point = raycaster.ray.intersectPlane(plane,new THREE.Vector3());if (!point) return;
  drag = {pointerId:event.pointerId,plane,offset:origin.clone().sub(point),origin,up:new THREE.Vector3(0,1,0).applyQuaternion(selected.group.getWorldQuaternion(new THREE.Quaternion()))};
  if (/Wrist|Ankle|Elbow|Knee/.test(selected.id)) {
    drag.chain = chain(selected.id);drag.target = position(drag.chain.end);drag.pole = position(drag.chain.middle);
    const start = position(drag.chain.upper), axis = drag.target.clone().sub(start).normalize();
    const bend = drag.pole.clone().sub(start);bend.addScaledVector(axis,-bend.dot(axis));
    if (bend.lengthSq() < .00001) drag.pole.add(new THREE.Vector3(0,0,/Wrist|Elbow/.test(selected.id) ? -.3:.3).applyQuaternion(root.quaternion));
  }
  renderer.domElement.setPointerCapture(event.pointerId);document.querySelector('.stage').dataset.dragging = 'true';
});
renderer.domElement.addEventListener('pointermove',event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  playback.edited = true;
  if (drag.finger) {
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if(!drag.finger.isToe&&!drag.motion&&Math.hypot(dx,dy)>4)drag.motion=Math.abs(dx)>Math.abs(dy)?'spread':'bend';
    if(drag.motion==='spread')setFingerSpread(drag.base,drag.startSpread/drag.base.spreadDirection+dx*drag.spreadSign*.009);
    else (drag.finger.isToe?setToeBend:setFingerBend)(drag.finger,drag.startAngle+dy*.012);
    enforcePole();updateFingerUI();return;
  }
  if (drag.rotation) {
    const delta = new THREE.Vector2(event.clientX-drag.startX,event.clientY-drag.startY);
    const angle = delta.dot(drag.tangent)/drag.tangent.lengthSq();
    drag.joint.group.quaternion.copy(drag.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(axisVectors[drag.axis],angle));
    if(drag.joint.id.endsWith('Ankle')&&drag.axis==='x'){const foot=feet[drag.joint.id.startsWith('left')?'left':'right'];setFootShape(foot,drag.archAngle+angle*.45);}
    const rotation = drag.joint.group.rotation;
    // Wrist direction limits are swept in enforcePole, including changes made by IK.
    if(!/Wrist|Ankle/.test(drag.joint.id))['x','y','z'].forEach((axis,i) => {rotation[axis] = THREE.MathUtils.clamp(rotation[axis],...drag.joint.limits[i].map(THREE.MathUtils.degToRad));});
    if(!poleStudio&&sequence.steps[playback.index]?.floorSupport==='palms-knees'&&['waist','torso','neck'].includes(drag.joint.id))placeHandsAndKnees(palmRig);
    enforcePole();return;
  }
  ray(event);const target = raycaster.ray.intersectPlane(drag.plane,new THREE.Vector3());if (!target) return;target.add(drag.offset);
  if (selected.id === 'pelvis') root.position.copy(target);
  else if (drag.chain) {
    const bendHandle = /Elbow|Knee/.test(selected.id);
    solve(drag.chain,bendHandle ? drag.target:target,bendHandle ? target:drag.pole);
  } else {
    const direction = target.clone().sub(drag.origin).addScaledVector(drag.up,.3);
    if (direction.lengthSq() > 1e-8) aim(selected.group,new THREE.Vector3(0,1,0),direction);
  }
  enforcePole();
  if (poleStudio && selected.id.endsWith('Wrist') && document.querySelector('#auto-grip').checked) {
    const handPosition = position(selected.group);
    const side = selected.id.startsWith('left') ? 'left':'right';
    if (!poleConstraints.grips.has(side) && Math.hypot(handPosition.x,handPosition.z)<.14 && poleConstraints.attach(side)) {endDrag();updateContactUI();}
  }
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) renderer.domElement.addEventListener(type,event => {if (drag?.pointerId === event.pointerId) endDrag();});
window.addEventListener('blur',endDrag);
document.querySelectorAll('[data-mode]').forEach(button => {button.onclick = () => setMode(button.dataset.mode);});
document.querySelector('#reset-joint').onclick = () => {
  pausePlayback();playback.edited = true;endDrag();
  if (/Wrist|Ankle|Elbow|Knee/.test(selected.id)) {const {upper,middle,end} = chain(selected.id);for (const group of [upper,middle,end]) group.rotation.set(0,0,0);if (/Wrist/.test(selected.id)) applyHandPreset(hands[selected.id.startsWith('left') ? 'left':'right'],'open');if (/Ankle/.test(selected.id)){const foot=feet[selected.id.startsWith('left')?'left':'right'];applyToePreset(foot,'open');setFootShape(foot,0);}if (focusedHand) {focusHand(focusedHand.side,focusedHand.isFoot);updateFingerUI();}}
  else {selected.group.rotation.set(0,0,0);if (selected.id === 'pelvis') root.position.set(0,dimensions.pelvisHeight,0);}
  enforcePole();
};
document.querySelector('#reset').onclick = () => {closeHand();pausePlayback();playback.edited = true;endDrag();for (const item of joints) item.group.rotation.set(0,0,0);applyHandOffsets(root);root.position.set(0,dimensions.pelvisHeight,poleStudio ? .58:0);if (poleStudio) {poleConstraints.settle();updateContactUI();}else{floorConstraints.settle();updateFloorContacts();}selfConstraints.sync();updateSelfContactUI();};
function setView(view) {closeHand();endDrag();camera.position.set(...({front:[0,1.3,4.2],side:[4.2,1.3,0],perspective:[2.6,1.9,3.7]}[view]));controls.update();}
document.querySelectorAll('[data-view]').forEach(button => {button.onclick = () => setView(button.dataset.view);});
function applyPoleContacts(step) {
  for (const side of ['left','right']) {
    const contact=step.contacts?.[`${side}Wrist`];
    if (contact) poleConstraints.attach(side,{height:contact[1],angle:step.orbit.angle});
  }
}
function applyExamplePose(step) {
  endDrag();applyHandOffsets(root,step.pose?.handOffsets||step.handOffsets);
  if(step.pose) {
    root.position.fromArray(step.pose.rootPosition);
    joints.forEach(({id,group})=>group.rotation.set(...step.pose.rotations[id]));
    const pose=capturePose(root,joints);
    if(poleStudio)poleConstraints.restore({pose,safe:pose,grips:Object.entries(step.pose.poleContacts)});
    else floorConstraints.restore({pose,safe:pose});
    root.updateWorldMatrix(true,true);return;
  }
  root.position.fromArray(step.rootPosition);
  for (const {id,group} of joints) {
    const angles = step.rotations[id] || [0,0,0];
    group.rotation.set(...angles.map(THREE.MathUtils.degToRad));
  }
  root.updateWorldMatrix(true,true);

  for (const hand of Object.values(hands)) applyHandPreset(hand,'open');
  if (poleStudio) {poleConstraints.settle();applyPoleContacts(step);}else {if(step.floorSupport==='palms-knees')placeHandsAndKnees(palmRig);else if(palmsAreSupported(step))placePalmsOnFloor(palmRig);floorConstraints.settle();}
  root.updateWorldMatrix(true,true);
}
function bodyBounds() {
  const bounds = new THREE.Box3();
  root.updateWorldMatrix(true,true);
  root.traverse(object => {
    if (object.isMesh && object.userData.bodyPart && !object.userData.joint) bounds.union(new THREE.Box3().setFromObject(object));
  });
  return bounds;
}
function framePose(targetCamera, aspect, bounds = bodyBounds()) {
  if (poleStudio) bounds = bounds.clone().expandByPoint(new THREE.Vector3(0,0,0)).expandByPoint(new THREE.Vector3(0,2.15,0));
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = size.length()/2;
  const halfFov = THREE.MathUtils.degToRad(targetCamera.fov/2);
  const limitingFov = Math.min(halfFov,Math.atan(Math.tan(halfFov)*aspect));
  const distance = radius/Math.sin(limitingFov)*1.15;
  targetCamera.position.copy(center).add(new THREE.Vector3(1,.35,1.1).normalize().multiplyScalar(distance));
  targetCamera.lookAt(center);
  return center;
}
let thumbnails;
function makeThumbnails(steps=sequence.steps,collectFrames=true) {
  if(collectFrames){sequenceFrames.length=0;sequenceBounds.makeEmpty();}
  const savedConstraints = poleConstraints?.snapshot();
  const savedFloor = floorConstraints?.snapshot();
  floorContactMarkers.visible = false;
  const savedPosition = root.position.clone();
  const savedRotations = joints.map(({group}) => group.quaternion.clone());
  const savedSize = renderer.getSize(new THREE.Vector2());
  const savedPixelRatio = renderer.getPixelRatio();
  const markerVisibility = markers.map(marker => marker.visible);
  const ringsVisible = headRings.visible;
  const previewCamera = new THREE.PerspectiveCamera(35,1.2,.01,50);
  const canvas = document.createElement('canvas');canvas.width = 288;canvas.height = 240;
  const context = canvas.getContext('2d');
  try {
    renderer.setPixelRatio(1);renderer.setSize(288,240,false);
    for (const marker of markers) marker.visible = false;
    headRings.visible = false;
    return steps.map(step => {
      applyExamplePose(step);
      if(collectFrames){sequenceFrames.push({...capturePose(root,joints),grips:poleStudio ? [...poleConstraints.grips].map(([side,grip])=>[side,{...grip}]):[]});
      sequenceBounds.union(bodyBounds());}
      framePose(previewCamera,1.2);
      renderer.render(scene,previewCamera);
      context.drawImage(renderer.domElement,0,0);
      return canvas.toDataURL('image/png');
    });
  } finally {
    root.position.copy(savedPosition);
    joints.forEach(({group},i) => group.quaternion.copy(savedRotations[i]));
    markers.forEach((marker,i) => {marker.visible = markerVisibility[i];});
    headRings.visible = ringsVisible;
    if (savedConstraints) poleConstraints.restore(savedConstraints);
    if (savedFloor) floorConstraints.restore(savedFloor);
    updateFloorContacts();
    renderer.setPixelRatio(savedPixelRatio);renderer.setSize(savedSize.x,savedSize.y,false);
    renderer.render(scene,camera);
  }
}
function updatePlaybackUI() {
  document.querySelector('#play-sequence').disabled=!sequence.steps.length;
  document.querySelector('#restart-sequence').disabled=!sequence.steps.length;
  document.querySelector('#download').disabled=!sequence.steps.length;
  setPlaybackIcon(document.querySelector('#play-sequence'),playback.playing ? 'Pause' : playback.time >= timeline.duration ? 'Replay' : 'Play');
  const format = value => `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
  document.querySelector('#playback-time').textContent = `${format(playback.time)} / ${format(timeline.duration)}`;
  if(!playback.playing)updateFloorContacts();
}
function pausePlayback() {
  playback.playing = false;playback.lastTick = null;updatePlaybackUI();
}
function highlightStep(index,next=index,moving=false) {
  const cards = [...document.querySelectorAll('.pose-card')];
  cards.forEach((card,i) => card.setAttribute('aria-pressed',String(i === index)));
  const step = sequence.steps[index];
  if(!step){statusText('');return;}
  const message = `${index+1} / ${sequence.steps.length} - ${step.name}${moving ? ` to ${sequence.steps[next].name}` : ''}`;
  const status = document.querySelector('#sequence-status');
  if (status.textContent !== message) {
    status.textContent = message;
    if (playback.playing && cards[index]) {
      const gallery = document.querySelector('#pose-gallery');
      const card = cards[index];
      gallery.scrollTo({left:card.offsetLeft-gallery.offsetLeft-(gallery.clientWidth-card.clientWidth)/2,behavior:'smooth'});
    }
  }
}
function renderPlayback() {
  const sample = timeline.sample(playback.time);
  const from = sequenceFrames[sample.index], to = sequenceFrames[sample.next];
  if (!from || !to) return;
  const selfBefore=selfConstraints.snapshot(),surface=poleConstraints||floorConstraints,surfaceBefore=surface.snapshot();
  if (poleStudio) {
    const motion=samplePoleMotion(sequence.steps,sequenceFrames,sample.index,sample.next,sample.mix,joints.map((j,i)=>j.isFinger ? i:-1).filter(i=>i>=0));
    blendHandOffsets(root,from.handOffsets,to.handOffsets,sample.mix);
    root.position.copy(motion.position);
    joints.forEach(({group},i)=>group.quaternion.copy(motion.rotations[i]));
    poleConstraints.grips.clear();
    for (const [side,grip] of motion.grips) poleConstraints.grips.set(side,{...grip});
    if(!poleConstraints.commit()){pausePlayback();sequenceMessage('Transition blocked by pole contact. Add an intermediate pose.',true);}
  } else {
    blendHandOffsets(root,from.handOffsets,to.handOffsets,sample.mix);
    root.position.lerpVectors(from.position,to.position,sample.mix);
    joints.forEach(({group},i)=>group.quaternion.slerpQuaternions(from.rotations[i],to.rotations[i],sample.mix));
    const startSupport=palmsAreSupported(sequence.steps[sample.index]),endSupport=palmsAreSupported(sequence.steps[sample.next]);
    if(sequence.steps[sample.index].floorSupport==='palms-knees'&&sequence.steps[sample.next].floorSupport==='palms-knees')placeHandsAndKnees(palmRig);
    else if(startSupport && endSupport)placePalmsOnFloor(palmRig);
    else if(startSupport || endSupport)preparePalmLanding(palmRig);
    if((sequence.steps[sample.index].floorSupport&&sequence.steps[sample.next].floorSupport)||floorConstraints.clearance()<.0007)floorConstraints.settle();
    updateFloorContacts();
  }
  if(!selfConstraints.commit()){
    const failure=selfConstraints.failure();
    const label=id=>joints.find(joint=>joint.id===id)?.label||id;
    const reason=failure?.joint?`${label(failure.joint)} ${failure.axis} limit`:failure?`${label(failure.a)} / ${label(failure.b)} contact`:'body contact';
    const transition=`${sequence.steps[sample.index].name} → ${sequence.steps[sample.next].name}`;
    surface.restore(surfaceBefore);selfConstraints.restore(selfBefore);playback.time=lastSelfPlaybackTime;playback.index=timeline.sample(playback.time).index;pausePlayback();updateSelfContactUI(true);updateFloorContacts();
    sequenceMessage(`Transition blocked: ${reason} (${transition}). Adjust the pose or add an intermediate pose.`,true);return;
  }
  if(!poleStudio&&sample.index!==sample.next&&sequence.steps[sample.index].contactSchedule){
    const scheduled=sampleContactSchedule(sequence.steps[sample.index].contactSchedule,sample.progress);
    const inspection=inspectSupports(supportRig,{supportRequirements:scheduled.requiredAnchors});
    if(inspection.issues.length){
      surface.restore(surfaceBefore);selfConstraints.restore(selfBefore);playback.time=lastSelfPlaybackTime;playback.index=timeline.sample(playback.time).index;pausePlayback();updateFloorContacts();
      sequenceMessage(`Transition blocked: scheduled contact missing (${inspection.issues.map(issue=>issue.name.replaceAll('-',' ')).join(', ')}). Adjust the pose or release/landing timing.`,true);return;
    }
  }
  lastSelfPlaybackTime=playback.time;
  root.updateWorldMatrix(true,true);
  playback.index = sample.index;
  highlightStep(sample.index,sample.next,sample.mix > 0);
  if (sample.done) pausePlayback();
  updatePlaybackUI();
}
function selectExampleStep(index,flush=true) {
  if(flush)flushPendingPose();
  if(!sequence.steps[index])return;
  fitSupportsStatus.hidden=true;
  closeHand();pausePlayback();playback.time = timeline.startOf(index);playback.index = index;playback.edited = false;
  applyExamplePose(sequence.steps[index]);selfConstraints.sync();updateSelfContactUI();lastSelfPlaybackTime=playback.time;
  updateContactUI();updateFloorContacts();
  controls.target.copy(framePose(camera,camera.aspect));controls.update();
  highlightStep(index);updatePlaybackUI();updateCardFields();
}
function playSequence(restart=false) {
  flushPendingPose();
  if (!sequenceFrames.length) return;
  if(!poleStudio){
    const issues=inspectScheduledHolds(supportRig,sequence.steps,sequenceFrames);
    if(issues.length){pausePlayback();sequenceMessage(`Contact schedule needs adjustment: ${issues[0].reason}`,true);return;}
  }
  closeHand();endDrag();
  if (restart || playback.time >= timeline.duration){playback.time=0;applyExamplePose(sequence.steps[0]);selfConstraints.sync();}
  else if (playback.edited) playback.time = timeline.startOf(playback.index);
  playback.edited = false;
  if(selfConstraints.jointViolations().length){updateSelfContactUI();sequenceMessage('This pose exceeds a wrist limit. Adjust the hand or arm before playback.',true);return;}
  if(selfConstraints.contacts().length){updateSelfContactUI();sequenceMessage('This pose has overlapping body parts. Separate them before playback.',true);return;}
  selfConstraints.sync();lastSelfPlaybackTime=playback.time;
  setMode('view');
  controls.target.copy(framePose(camera,camera.aspect,sequenceBounds));controls.update();
  playback.playing = true;playback.lastTick = null;renderPlayback();
}
document.querySelector('#play-sequence').onclick = () => playback.playing ? pausePlayback() : playSequence();
document.querySelector('#restart-sequence').onclick = () => playSequence(true);
speedControl.onchange = event => {playback.speed = Number(event.target.value);};
document.addEventListener('visibilitychange',() => {if (document.hidden) pausePlayback();});
function statusText(message){document.querySelector('#sequence-status').textContent=message;}
function sequenceMessage(message,error=false){const node=document.querySelector('#sequence-message');node.textContent=message;node.dataset.error=String(error);}
function rememberSequence(){sequenceHistory.push({sequence:structuredClone(sequence),index:playback.index});if(sequenceHistory.length>20)sequenceHistory.shift();document.querySelector('#undo-sequence').disabled=false;}
function storedPose(){const offsets=Object.fromEntries(Object.entries(captureHandOffsets(root)).filter(([,v])=>v.lengthSq()>0).map(([side,v])=>[side,v.toArray()]));return {...(Object.keys(offsets).length?{handOffsets:offsets}:{}),rootPosition:root.position.toArray(),rotations:Object.fromEntries(joints.map(({id,group})=>[id,[group.rotation.x,group.rotation.y,group.rotation.z]])),poleContacts:poleStudio?Object.fromEntries([...poleConstraints.grips].map(([side,grip])=>[side,{...grip}])):{}};}
function capturedStep(previous={}) {
  const pose=storedPose();
  const step={id:previous.id||crypto.randomUUID(),name:previous.name||`Pose ${sequence.steps.length+1}`,kind:previous.kind||'pose',cue:previous.cue||'',holdSeconds:previous.holdSeconds??1.4,transitionSeconds:previous.transitionSeconds??2.2,pose};
  if(!poleStudio&&(previous.supportRequirements||previous.source))step.supportRequirements=[...supportProfile(previous).requirements];
  if(previous.contactSchedule)step.contactSchedule=structuredClone(previous.contactSchedule);
  if(poleStudio){
    let angle=Math.atan2(pose.rootPosition[0],pose.rootPosition[2]);
    const reference=previous.orbit?.angle??sequence.steps.at(-1)?.orbit?.angle??angle;
    angle+=Math.round((reference-angle)/(Math.PI*2))*Math.PI*2;
    step.orbit={angle,radius:Math.hypot(pose.rootPosition[0],pose.rootPosition[2])};
  }else if(Object.values(hands).every(hand=>{
    const normal=new THREE.Vector3(0,0,-1).applyQuaternion(hand.wrist.getWorldQuaternion(new THREE.Quaternion()));
    const surface=hand.palm.localToWorld(new THREE.Vector3(0,0,-.015));
    return normal.distanceTo(new THREE.Vector3(0,-1,0))<.001&&Math.abs(surface.y-.0007)<.001;
  }))step.floorSupport=previous.floorSupport==='forearms'?'forearms':previous.floorSupport==='palms-knees'?'palms-knees':'palms';
  else if(floorConstraints.clearance()<.002)step.floorSupport=previous.floorSupport==='knees-shins'?'knees-shins':'ground';
  return step;
}
function updateCardFields(){
  const step=sequence.steps[playback.index];
  document.querySelector('#card-settings').hidden=!step;
  for(const id of ['update-pose','delete-pose'])document.querySelector('#'+id).disabled=!step;
  document.querySelector('#move-pose-left').disabled=!step||playback.index<=0;
  document.querySelector('#move-pose-right').disabled=!step||playback.index>=sequence.steps.length-1;
  if(step){document.querySelector('#pose-name').value=step.name;document.querySelector('#pose-hold').value=step.holdSeconds;document.querySelector('#pose-transition').value=step.transitionSeconds;}
}
let draggedStepId=null;
function clearCardDropState(){
  document.querySelectorAll('.pose-card').forEach(card=>card.classList.remove('drop-before','drop-after'));
  document.querySelector('#pose-gallery').classList.remove('drop-at-end');
}
function finishCardDrag(){document.querySelectorAll('.pose-card').forEach(card=>card.classList.remove('is-dragging'));clearCardDropState();}
function cardDropBoundary(card,event){
  const bounds=card.getBoundingClientRect();
  return Number(card.dataset.index)+(event.clientX>=bounds.left+bounds.width/2?1:0);
}
function moveDraggedStep(boundary){
  if(!draggedStepId)return;
  flushPendingPose();
  const from=sequence.steps.findIndex(step=>step.id===draggedStepId);
  if(from<0)return;
  const destination=Math.max(0,Math.min(sequence.steps.length-1,boundary-(from<boundary?1:0)));
  if(destination===from)return;
  rememberSequence();
  const [step]=sequence.steps.splice(from,1);sequence.steps.splice(destination,0,step);
  playback.index=destination;playback.edited=false;rebuildSequence();selectExampleStep(destination,false);
  sequenceMessage(`Moved ${step.name} to step ${destination+1}. Undo restores the previous order.`);
}
function rebuildSequence(){
  closeHand();pausePlayback();timeline=createTimeline(sequence.steps);
  thumbnails=makeThumbnails();
  const cards=sequence.steps.map((step,index)=>{
    const card=document.createElement('button');card.className='pose-card';card.type='button';card.dataset.kind=step.kind;card.dataset.index=String(index);card.draggable=true;
    card.setAttribute('aria-pressed',String(index===playback.index));card.setAttribute('aria-label',`Step ${index+1}: ${step.name}`);
    const image=document.createElement('img');image.src=thumbnails[index];image.alt='';image.width=288;image.height=240;
    const label=document.createElement('span');label.className='pose-label';label.textContent=`${String(index+1).padStart(2,'0')}  ${step.name}`;
    const cue=document.createElement('small');cue.textContent=`Hold ${step.holdSeconds}s / Move ${step.transitionSeconds}s`;label.append(cue);
    card.append(image,label);card.onclick=()=>selectExampleStep(index);
    card.ondragstart=event=>{draggedStepId=step.id;card.classList.add('is-dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',step.id);};
    card.ondragover=event=>{if(!draggedStepId)return;event.preventDefault();event.dataTransfer.dropEffect='move';clearCardDropState();card.classList.add(cardDropBoundary(card,event)===index?'drop-before':'drop-after');};
    card.ondrop=event=>{event.preventDefault();event.stopPropagation();const boundary=cardDropBoundary(card,event);clearCardDropState();moveDraggedStep(boundary);draggedStepId=null;};
    card.ondragend=()=>{draggedStepId=null;finishCardDrag();};
    return card;
  });
  const gallery=document.querySelector('#pose-gallery');gallery.replaceChildren(...cards);
  gallery.ondragover=event=>{if(!draggedStepId||event.target.closest('.pose-card'))return;event.preventDefault();clearCardDropState();gallery.classList.add('drop-at-end');};
  gallery.ondrop=event=>{if(!draggedStepId||event.target.closest('.pose-card'))return;event.preventDefault();clearCardDropState();moveDraggedStep(sequence.steps.length);draggedStepId=null;};
  if(!cards.length){const empty=document.createElement('p');empty.className='sequence-empty';empty.textContent='Create a pose, then choose Add current pose. You can also start with an example.';gallery.append(empty);statusText('');}
  document.querySelector('#example-gallery').hidden=false;document.querySelector('main').classList.add('has-example');
  document.querySelector('#sequence-name').value=sequence.name;document.querySelector('#sequence-heading').textContent=sequence.name;
  document.querySelector('#sequence-description').textContent=`${sequence.steps.length} poses / Select a card to edit, or drag it to reorder.`;
  playback.time=sequence.steps.length?timeline.startOf(Math.max(0,playback.index)):0;
  updateCardFields();updatePlaybackUI();
}
function flushPendingPose(){
  if(!playback.edited||!sequence.steps[playback.index])return;
  rememberSequence();sequence.steps[playback.index]=capturedStep(sequence.steps[playback.index]);playback.edited=false;rebuildSequence();
}
function updateExampleNote(){
 const note=document.querySelector('#example-note');if(!note)return;
 const example=examples.find(item=>item.id===exampleControl.value);
 note.replaceChildren();note.hidden=!example?.description;
 if(example?.description){note.append(document.createTextNode(example.description+' '));if(example.source){const link=document.createElement('a');link.href=example.source;link.textContent=`Reference: ${example.sourceLabel||'source guide'}`;link.target='_blank';link.rel='noopener noreferrer';note.append(link);}}
}
function replaceSequence(next,index=0){sequence=next;playback.index=next.steps.length?Math.max(0,Math.min(index,next.steps.length-1)):-1;playback.edited=false;rebuildSequence();if(sequence.steps.length)selectExampleStep(playback.index,false);updateExampleNote();}
function validatePoses(next){
  const saved=poleConstraints?.snapshot()||floorConstraints.snapshot();
  try{for(const [index,step] of next.steps.entries()){applyExamplePose(step);const clearance=poleStudio?poleConstraints.clearance():floorConstraints.clearance();if(clearance<-.0001)throw new Error(`Pose ${index+1} intersects the ${poleStudio?'pole':'floor'}. The current sequence has not been replaced.`);}}
  finally{if(poleStudio)poleConstraints.restore(saved);else floorConstraints.restore(saved);}
}
exampleControl.addEventListener('change',event=>{
  const example=examples.find(item=>item.id===event.target.value);
  if(!example){updateExampleNote();return;}
  flushPendingPose();rememberSequence();closeHand();pausePlayback();
  const steps=example.steps.map(template=>{applyExamplePose(template);return capturedStep(template);});
  replaceSequence({...emptySequence(),name:example.name,steps});sequenceMessage('Example loaded as an editable sequence.');
});
document.querySelector('#add-pose').onclick=()=>{
  if(sequence.steps.length>=MAX_STEPS){sequenceMessage(`A sequence can contain up to ${MAX_STEPS} poses.`,true);return;}
  pausePlayback();rememberSequence();const step=capturedStep();sequence.steps.push(step);playback.index=sequence.steps.length-1;playback.edited=false;
  rebuildSequence();selectExampleStep(playback.index,false);sequenceMessage('Pose added. Shape the next pose, then add it.');
};
document.querySelector('#update-pose').onclick=()=>{
  if(!sequence.steps[playback.index])return;
  pausePlayback();rememberSequence();sequence.steps[playback.index]=capturedStep(sequence.steps[playback.index]);playback.edited=false;rebuildSequence();sequenceMessage('Selected pose updated.');
};
for(const [id,delta] of [['move-pose-left',-1],['move-pose-right',1]])document.querySelector('#'+id).onclick=()=>{
  flushPendingPose();const index=playback.index,next=index+delta;if(next<0||next>=sequence.steps.length)return;
  rememberSequence();[sequence.steps[index],sequence.steps[next]]=[sequence.steps[next],sequence.steps[index]];playback.index=next;rebuildSequence();selectExampleStep(next,false);
};
document.querySelector('#delete-pose').onclick=()=>{
  if(!sequence.steps[playback.index])return;
  rememberSequence();sequence.steps.splice(playback.index,1);replaceSequence(sequence,playback.index);sequenceMessage('Pose deleted. Undo restores it.');
};
for(const [id,key] of [['pose-name','name'],['pose-hold','holdSeconds'],['pose-transition','transitionSeconds']])document.querySelector('#'+id).onchange=event=>{
  const step=sequence.steps[playback.index];if(!step)return;
  const value=key==='name'?event.target.value.trim():Number(event.target.value);
  if((key==='name'&&!value)||(key!=='name'&&(!Number.isFinite(value)||value<(key==='holdSeconds'?0:.05)||value>120))){sequenceMessage('Enter a name and valid timing between 0 and 120 seconds (movement: at least 0.05).',true);updateCardFields();return;}
  flushPendingPose();rememberSequence();sequence.steps[playback.index][key]=value;rebuildSequence();sequenceMessage('Card settings updated.');
};
document.querySelector('#sequence-name').onchange=event=>{const name=event.target.value.trim();if(!name){event.target.value=sequence.name;return;}rememberSequence();sequence.name=name;document.querySelector('#sequence-heading').textContent=name;};
document.querySelector('#new-sequence').onclick=()=>{flushPendingPose();rememberSequence();exampleControl.value='';replaceSequence(emptySequence());sequenceMessage('New sequence. Add a pose to begin. Undo restores the previous sequence.');};
document.querySelector('#undo-sequence').onclick=()=>{
  if(playback.edited&&sequence.steps[playback.index]){playback.edited=false;selectExampleStep(playback.index,false);sequenceMessage('Pending pose edits reverted.');return;}
  const previous=sequenceHistory.pop();if(!previous)return;replaceSequence(previous.sequence,previous.index);document.querySelector('#undo-sequence').disabled=!sequenceHistory.length;sequenceMessage('Sequence change undone.');
};
document.querySelector('#download').onclick=()=>{
  try{
    flushPendingPose();if(!sequence.steps.length)return;
    const content=serializeSequence(sequence,fileContext);
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=(sequence.name.replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'')||'movement')+'.sequence.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    sequenceMessage(`Saved ${sequence.steps.length} poses. Use Load sequence to restore this file later.`);
  }catch(error){sequenceMessage(error.message,true);}
};
document.querySelector('#load-sequence').onclick=()=>document.querySelector('#sequence-file').click();
document.querySelector('#sequence-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>2*1024*1024)throw new Error('Choose a sequence file smaller than 2 MB.');
    const next=parseSequence(await file.text(),fileContext);validatePoses(next);
    flushPendingPose();rememberSequence();exampleControl.value='';replaceSequence(next);sequenceMessage(`Loaded ${next.steps.length} poses from ${file.name}.`);
  }catch(error){sequenceMessage(error.message,true);}
  finally{event.target.value='';}
};
new ResizeObserver(() => {const {width,height} = viewport.getBoundingClientRect();camera.aspect = width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}).observe(viewport);
enableStageResize(document.querySelector('.stage'));
enableSequencePanel();
if (floorConstraints) {floorConstraints.settle();updateFloorContacts();}
selfConstraints.sync();updateSelfContactUI();
choose(poleStudio ? 'leftWrist':'neck');setView('perspective');setMode(poleStudio ? 'view':'pose');
if (poleStudio) exampleControl.dispatchEvent(new Event('change'));else rebuildSequence();
renderer.setAnimationLoop(now => {
  if (playback.playing) {
    const elapsed = playback.lastTick === null ? 0 : Math.min((now-playback.lastTick)/1000,.1);
    playback.lastTick = now;
    playback.time = Math.min(timeline.duration,playback.time+elapsed*playback.speed);
    renderPlayback();
  }
  if (controls.enabled) controls.update();
  renderer.render(scene,camera);
});


const poseLibrary=document.querySelector('#pose-library');
if(poseLibrary){
 const previews=new Map(),pageSize=24;
 let page=0,generation=0;
 const search=poseLibrary.querySelector('#pose-search'),category=poseLibrary.querySelector('#pose-category'),difficulty=poseLibrary.querySelector('#pose-difficulty');
 for(const name of [...new Set(yogaPoses.map(p=>p.category))].sort()){const option=document.createElement('option');option.value=name;option.textContent=name;category.append(option);}
 search.value='';category.value='';difficulty.value='';
 async function renderLibrary(){
  const request=++generation;
  const query=search.value.trim().toLowerCase();
  const matching=yogaPoses.filter(pose=>pose.name.toLowerCase().includes(query)&&(!category.value||pose.category===category.value)&&(!difficulty.value||pose.difficulty===difficulty.value));
  const totalPages=Math.max(1,Math.ceil(matching.length/pageSize));page=Math.min(page,totalPages-1);
  const visible=matching.slice(page*pageSize,(page+1)*pageSize),pending=[];
  const cards=visible.map(pose=>{
   const item=document.createElement('article');item.className='library-card';
   const button=document.createElement('button');button.type='button';button.className='pose-card';button.setAttribute('aria-label',`Add ${pose.name} to sequence`);
   const img=document.createElement('img');img.alt='';img.width=288;img.height=240;
   if(previews.has(pose.id))img.src=previews.get(pose.id);else{img.hidden=true;pending.push({pose,img});}
   const label=document.createElement('span');label.className='pose-label';label.textContent=pose.name;
   const detail=document.createElement('small');detail.textContent=`${pose.category} · ${pose.difficulty}`;
   const action=document.createElement('small');action.textContent=pose.draft?'Draft · Add to sequence':'Add to sequence';
   label.append(detail,action);button.append(img,label);
   button.onclick=()=>{
    if(sequence.steps.length>=MAX_STEPS){poseLibrary.querySelector('#pose-results').textContent=`Sequence limit reached (${MAX_STEPS} poses).`;return;}
    flushPendingPose();rememberSequence();applyExamplePose(pose);
    sequence.steps.push(capturedStep({...pose,id:crypto.randomUUID()}));playback.index=sequence.steps.length-1;playback.edited=false;
    rebuildSequence();selectExampleStep(playback.index,false);poseLibrary.close();sequenceMessage(`${pose.name} added.${pose.draft?' Draft pose: refine its alignment and contacts in Pose mode.':' Edit the pose or choose another from Poses.'}`);
   };
   const source=document.createElement('a');source.href=pose.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Pocket Yoga reference';source.setAttribute('aria-label',`${pose.name} — Pocket Yoga reference`);
   item.append(button,source);return item;
  });
  poseLibrary.querySelector('#library-grid').replaceChildren(...cards);
  poseLibrary.querySelector('#pose-results').textContent=matching.length?`${matching.length} poses · ${page*pageSize+1}–${page*pageSize+visible.length}`:'No poses match. Try another name or category.';
  poseLibrary.querySelector('#pose-page').textContent=`Page ${page+1} of ${totalPages}`;
  poseLibrary.querySelector('#poses-previous').disabled=page===0;
  poseLibrary.querySelector('#poses-next').disabled=page+1>=totalPages;
  for(const {pose,img} of pending){
   await new Promise(requestAnimationFrame);
   if(request!==generation||!poseLibrary.open)return;
   const preview=makeThumbnails([pose],false)[0];previews.set(pose.id,preview);img.src=preview;img.hidden=false;
  }
 }
 document.querySelector('#open-poses').onclick=()=>{closeHand();pausePlayback();poseLibrary.showModal();renderLibrary();search.focus();};
 poseLibrary.querySelector('#close-poses').onclick=()=>poseLibrary.close();
 poseLibrary.addEventListener('close',()=>{generation++;});
 const filter=()=>{page=0;renderLibrary();};search.oninput=filter;category.onchange=filter;difficulty.onchange=filter;
 for(const [id,delta] of [['poses-previous',-1],['poses-next',1]])poseLibrary.querySelector('#'+id).onclick=()=>{page+=delta;renderLibrary();poseLibrary.scrollTop=0;};
}

for(const button of document.querySelectorAll('[data-foot-shape]'))button.onclick=()=>{
 if(!focusedHand?.isFoot)return;
 pausePlayback();setMode('pose');playback.edited=true;applyFootShape(focusedHand,button.dataset.footShape);enforcePole();updateFingerUI();
};
