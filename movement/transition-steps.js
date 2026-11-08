// Historical rejected route, retained only for support-loss regression fixtures.
// Do NOT use in the editor: floor settling lifts its supports off the ground.
// Stored rotations are radians. Do not claim an actual toe-grip release.
export function addTransitionSteps(steps){
 const result=[];
 for(let i=0;i<steps.length;i++){
  const from=steps[i],to=steps[i+1];
  result.push(structuredClone(from));
  if(from.name!=='Big Toe'||to?.name!=='Cow'||!from.pose||!to.pose)continue;
  const neutral=(source,name)=>{
   const pose=structuredClone(source.pose);
   for(const side of ['left','right'])pose.rotations[side+'Wrist']=[0,0,0];
   return {id:crypto.randomUUID(),name,kind:'transition',cue:'',holdSeconds:0,transitionSeconds:2.2,floorSupport:'ground',supportRequirements:source.supportRequirements|| (source.name==='Big Toe'?['soles']:['palms','knees']),pose};
  };
  result.at(-1).transitionSeconds=1.1;
  result.push(neutral(from,'Release hands'),neutral(to,'Prepare palm landing'));
  result.at(-1).transitionSeconds=1.1;
 }
 return result;
}
