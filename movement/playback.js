// A deterministic timeline, independent of rendering and browser frame rate.
export function createTimeline(steps) {
  let duration = 0;
  const segments = steps.map((step,index) => {
    const start = duration;
    const hold = step.holdSeconds ?? 1.4;
    const transition = index < steps.length-1 ? (step.transitionSeconds ?? 2.2) : 0;
    duration += hold+transition;
    return {start,hold,transition,end:duration};
  });
  return {
    duration,
    startOf(index) { return segments[index]?.start ?? 0; },
    sample(seconds) {
      const time = Math.max(0,Math.min(seconds,duration));
      const index = segments.findIndex(segment => time < segment.end);
      if (index === -1) return {index:steps.length-1,next:steps.length-1,mix:0,progress:0,done:true};
      const segment = segments[index];
      const progress = segment.transition ? Math.max(0,(time-segment.start-segment.hold)/segment.transition) : 0;
      return {index,next:Math.min(index+1,steps.length-1),mix:progress*progress*(3-2*progress),progress,done:false};
    },
  };
}
