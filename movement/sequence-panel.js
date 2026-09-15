export function enableSequencePanel(){
 const panel=document.querySelector('main>aside'),main=panel.parentElement;
 panel.id='sequence-panel';
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='sequence-panel-toggle';
 toggle.setAttribute('aria-controls',panel.id);
 const icon=document.createElement('span');
 icon.className='panel-menu-icon';icon.setAttribute('aria-hidden','true');
 toggle.append(icon);
 document.querySelector('header').append(toggle);
 function setExpanded(expanded){
  if(!expanded&&panel.contains(document.activeElement))toggle.focus({preventScroll:true});
  panel.hidden=!expanded;main.classList.toggle('panel-collapsed',!expanded);
  const label=expanded?'Hide sequence panel':'Show sequence panel';
  toggle.setAttribute('aria-label',label);toggle.title=label;
  toggle.setAttribute('aria-expanded',String(expanded));
 }
 toggle.addEventListener('click',()=>setExpanded(panel.hidden));
 setExpanded(true);
}
