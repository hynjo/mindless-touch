// A short, independently authored adaptation of the reference's rotation and
// side-bend exercises, not its complete daily prescription. Angles are degrees.
const step=(id,name,cue,neck=[0,0,0],holdSeconds=1,rotations={})=>({
 id,name,cue,rootPosition:[0,.97,0],
 // Align the mannequin's forefoot pads with its heels for this standing routine.
 rotations:{neck,leftFootArch:[8,0,0],rightFootArch:[8,0,0],...rotations},
 floorSupport:'ground',holdSeconds,transitionSeconds:2,
});
const assistedRight={
 rightShoulder:[11.361813265347685,84.40123937820455,147.57048886406412],
 rightElbow:[-79.47208976096334,0,0],
};
const assistedLeft={
 leftShoulder:[11.361813265347685,-84.40123937820455,-147.57048886406412],
 leftElbow:[-79.47208976096334,0,0],
};
const reachRight={rightShoulder:[24.962795138893966,98.23500407759448,157.5097885980624],rightElbow:[-62.96045835701378,0,0]};
const reachLeft={leftShoulder:[24.962795138893966,-98.23500407759448,-157.5097885980624],leftElbow:[-62.96045835701378,0,0]};
export const neckStretching={
 id:'neck-stretching',name:'Neck Stretching',
 source:'https://shapeandstrength.com/neck-pain-exercises/',
 sourceLabel:'Shape and Strength',
 description:'About 2 minutes · One shortened round of rotations, side bends and assisted upper-trapezius stretches. Move within a comfortable range; stop if painful. Rest the hand lightly and do not pull on your head.',
 steps:[
  step('neck-start','Stand Tall','Face forward. Let your shoulders rest.',[0,0,0],3),
  step('neck-turn-right','Turn Right','Turn slowly; keep your chest facing forward.',[0,-35,0],3),
  step('neck-center-1','Return to Center','Bring your gaze forward.'),
  step('neck-turn-left','Turn Left','Turn slowly; keep your shoulders still.',[0,35,0],3),
  step('neck-center-2','Return to Center','Pause with your head upright.'),
  step('neck-tilt-right','Tilt Right','Ease your right ear toward your right shoulder. Do not shrug.',[0,0,20],15),
  step('neck-center-3','Return to Center','Slowly return to an upright position.'),
  step('neck-tilt-left','Tilt Left','Ease your left ear toward your left shoulder. Keep both arms relaxed.',[0,0,-20],15),
  step('neck-center-4','Return to Center','Slowly return upright before adding the hand.'),
  step('neck-lift-right','Lift Right Arm','Raise your right arm out to the side before reaching over.',[0,0,0],1,{rightShoulder:[0,0,-90],rightWrist:[0,-170,0]}),
  step('neck-reach-right','Reach Right Hand Over','Lift your right arm above your head before placing the hand.',[0,0,0],1,{...reachRight,rightWrist:[0,-170,0]}),
  step('neck-assisted-right','Assisted Tilt Right','Reach your right hand over your head to the left ear. Rest it lightly and let the head ease right; do not pull.',[0,0,20],20,{
   ...assistedRight,
   rightWrist:[92.96233572858333,-11.153572812797817,144.952954592002],
  }),
  step('neck-release-right','Release Right Hand','Lift the hand clear of your head before lowering your arm.',[0,0,0],1,{...reachRight,rightWrist:[0,-170,0]}),
  step('neck-lower-right','Lower Right Arm','Move the arm out to the side, then lower it with control.',[0,0,0],1,{rightShoulder:[0,0,-90],rightWrist:[0,-170,0]}),
  step('neck-center-5','Release and Center','Lift the hand away and slowly return your head to center.'),
  step('neck-lift-left','Lift Left Arm','Raise your left arm out to the side before reaching over.',[0,0,0],1,{leftShoulder:[0,0,90],leftWrist:[0,170,0]}),
  step('neck-reach-left','Reach Left Hand Over','Lift your left arm above your head before placing the hand.',[0,0,0],1,{...reachLeft,leftWrist:[0,170,0]}),
  step('neck-assisted-left','Assisted Tilt Left','Reach your left hand over your head to the right ear. Rest it lightly and let the head ease left; do not pull.',[0,0,-20],20,{
   ...assistedLeft,
   leftWrist:[92.96233572858333,11.153572812797817,-144.952954592002],
  }),
  step('neck-release-left','Release Left Hand','Lift the hand clear of your head before lowering your arm.',[0,0,0],1,{...reachLeft,leftWrist:[0,170,0]}),
  step('neck-lower-left','Lower Left Arm','Move the arm out to the side, then lower it with control.',[0,0,0],1,{leftShoulder:[0,0,90],leftWrist:[0,170,0]}),
  step('neck-finish','Finish in Neutral','Face forward and relax.',[0,0,0],3),
 ],
};
for(const step of neckStretching.steps)step.supportRequirements=['soles'];
