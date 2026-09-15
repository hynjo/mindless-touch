import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeContactSchedule, sampleContactSchedule, validateContactSchedule, validateContactScheduleEndpoints} from '../contact-schedule.js';

const schedule = (...anchors) => ({version: 1, anchors});
const movingFoot = {anchor: 'left-sole', start: true, end: true, release: [.1, .25], landing: [.75, .9]};
const standingFoot = {anchor: 'right-sole', start: true, end: true};

test('missing metadata is opt-in and has no sampled requirements', () => {
  assert.equal(normalizeContactSchedule(undefined), undefined);
  assert.equal(sampleContactSchedule(undefined, .5), undefined);
});

test('moving foot releases while the other foot retains contact', () => {
  const plan = schedule(movingFoot, standingFoot);
  const sample = time => sampleContactSchedule(plan, time);
  assert.deepEqual(sample(0).requiredAnchors, ['left-sole', 'right-sole']);
  assert.deepEqual(sample(.1).requiredAnchors, ['left-sole', 'right-sole']);
  assert.equal(sample(.175).anchors[0].phase, 'releasing');
  assert.ok(Math.abs(sample(.175).anchors[0].weight - .5) < 1e-12);
  for (const time of [.25, .5, .75]) {
    assert.deepEqual(sample(time).requiredAnchors, ['right-sole']);
    assert.equal(sample(time).anchors[0].weight, 0);
    assert.equal(sample(time).anchors[0].phase, 'free');
  }
  assert.equal(sample(.825).anchors[0].phase, 'landing');
  assert.deepEqual(sample(.9).requiredAnchors, ['left-sole', 'right-sole']);
  assert.deepEqual(sample(1).requiredAnchors, ['left-sole', 'right-sole']);
});

test('endpoint holds are exact, including release at zero and landing at one', () => {
  const plan = schedule(
    {anchor: 'left-palm', start: true, end: false, release: [0, .2]},
    {anchor: 'right-knee', start: false, end: true, landing: [.8, 1]},
    {anchor: 'head', start: false, end: false},
  );
  for (const time of [-1, 0]) assert.deepEqual(sampleContactSchedule(plan, time).requiredAnchors, ['left-palm']);
  for (const time of [1, 2]) assert.deepEqual(sampleContactSchedule(plan, time).requiredAnchors, ['right-knee']);
  const airborne = sampleContactSchedule(plan, .5);
  assert.equal(airborne.unsupported, true);
  assert.deepEqual(airborne.requiredAnchors, []);
  assert.ok(airborne.anchors.every(anchor => anchor.weight === 0));
  assert.equal(sampleContactSchedule(plan, .1).unsupported, true, 'partial release must not masquerade as full support');
});

test('touching release and landing windows still report their zero-contact boundary', () => {
  const plan = schedule({...movingFoot, release: [0, .5], landing: [.5, 1]});
  assert.equal(sampleContactSchedule(plan, .5).unsupported, true);
});

test('normalization detaches input and is stable across JSON roundtrip', () => {
  const input = schedule({...movingFoot, release: [.1, .25]});
  const normalized = validateContactSchedule(input);
  assert.deepEqual(normalizeContactSchedule(JSON.parse(JSON.stringify(normalized))), normalized);
  normalized.anchors[0].release[0] = 0;
  assert.equal(input.anchors[0].release[0], .1);
});

test('endpoint declarations must match both holds, without guessing any-side supports', () => {
  const plan = schedule(movingFoot, standingFoot);
  const endpoints = {startAnchors: ['right-sole', 'left-sole'], endAnchors: ['left-sole', 'right-sole']};
  assert.deepEqual(validateContactScheduleEndpoints(plan, endpoints), plan);
  assert.equal(validateContactScheduleEndpoints(undefined), undefined);
  for (const bad of [
    undefined,
    {...endpoints, startAnchors: ['left-sole']},
    {...endpoints, endAnchors: ['left-sole', 'right-sole', 'head']},
    {...endpoints, startAnchors: ['any-sole']},
    {...endpoints, endAnchors: ['left-sole', 'left-sole']},
  ]) assert.throws(() => validateContactScheduleEndpoints(plan, bad), /Invalid contact schedule/);
});

test('malformed anchors, ambiguous timing, and unknown data are rejected', () => {
  for (const input of [
    null, {}, {version: 2, anchors: []}, {...schedule(), inferred: true},
    schedule({...standingFoot, anchor: 'any-sole'}), schedule(standingFoot, standingFoot),
    schedule({...standingFoot, start: 1}), schedule({...standingFoot, guessed: true}),
    schedule({...movingFoot, release: [0, 0]}), schedule({...movingFoot, release: [-.1, .2]}),
    schedule({...movingFoot, landing: [.9, 1.1]}), schedule({...movingFoot, release: [NaN, .2]}),
    schedule({...movingFoot, landing: [.2, .8]}), schedule({...movingFoot, landing: undefined}),
    schedule({...standingFoot, end: false}), schedule({...standingFoot, start: false}),
    schedule({...standingFoot, start: false, release: [.1, .2]}),
    schedule({...standingFoot, end: false, landing: [.8, 1]}),
  ]) assert.throws(() => normalizeContactSchedule(input), /Invalid contact schedule/);
  for (const time of [NaN, Infinity, undefined]) assert.throws(() => sampleContactSchedule(schedule(), time), /progress/);
});
