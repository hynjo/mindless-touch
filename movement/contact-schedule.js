// Optional, authored contact intent for one outgoing transition. Times use the
// linear transition clock, not the eased pose blend. This does not solve IK.
const bilateral = 'sole palm forearm elbow knee shin heel forefoot toe foot-top fingertip foot-edge hand back-leg'.split(' ');
export const CONTACT_ANCHORS = Object.freeze([
  ...bilateral.flatMap(name => ['left', 'right'].map(side => `${side}-${name}`)),
  'seat', 'back', 'front-core', 'front-chest', 'head', 'back-head',
]);
const known = new Set(CONTACT_ANCHORS);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(`Invalid contact schedule: ${message}`); };
function keys(value, allowed) {
  if (Object.keys(value).some(key => !allowed.includes(key))) fail('unknown field.');
}
function interval(value, label) {
  if (!Array.isArray(value) || value.length !== 2 || value.some(time => !Number.isFinite(time) || time < 0 || time > 1) || value[0] >= value[1]) {
    fail(`${label} must be an increasing interval within [0, 1].`);
  }
  return [...value];
}

export function normalizeContactSchedule(input) {
  if (input === undefined) return undefined;
  if (!plain(input) || input.version !== 1 || !Array.isArray(input.anchors) || input.anchors.length > CONTACT_ANCHORS.length) fail('expected version 1 and an anchors array.');
  keys(input, ['version', 'anchors']);
  const seen = new Set();
  const anchors = input.anchors.map(entry => {
    if (!plain(entry)) fail('anchor entry must be an object.');
    keys(entry, ['anchor', 'start', 'end', 'release', 'landing']);
    if (!known.has(entry.anchor) || seen.has(entry.anchor)) fail('unknown or duplicate anchor.');
    seen.add(entry.anchor);
    if (typeof entry.start !== 'boolean' || typeof entry.end !== 'boolean') fail('start and end must be explicit booleans.');
    const release = entry.release === undefined ? undefined : interval(entry.release, 'release');
    const landing = entry.landing === undefined ? undefined : interval(entry.landing, 'landing');
    if (release && !entry.start) fail('release requires start contact.');
    if (landing && !entry.end) fail('landing requires end contact.');
    if (entry.start && !entry.end && !release) fail('leaving contact requires release timing.');
    if (!entry.start && entry.end && !landing) fail('entering contact requires landing timing.');
    if (entry.start && entry.end && Boolean(release) !== Boolean(landing)) fail('a moved contact requires both release and landing.');
    if (release && landing && release[1] > landing[0]) fail('release and landing must not overlap.');
    return {anchor: entry.anchor, start: entry.start, end: entry.end, ...(release ? {release} : {}), ...(landing ? {landing} : {})};
  });
  return {version: 1, anchors};
}

// Validation returns a detached normalized value, suitable for persistence.
export const validateContactSchedule = normalizeContactSchedule;

// Only compare explicit endpoint intent. Actual hold geometry must be measured
// independently; alternative requirements (any-/OR) need an authored side first.
export function validateContactScheduleEndpoints(input, endpoints) {
  const schedule = normalizeContactSchedule(input);
  if (schedule === undefined) return undefined;
  if (!plain(endpoints)) fail('explicit endpoint anchor lists are required.');
  keys(endpoints, ['startAnchors', 'endAnchors']);
  for (const endpoint of ['start', 'end']) {
    const expected = endpoints[`${endpoint}Anchors`];
    if (!Array.isArray(expected) || expected.some(anchor => !known.has(anchor)) || new Set(expected).size !== expected.length) fail(`${endpoint} anchors must be a unique list of known surfaces.`);
    const actual = schedule.anchors.filter(entry => entry[endpoint]).map(entry => entry.anchor);
    if (actual.length !== expected.length || actual.some(anchor => !expected.includes(anchor))) fail(`${endpoint} contacts do not match the hold's declared anchors.`);
  }
  return schedule;
}

export function sampleContactSchedule(input, progress) {
  const schedule = normalizeContactSchedule(input);
  if (schedule === undefined) return undefined;
  if (!Number.isFinite(progress)) fail('progress must be finite.');
  const time = Math.max(0, Math.min(1, progress));
  const anchors = schedule.anchors.map(entry => {
    let weight = entry.start ? 1 : 0;
    let phase = entry.start ? 'attached' : 'free';
    if (entry.release && time > entry.release[0]) {
      weight = Math.max(0, 1 - (time - entry.release[0]) / (entry.release[1] - entry.release[0]));
      phase = weight > 0 ? 'releasing' : 'free';
    }
    if (entry.landing && time > entry.landing[0]) {
      weight = Math.min(1, (time - entry.landing[0]) / (entry.landing[1] - entry.landing[0]));
      phase = weight < 1 ? 'landing' : 'attached';
    }
    // Hold endpoints preserve exactly the authored endpoint requirements.
    if (time === 0 || time === 1) {
      weight = (time === 0 ? entry.start : entry.end) ? 1 : 0;
      phase = weight === 1 ? 'attached' : 'free';
    }
    return {anchor: entry.anchor, phase, weight, required: weight === 1};
  });
  const requiredAnchors = anchors.filter(entry => entry.required).map(entry => entry.anchor);
  // This flags absence of scheduled full contact, NOT measured loss of balance.
  return {anchors, requiredAnchors, unsupported: requiredAnchors.length === 0};
}
