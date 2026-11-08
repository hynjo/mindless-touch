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
  // Stepping forward is not the reverse endpoint of stepping back. Preserve a
  // solved three-point base (both palms + rear toes) while the forward sole
  // lands, rather than making palm fitting overflex the lead hip and ankle.
  if(forward){
    step.rootPosition=[0,.6006,0];
    Object.assign(step.rotations,{
      leftShoulder:[-88.97,0,0],rightShoulder:[-88.97,0,0],
      leftElbow:[-16.1,0,0],rightElbow:[-16.1,0,0],
      leftWrist:[-79.93,0,0],rightWrist:[-79.93,0,0],
      leftHip:[-129,0,0],leftKnee:[107.74,0,0],leftAnkle:[-38,0,0],
      rightHip:[-49.66,0,0],rightKnee:[22.64,0,0],rightAnkle:[32.01,0,0],
    });
  }
  if(!forward){
    // The transition keeps the lead heel free. Forcing its entire sole down
    // overflexed both the hip and ankle in this mannequin's short leg chain.
    step.rootPosition=[0,.8160543407313524,0];
    Object.assign(step.rotations,{
      pelvis:[126.99163047131151,0,0],
      leftShoulder:[-116.4718799552004,0,0],leftElbow:[-34.013234436875024,0,0],leftWrist:[-66.50651607923608,0,0],
      leftHip:[-120.65845707813544,0,0],leftKnee:[35.07082254902812,0,0],leftAnkle:[-28.72696734161206,0,0],
      rightShoulder:[-104.54630751617772,0,0],rightElbow:[-33.07038136472984,0,0],rightWrist:[-79.37494159040395,0,0],
      rightHip:[-90.65712974335163,0,0],rightKnee:[-1.5,0,0],rightAnkle:[14.082700469470693,0,0],
    });
    step.contactSchedule={version:1,anchors:[
      {anchor:'left-palm',start:true,end:true},
      {anchor:'right-palm',start:true,end:true},
      {anchor:'right-toe',start:true,end:true},
      {anchor:'left-forefoot',start:true,end:false,release:[0,.2]},
      {anchor:'left-toe',start:false,end:true,landing:[.8,1]},
    ]};
  }
  return step;
}
export const sunSalutation = {
  id:'sun-salutation-a', name:'Sun Salutation', subtitle:'Sun Salutation A / 17 steps',
  steps:[
    pose('mountain-start','Mountain','Arrive',mountain),
    pose('salute-start','Upward Salute','Inhale',salute),
    pose('fold-start','Forward Fold','Exhale',fold),
    pose('half-lift-start','Halfway Lift','Inhale',halfLift),
    {...pose('plant-hands','Plant Hands','Prepare to step',{height:.8,pelvis:125,hip:-110,knee:25,shoulder:-120,ankle:-40,arch:8}),kind:'transition',holdSeconds:.5,transitionSeconds:2.4},
    transition('step-back','Step Back',false),
    // Keep ankle flexion inside the editor envelope so grounded transition IK
    // has room to preserve toe support without starting on the limit.
    pose('plank','Plank','Step back',{height:.41,pelvis:72,shoulder:-72,ankle:-36}),
    pose('low-plank','Low Plank','Exhale',{height:.19,pelvis:84,shoulder:-14,elbow:-110,ankle:-30}),
    pose('upward-dog','Upward-Facing Dog','Inhale',{height:.22,pelvis:65,chest:-15,hip:15,shoulder:-50,head:-20,ankle:50}),
    {...pose('plank-before-downward-dog','Plank','Transition',{height:.41,pelvis:72,shoulder:-72,ankle:-36}),holdSeconds:.5},
    pose('downward-dog','Downward-Facing Dog','Hold',{height:.8,pelvis:125,hip:-80,shoulder:-180,head:15,ankle:-40,arch:8}),
    transition('step-forward','Step Forward',true),
    {...pose('step-together','Step Together','Bring feet forward',{height:.76,pelvis:120,hip:-135,knee:45,shoulder:-120,ankle:-30,arch:8}),kind:'transition',holdSeconds:.5,transitionSeconds:2.4},
    pose('half-lift-end','Halfway Lift','Inhale',halfLift),
    pose('fold-end','Forward Fold','Exhale',fold),
    pose('salute-end','Upward Salute','Inhale',salute),
    pose('mountain-end','Mountain','Exhale',mountain),
  ],
};

for (const step of sunSalutation.steps) if (['fold-start','fold-end','plant-hands','step-back','plank','plank-before-downward-dog','low-plank','upward-dog','downward-dog','step-forward','step-together'].includes(step.id)) step.floorSupport = 'palms';
for(const step of sunSalutation.steps){
 step.supportRequirements=step.id.startsWith('fold-')?['palms','soles']:
  ['plank','plank-before-downward-dog','low-plank'].includes(step.id)?['palms','toes']:
  step.id==='upward-dog'?['palms','foot-tops']:
  step.id==='downward-dog'?['palms','forefeet']:
  step.id==='step-back'?['palms','opposite-forefoot-toe']:
  step.id==='step-forward'?['palms','right-toe']:
  ['plant-hands','step-together'].includes(step.id)?['palms','forefeet']:['soles'];
}
sunSalutation.steps.find(step=>step.id==='plant-hands').contactSchedule={version:1,anchors:[
 {anchor:'left-palm',start:true,end:true},
 {anchor:'right-palm',start:true,end:true},
 {anchor:'left-forefoot',start:true,end:true},
 {anchor:'right-forefoot',start:true,end:false,release:[0,.2]},
 {anchor:'right-toe',start:false,end:true,landing:[.8,1]},
]};
sunSalutation.steps.find(step=>step.id==='downward-dog').contactSchedule={version:1,anchors:[
 {anchor:'left-palm',start:true,end:true},
 {anchor:'right-palm',start:true,end:true},
 {anchor:'right-toe',start:true,end:true},
 {anchor:'left-forefoot',start:true,end:false,release:[0,.25]},
 {anchor:'right-forefoot',start:true,end:false,release:[0,.25]},
]};
