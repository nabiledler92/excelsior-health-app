const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({I18N:{en:{},ar:{}}});
const source = fs.readFileSync(path.join(__dirname, '../js/chat.js'), 'utf8');
vm.runInContext(source + '\nglobalThis.chat = SirrChat;', ctx);
const reply = ctx.chat.reply;
for (const [question,expected] of [
 ['What does a semen test measure?','test'], ['Can I collect at home?','home'],
 ['Who sees my results?','privacy'], ['How do I prepare?','preparation'],
 ['What should I ask a clinician?','doctor'], ['How do hormones fit into fertility?','hormones'],
 ['How can the sperm pathway affect fertility?','pathway'], ['What does motility mean?','measurements'],
 ['ماذا يقيس تحليل السائل المنوي؟','test'], ['من يرى نتائجي؟','privacy'],
 ['ما دور الهرمونات؟','hormones'], ['كيف أستعد للفحص؟','preparation'],
 ['هل يمكن جمع العينة في المنزل؟','home'],
]) assert.equal(reply(question, /[\u0600-\u06ff]/.test(question)?'ar':'en').topic, expected, question);
assert(reply('I have sudden severe testicular pain').urgent);
assert(reply('ألم مفاجئ وشديد في الخصية', 'ar').urgent);
assert(reply('I found a new lump').urgent);
assert.equal(reply('Am I infertile?').topic, 'boundary');
assert.equal(reply('My sperm count is 12 million').topic, 'boundary');
assert.equal(reply('Should I stop my testosterone?').topic, 'boundary');
assert.equal(reply('Is my result normal?').topic, 'boundary');
assert.equal(reply('write a poem about dinosaurs').topic, null);
assert.equal(reply('Tell me more','en','home').topic, 'home');
assert.notEqual(reply('Tell me more','en','home').text,reply('Can I collect at home?').text);
for (const [question,lang] of [['Can I collect at home?','en'],['ما دور الهرمونات؟','ar']]) {
 const answer=reply(question,lang);
 assert(answer.text && answer.sources.length);
 assert(answer.sources.every(s=>!s.url || s.url.startsWith('https://')));
}
assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/.test(source), 'Knowledge demo has no network or persistence code');
console.log('PASS: English/Arabic topic matching, contextual follow-ups, source links, urgent symptoms, personal-result/medication boundaries, unsupported questions and no network/storage.');
