// A short, independently authored adaptation of the reference's rotation and
// side-bend exercises, not its complete daily prescription. Angles are degrees.
const step=(id,name,cue,neck=[0,0,0],holdSeconds=1)=>({
 id,name,cue,rootPosition:[0,.97,0],
 // Align the mannequin's forefoot pads with its heels for this standing routine.
 rotations:{neck,leftFootArch:[8,0,0],rightFootArch:[8,0,0]},
 floorSupport:'ground',holdSeconds,transitionSeconds:2,
});
export const neckStretching={
 id:'neck-stretching',name:'Neck Stretching',
 source:'https://shapeandstrength.com/neck-pain-exercises/',
 description:'About 1 minute · One shortened round of rotations and side bends. Move within a comfortable range; stop if painful. Keep shoulders relaxed and avoid pulling on your head.',
 steps:[
  step('neck-start','Stand Tall','Face forward. Let your shoulders rest.',[0,0,0],3),
  step('neck-turn-right','Turn Right','Turn slowly; keep your chest facing forward.',[0,-35,0],3),
  step('neck-center-1','Return to Center','Bring your gaze forward.'),
  step('neck-turn-left','Turn Left','Turn slowly; keep your shoulders still.',[0,35,0],3),
  step('neck-center-2','Return to Center','Pause with your head upright.'),
  step('neck-tilt-right','Tilt Right','Ease your right ear toward your right shoulder. Do not shrug.',[0,0,20],15),
  step('neck-center-3','Return to Center','Slowly return to an upright position.'),
  step('neck-tilt-left','Tilt Left','Ease your left ear toward your left shoulder. Keep both arms relaxed.',[0,0,-20],15),
  step('neck-finish','Finish in Neutral','Face forward and relax.',[0,0,0],3),
 ],
};
