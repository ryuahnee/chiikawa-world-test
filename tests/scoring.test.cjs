const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const data = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/data.js'), 'utf8') + ';({characters, questions, calculateResult})');
const ids = Object.keys(data.characters);
assert.equal(data.questions.length, 8);
assert.equal(ids.length, 6);
for (const q of data.questions) {
  assert.equal(q.answers.length, 3);
  assert.equal(q.weights.length, 3);
  for (const [primary, secondary] of q.weights) {
    assert(ids.includes(primary) && ids.includes(secondary));
    assert.notEqual(primary, secondary);
  }
}
assert.equal(new Set(data.questions.map(q => q.scene)).size, 8, 'Each question needs a distinct scene');
for (const q of data.questions) {
  const assets = q.scene === 'cart' ? ['worried-b', 'gray-friend'] : q.scene === 'map' ? ['map-crossroads'] : q.scene === 'greeting' ? ['greeting-anime'] : q.scene === 'comfort' ? ['comfort-exam'] : q.scene === 'work' ? ['work-korean'] : q.scene === 'snack' ? ['snack-rakko'] : q.scene === 'night' ? ['night-cozy'] : [q.scene];
  for (const asset of assets) assert(fs.existsSync(path.join(__dirname, '../dist/assets/poses', asset + '.webp')), 'Missing scene asset: ' + asset);
}
const counts = Object.fromEntries(ids.map(id => [id, 0]));
for (let n = 0; n < 3 ** 8; n++) {
  let value = n;
  const answers = Array.from({length: 8}, () => { const a = value % 3; value = Math.floor(value / 3); return a; });
  const original = [...answers];
  const result = data.calculateResult(answers);
  assert(ids.includes(result));
  assert.equal(data.calculateResult(answers), result);
  assert.deepEqual(answers, original);
  const score = Object.fromEntries(ids.map(id => [id, 0]));
  answers.forEach((a, i) => {const [p, s] = data.questions[i].weights[a]; score[p] += 2; score[s]++;});
  assert.equal(score[result], Math.max(...Object.values(score)));
  counts[result]++;
}
assert(Object.values(counts).every(n => n > 0));
assert.deepEqual(counts, {c:1627,h:1272,u:748,m:1069,r:1140,k:705});
for (const invalid of [[], Array(8).fill(3), Array(8).fill(-1), Array(8).fill(0.5)]) assert.throws(() => data.calculateResult(invalid));
console.log('PASS: 6,561 combinations, deterministic results, scoring and expected distribution', counts);
