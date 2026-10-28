const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const data = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/data.js'), 'utf8') + ';({characters, questions, calculateResult, scoreScale, scoreOffset})');
const ids = Object.keys(data.characters);
assert.equal(data.questions.length, 10);
assert.equal(ids.length, 7);
for (const q of data.questions) {
  assert.equal(q.answers.length, 3);
  assert.equal(q.weights.length, 3);
  for (const [primary, secondary] of q.weights) {
    assert(ids.includes(primary) && ids.includes(secondary));
    assert.notEqual(primary, secondary);
  }
}
assert.equal(new Set(data.questions.map(q => q.scene)).size, 10, 'Each question needs a distinct scene');
for (const q of data.questions) {
  const assets = ['practice','teamwork'].includes(q.scene) ? [] : q.scene === 'cart' ? ['worried-b', 'gray-friend'] : q.scene === 'map' ? ['map-crossroads'] : q.scene === 'greeting' ? ['greeting-anime'] : q.scene === 'comfort' ? ['comfort-exam'] : q.scene === 'work' ? ['work-korean'] : q.scene === 'snack' ? ['snack-rakko'] : q.scene === 'dinner' ? ['dinner-stalls'] : q.scene === 'night' ? ['night-cozy'] : [q.scene];
  for (const asset of assets) assert(fs.existsSync(path.join(__dirname, '../dist/assets/poses', asset + '.webp')), 'Missing scene asset: ' + asset);
}
const counts = Object.fromEntries(ids.map(id => [id, 0]));
for (let n = 0; n < 3 ** data.questions.length; n++) {
  let value = n;
  const answers = Array.from({length: data.questions.length}, () => { const a = value % 3; value = Math.floor(value / 3); return a; });
  const original = [...answers];
  const result = data.calculateResult(answers);
  assert(ids.includes(result));
  assert.equal(data.calculateResult(answers), result);
  assert.deepEqual(answers, original);
  const score = Object.fromEntries(ids.map(id => [id, 0]));
  answers.forEach((a, i) => {const [p, s] = data.questions[i].weights[a]; score[p] += 2; score[s]++;});
  for (const id of ids) score[id] = score[id] * data.scoreScale[id] + data.scoreOffset[id];
  assert.equal(score[result], Math.max(...Object.values(score)));
  counts[result]++;
}
assert(Object.values(counts).every(n => n > 0));
assert.deepEqual(counts, {c:8502,h:8417,u:8633,m:8405,r:8650,s:8192,k:8250});

for (const count of Object.values(counts)) assert(Math.abs(count / (3 ** data.questions.length) - 1 / 7) < 0.01, "Each result should stay within one percentage point of equal share");

for (const id of ids) assert(fs.existsSync(path.join(__dirname, '../dist/assets', id + '.png')), 'Missing character: ' + id);

for (const invalid of [[], Array(8).fill(0), Array(11).fill(0), Array(data.questions.length).fill(3), Array(data.questions.length).fill(-1), Array(data.questions.length).fill(0.5)]) assert.throws(() => data.calculateResult(invalid));
console.log('PASS: 59,049 combinations, deterministic results, scoring and expected distribution', counts);

for (const questionIndex of [3,7]) {
 let changesResult=false;
 for (let n=0;n<3 ** data.questions.length&&!changesResult;n++) {
  let value=n;const answers=Array.from({length:data.questions.length},()=>{const a=value%3;value=Math.floor(value/3);return a;});
  const results=[0,1,2].map(a=>{const copy=[...answers];copy[questionIndex]=a;return data.calculateResult(copy);});
  changesResult=new Set(results).size>1;
 }
 assert(changesResult, 'New question must influence the outcome: '+questionIndex);
 assert.equal(data.questions[questionIndex].insights.length,3);
}
