import {inspectSupports} from './pose-validation.js';
import {supportProfile} from './support-profiles.js';
const requirements=step=>{
 // Migration for the previously emitted neutral-wrist route cards.
 if(!step.supportRequirements&&step.kind==='transition'){
  if(step.name==='Release hands')return ['soles'];
  if(step.name==='Prepare palm landing')return ['palms','knees'];
 }
 try{return supportProfile(step).requirements;}catch{return [];}
};
const footKinds=values=>new Set(values.flatMap(value=>[
 value.includes('foot-top')?'foot-tops':null,
 value.includes('forefoot')||value.includes('forefeet')?'forefeet':null,
 value.includes('toe')?'toes':null,
 value.includes('sole')?'soles':null,
].filter(Boolean)));
export function changesFootSupport(from,to){
 const a=footKinds(requirements(from)),b=footKinds(requirements(to));
 return a.size>0&&b.size>0&&([...a].some(value=>!b.has(value))||[...b].some(value=>!a.has(value)));
}
// Conservative contact continuity, not balance or force simulation. A shared
// support must persist; when supports differ, one complete endpoint support set
// must remain until the other is established. Explicit schedules take precedence.
export function inspectTransitionSupports(rig,from,to,mix){
 const a=requirements(from),b=requirements(to);
 if(!a.length||!b.length)return {pass:true,evaluated:false,reason:'Missing support intent',requirements:[],surfaces:{}};
 const shared=a.filter(x=>b.includes(x));
 const left=inspectSupports(rig,{supportRequirements:a}),right=inspectSupports(rig,{supportRequirements:b});
 const common=inspectSupports(rig,{supportRequirements:shared});
 const pass=mix<=0?!left.issues.length:mix>=1?!right.issues.length:!common.issues.length&&(!left.issues.length||!right.issues.length);
 return {pass,evaluated:true,reason:pass?'':'Required support lost',requirements:shared,startIssues:left.issues,endIssues:right.issues,surfaces:left.surfaces};
}
