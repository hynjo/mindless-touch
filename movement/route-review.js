import {suggestRoutePoses,visibleRouteSuggestions} from './route-suggestions.js';
// A persistent record of the original failure, separate from playback messages.
export function enableRouteReview({container,dimensions,getSequence,applyCandidate,catalog,preview}){
 const panel=document.createElement('section');panel.hidden=true;panel.className='route-review';
 panel.innerHTML='<strong></strong><p role="status"></p><ol></ol><button type="button" data-action="retry">Try a supported route</button><button type="button" data-action="cancel">Cancel search</button><button type="button" data-action="apply" hidden>Apply candidate</button><button type="button" data-action="save">Save failure report</button>';
 container.append(panel);
 const suggestions=document.createElement('div');suggestions.className='route-suggestions';suggestions.setAttribute('role','group');suggestions.setAttribute('aria-label','Suggested intermediate poses');panel.querySelector('ol').before(suggestions);
 const label=document.createElement('label');label.textContent='Search all poses';const filter=document.createElement('input');filter.type='search';filter.placeholder='Pose name';label.append(filter);suggestions.before(label);
 const empty=document.createElement('span');empty.setAttribute('role','status');suggestions.after(empty);
 filter.oninput=()=>renderSuggestions();
 const status=panel.querySelector('p'),list=panel.querySelector('ol'),button=a=>panel.querySelector(`[data-action="${a}"]`);
 let worker=null,record=null,signature='',token=0;
 let selected=new Set(),ranked=[],previewGeneration=0;
 const statuses=new Map(),previews=new Map();
 async function renderSuggestions(){
  const generation=++previewGeneration;
  const visible=visibleRouteSuggestions(ranked,selected,filter.value);
  empty.textContent=visible.length?'':'No matching poses';
  suggestions.replaceChildren(...visible.map(({pose})=>{
   const card=document.createElement('button');card.type='button';card.setAttribute('aria-pressed',String(selected.has(pose.id)));card.setAttribute('aria-label',`Try via ${pose.name}`);
   const img=document.createElement('img');img.alt='';img.width=144;img.height=120;img.dataset.poseId=pose.id;
   const name=document.createElement('span');name.textContent=pose.name;
   const state=document.createElement('small');state.textContent=statuses.get(pose.id)||'Not tested';card.append(img,name,state);
   card.onclick=()=>{
    if(!selected.has(pose.id)&&selected.size>=6){status.textContent='Select up to 6 poses.';return;}
    cancel();button('apply').hidden=true;list.replaceChildren();record.result={status:'selection-changed'};
    if(selected.has(pose.id))selected.delete(pose.id);else selected.add(pose.id);
    button('retry').disabled=selected.size===0;status.textContent=`${selected.size} selected`;renderSuggestions();
   };return card;
  }));
  for(const {pose} of visible){
   await new Promise(requestAnimationFrame);if(generation!==previewGeneration)return;
   try{const img=[...suggestions.querySelectorAll('img')].find(i=>i.dataset.poseId===pose.id);if(!previews.has(pose.id))previews.set(pose.id,preview(pose));if(img)img.src=previews.get(pose.id);}catch{/* Name and selection remain usable if WebGL preview fails. */}
  }
 }
 function cancel(){token++;worker?.terminate();worker=null;button('cancel').hidden=true;}
 function search(){
  cancel();button('apply').hidden=true;list.replaceChildren();
  if(!selected.size){status.textContent='Select at least one pose.';return;}
  if(JSON.stringify(getSequence())!==signature){status.textContent='Sequence changed. Replay to record a new failure.';return;}
  const request=token;status.textContent='Searching supported routes…';button('cancel').hidden=false;
  worker=new Worker(new URL('./supported-route.worker.js',import.meta.url),{type:'module'});
  record.result={status:'searching'};
  worker.onmessage=({data})=>{
   if(request!==token)return;cancel();record.result=data;
   for(const attempt of data.attempts||[])statuses.set(attempt.poseId,attempt.failure?`Blocked: ${attempt.failure.reason}`:'Passed both transitions');renderSuggestions();
   if(JSON.stringify(getSequence())!==signature){status.textContent='Sequence changed. Result is not applicable.';return;}
   if(data.status==='candidate'){
    status.textContent=data.motion?'Contact-transfer route passed sampled checks.':'Candidate passed sampled checks. Review the added poses before applying.';
    list.replaceChildren(...[record.from,...(data.motion?.phases||data.steps),record.to].map(s=>{const li=document.createElement('li');li.textContent=s.name;return li;}));button('apply').hidden=false;
   }else status.textContent=data.status==='error'?`Search failed: ${data.message}`:data.partial?.success?`Contact transfer blocked at ${data.partial.stage}. Original sequence kept.`:'No complete route found within this search. Original sequence kept.';
  };
  worker.onerror=()=>{if(request!==token)return;cancel();record.result={status:'error',message:'Worker failed'};status.textContent='Search failed. Retry or save the report.';};
  record.candidateIds=ranked.filter(r=>selected.has(r.pose.id)).map(r=>r.pose.id);
  worker.postMessage({dimensions,from:record.from,to:record.to,candidateIds:record.candidateIds});
 }
 button('retry').onclick=search;
 button('retry').textContent='Try selected routes';
 button('cancel').onclick=()=>{cancel();record.result={status:'cancelled'};status.textContent='Search cancelled. Original sequence kept.';};
 button('apply').onclick=()=>{
  if(record?.result?.status!=='candidate'||JSON.stringify(getSequence())!==signature){status.textContent='Sequence changed. Replay to record a new failure.';button('apply').hidden=true;return;}
  if(applyCandidate(record.index,record.result.steps,record.result.motion,record.result.transitionSeconds)){button('apply').hidden=true;status.textContent='Candidate applied. Original failure retained below; Undo restores the original sequence.';}
 };
 button('save').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='transition-failure.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return {record(index,reason,progress){
  const sequence=getSequence(),from=sequence.steps[index],to=sequence.steps[index+1];if(!from||!to)return;
  const next=JSON.stringify(sequence);if(next===signature&&record?.index===index)return;
  cancel();signature=next;record={version:1,plannerVersion:2,budget:{intermediateCandidates:6,samplesPerEdge:265,contactTransferPhases:13,samplesPerPhase:241,subdivisions:4},index,reason,progress,from:structuredClone(from),to:structuredClone(to),dimensions,experiment:sequence.experiment};
  ranked=suggestRoutePoses(catalog,from,to,catalog.length);filter.value='';selected=new Set(ranked.slice(0,3).map(r=>r.pose.id));statuses.clear();button('retry').disabled=!selected.size;
  panel.hidden=false;panel.querySelector('strong').textContent=`Original failure: ${from.name} → ${to.name} · ${reason}`;renderSuggestions();search();
 }};
}
