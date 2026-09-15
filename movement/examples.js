// Illustrative Sun Salutation A poses. Angles are local XYZ Euler degrees.
function pose(id, name, cue, {height=.97, pelvis=0, chest=0, head=0, hip=0, knee=0, shoulder=0, elbow=0, ankle=0,arch=0} = {}) {
  const rotations = {pelvis:[pelvis,0,0],torso:[chest,0,0],neck:[head,0,0]};
  for (const side of ['left','right']) {
    for (const [joint,angle] of Object.entries({Hip:hip,Knee:knee,Shoulder:shoulder,Elbow:elbow,Ankle:ankle,FootArch:arch})) rotations[side+joint] = [angle,0,0];
  }
  return {id,name,cue,holdSeconds:1.4,transitionSeconds:2.2,rootPosition:[0,height,0],rotations};
}
const mountain = {arch:8};
const salute = {shoulder:-180,head:-12,arch:8};
const fold = {pelvis:155,hip:-155,shoulder:-155,head:10,arch:8};
const halfLift = {pelvis:90,hip:-90,shoulder:-90,head:-30,arch:8};
function transition(id,name,forward) {
  const step = pose(id,name,forward ? 'Step forward' : 'Step back', {height:.56,pelvis:95,hip:-30,knee:15,shoulder:-95});
  step.kind = 'transition';step.holdSeconds = .35;step.transitionSeconds = 2.4;
  step.rotations.leftHip = [-125,0,0];step.rotations.leftKnee = [60,0,0];
  step.rotations.leftAnkle = [-30,0,0];step.rotations.leftFootArch = [8,0,0];
  step.rotations.rightHip = [-5,0,0];step.rotations.rightKnee = [10,0,0];
  return step;
}
export const sunSalutation = {
  id:'sun-salutation-a', name:'Sun Salutation', subtitle:'Sun Salutation A / 16 steps',
  steps:[
    pose('mountain-start','Mountain','Arrive',mountain),
    pose('salute-start','Upward Salute','Inhale',salute),
    pose('fold-start','Forward Fold','Exhale',fold),
    pose('half-lift-start','Halfway Lift','Inhale',halfLift),
    {...pose('plant-hands','Plant Hands','Prepare to step',{height:.76,pelvis:120,hip:-135,knee:45,shoulder:-120,ankle:-30,arch:8}),kind:'transition',holdSeconds:.5,transitionSeconds:2.4},
    transition('step-back','Step Back',false),
    pose('plank','Plank','Step back',{height:.41,pelvis:72,shoulder:-72,ankle:-60}),
    pose('low-plank','Low Plank','Exhale',{height:.19,pelvis:84,shoulder:-14,elbow:-110,ankle:-70}),
    pose('upward-dog','Upward-Facing Dog','Inhale',{height:.22,pelvis:65,chest:-15,hip:15,shoulder:-50,head:-20,ankle:50}),
    pose('downward-dog','Downward-Facing Dog','Hold',{height:.8,pelvis:125,hip:-80,shoulder:-180,head:15,ankle:-45,arch:8}),
    transition('step-forward','Step Forward',true),
    {...pose('step-together','Step Together','Bring feet forward',{height:.76,pelvis:120,hip:-135,knee:45,shoulder:-120,ankle:-30,arch:8}),kind:'transition',holdSeconds:.5,transitionSeconds:2.4},
    pose('half-lift-end','Halfway Lift','Inhale',halfLift),
    pose('fold-end','Forward Fold','Exhale',fold),
    pose('salute-end','Upward Salute','Inhale',salute),
    pose('mountain-end','Mountain','Exhale',mountain),
  ],
};

for (const step of sunSalutation.steps) if (['fold-start','fold-end','plant-hands','step-back','plank','low-plank','upward-dog','downward-dog','step-forward','step-together'].includes(step.id)) step.floorSupport = 'palms';
for(const step of sunSalutation.steps){
 step.supportRequirements=step.id.startsWith('fold-')?['palms','soles']:
  ['plank','low-plank'].includes(step.id)?['palms','toes']:
  step.id==='upward-dog'?['palms','foot-tops']:
  step.id==='downward-dog'?['palms','forefeet']:
  ['step-back','step-forward'].includes(step.id)?['palms','opposite-sole-toe']:
  ['plant-hands','step-together'].includes(step.id)?['palms','forefeet']:['soles'];
}
