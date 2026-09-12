// Raised, open hands approach along the pole normal, avoiding a sweep through it.
const readyArms={
  leftShoulder:[-123.98223949, -16.52905869, 9.46972837],
  leftElbow:[-28.77231979, 8.03555168, -59.93000745],
  leftWrist:[-22.55379242, -16.9463298, -31.02808604],
  rightShoulder:[-45.04691967, -4.33037279, 10.41852045],
  rightElbow:[-41.15026122, -15.00464755, 59.10951031],
  rightWrist:[-100.21636449, 61.94171821, -55.81813051]
};
// An illustrative pole flow, with explicit grip targets and an orbital body path.
// This is authored animation data, not a simulation of load-bearing contact.
const grip = {leftWrist:[0,1.7,.035],rightWrist:[0,1.32,.035]};
function step(id,name,angle,{radius=.38,height=.97,knee=0,hip=0,contact=true,cue='Hold',kind='pose'}={}) {
  const radians = angle*Math.PI/180;
  return {
    id,name,cue,kind,holdSeconds:kind === 'transition' ? .4:1.6,transitionSeconds:2.8,
    rootPosition:[Math.sin(radians)*radius,height,Math.cos(radians)*radius],
    orbit:{angle:radians,radius},
    rotations:{...readyArms,pelvis:[0,angle+180,0],leftHip:[hip,0,8],rightHip:[hip,0,-8],leftKnee:[knee,0,0],rightKnee:[knee,0,0]},
    contacts:contact ? grip:{},
  };
}
export const poleFlow = {
  id:'pole-flow',name:'Pole Flow',subtitle:'8 steps / Grip, turn and return',
  steps:[
    step('approach','Approach',0,{radius:.58,contact:false,cue:'Find your position'}),
    step('grip','Two-Hand Grip',0,{cue:'Reach to the pole'}),
    step('weight-shift','Weight Shift',-35,{knee:25,hip:-15,cue:'Prepare to turn',kind:'transition'}),
    step('lift','Tuck',-70,{height:1.08,knee:95,hip:-30,cue:'Lift and bend'}),
    step('turn','Turn Around',-150,{height:1.08,knee:95,hip:-30,cue:'Keep your grip'}),
    step('open','Open Shape',-230,{height:1.04,knee:45,hip:-15,cue:'Extend the shape'}),
    step('land','Return to Floor',-310,{knee:15,hip:-5,cue:'Lower with control',kind:'transition'}),
    step('finish','Finish',-360,{contact:false,radius:.58,cue:'Release and move back'}),
  ],
};

export function interpolateOrbit(from,to,mix) {
  const angle = from.orbit.angle+(to.orbit.angle-from.orbit.angle)*mix;
  const radius = from.orbit.radius+(to.orbit.radius-from.orbit.radius)*mix;
  const start=from.rootPosition||from.pose.rootPosition,end=to.rootPosition||to.pose.rootPosition;
  return [Math.sin(angle)*radius,start[1]+(end[1]-start[1])*mix,Math.cos(angle)*radius];
}
