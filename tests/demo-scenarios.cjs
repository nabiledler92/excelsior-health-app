// Run with: node tests/demo-scenarios.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const memory = {};
const elements = Object.fromEntries(['view', 'notice', 'langToggle'].map(id => [id, {
  innerHTML: '', hidden: true, textContent: '', addEventListener() {}, querySelector() { return null; }
}]));
const context = vm.createContext({
  document: { getElementById: id => elements[id] || null, querySelectorAll: () => [], documentElement: {} },
  window: { addEventListener() {} }, setInterval() {},
  localStorage: { getItem: key => memory[key] || null, setItem: (key, value) => { memory[key] = value; } },
  Date, Intl
});
for (const file of ['js/i18n.js', 'js/state.js', 'js/videos.js', 'js/journey.js', 'js/learn-visual.js', 'js/chat.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
let source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
source = source.replace('  Store.init();', `
  globalThis.testApi = { Store, I18N, homeTracker, reportScreen, prepareScreen, slaBox };
  Store.init();`);
vm.runInContext(source, context, { filename: 'js/app.js' });
const { Store, I18N, homeTracker, reportScreen, prepareScreen, slaBox } = context.testApi;
const fixtures = JSON.stringify(Store.data.samples);
Store.signup({ name: 'Synthetic patient', email: 'scenario-test@example.test', phone: '000', password: 'Demo1234' });
Store.login('scenario-test@example.test', 'Demo1234');
const ordinary = Store.createSample({ abstinence: '3', consent: true });
const ordinaryBefore = JSON.stringify(ordinary);
assert.equal(Store.loadDemoScenario('invalid'), null);
const countBefore = Store.data.samples.length;
for (const kind of ['prepare', 'transit', 'report', 'late', 'seal']) {
  const sample = Store.loadDemoScenario(kind);
  const id = sample.id;
  const count = Store.data.samples.length;
  assert.equal(Store.currentUser().id, 'USR-DEMO01');
  assert.equal(sample.demoScenario, kind);
  assert.equal(Store.loadDemoScenario(kind).id, id);
  assert.equal(Store.data.samples.length, count, 'Reopening does not add duplicate previews');
}
assert.equal(Store.data.samples.length, countBefore + 5);
assert.equal(JSON.stringify(Store.get(ordinary.id)), ordinaryBefore, 'Ordinary booking is untouched');
assert.equal(JSON.stringify(Store.data.samples.filter(s => ['SEM-DM0247', 'SEM-DM0173', 'SEM-DM0098'].includes(s.id))), fixtures, 'Seed fixtures are untouched');
const transit = Store.data.samples.find(s => s.demoScenario === 'transit');
assert(Store.sla(transit).remaining > 48 * 60 * 1000, 'Transit shortcut starts with a fresh timer');
assert.match(slaBox(transit), /data-countdown/);
const late = Store.data.samples.find(s => s.demoScenario === 'late');
assert(Date.parse(late.labReceivedAt) - Date.parse(late.collectedAt) > 3600000);
const seal = Store.data.samples.find(s => s.demoScenario === 'seal');
assert.equal(seal.sealOk, false);
assert(Date.parse(seal.labReceivedAt) - Date.parse(seal.collectedAt) < 3600000);
for (const sample of [late, seal]) {
  assert.match(homeTracker(sample), /stopped/);
  assert.match(homeTracker(sample), /Not reached/);
  assert(!homeTracker(sample).includes("Coming next"));
  assert.equal(slaBox(sample), '');
}
const prepared = Store.data.samples.find(s => s.demoScenario === 'prepare');
assert.equal(prepared.collectedAt, null);
assert.equal(slaBox(prepared), '');
Store.update(prepared.id, { collectedAt: new Date().toISOString(), sealOk: true });
Store.dispatch(prepared.id);
for (const status of ['picked_up', 'in_transit', 'lab_received']) Store.transition(prepared.id, status);
assert.equal(slaBox(prepared), '', 'Patient countdown stops at lab receipt');
const report = Store.data.samples.find(s => s.demoScenario === 'report');
for (const language of ['en', 'ar']) {
  I18N.set(language);
  assert.equal((homeTracker(report).match(/class="done /g) || []).length, 5);
  assert.equal((reportScreen(report).match(/class="measurement-help"/g) || []).length, 7);
  assert.equal((prepareScreen(prepared).match(/class="prep-illustration"/g) || []).length, 3);
  for (const key of ['Volume', 'Concentration', 'Count', 'TotalMotility', 'ProgressiveMotility', 'Morphology', 'Velocity']) {
    assert.notEqual(I18N.t('explain' + key), 'explain' + key);
  }
}
assert.deepEqual(Object.keys(I18N.en).filter(key => !I18N.ar[key]), []);
assert.equal(Store.read().samples.filter(s => s.demoScenario).length, 5, 'Previews remain readable after storage reload');
console.log('PASS: scenario isolation, repeatability, timing, handoffs, recovery states, bilingual tracker, illustrations and measurement explanations.');
