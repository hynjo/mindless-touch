import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTimeline} from '../playback.js';
import {sunSalutation} from '../examples.js';
test('holds, interpolates, crosses boundaries and finishes on the last pose',() => {
  const timeline = createTimeline([{holdSeconds:1,transitionSeconds:2},{holdSeconds:1}]);
  assert.equal(timeline.duration,4);
  assert.equal(timeline.sample(.5).mix,0);
  assert.equal(timeline.sample(2).mix,.5);
  assert.equal(timeline.sample(3).index,1);
  assert.equal(timeline.sample(4).done,true);
  assert.equal(timeline.sample(400).index,1);
  assert.equal(timeline.sample(-1).mix,0);
});
test('all example cards can be sought exactly, including the support transitions',() => {
  const timeline = createTimeline(sunSalutation.steps);
  assert.equal(sunSalutation.steps.filter(step=>step.kind === 'transition').length,4);
  sunSalutation.steps.forEach((step,i) => {
    const frame = timeline.sample(timeline.startOf(i));
    assert.equal(frame.index,i);assert.equal(frame.mix,0);
    assert(step.holdSeconds>0);assert(step.transitionSeconds>0);
  });
  assert.equal(timeline.sample(timeline.duration).index,sunSalutation.steps.length-1);
});
test('timeline sampling has no state: pausing and resuming preserves the pose',() => {
  const timeline = createTimeline(sunSalutation.steps);
  const paused = timeline.sample(4.25);
  timeline.sample(20);
  assert.deepEqual(timeline.sample(4.25),paused);
});
