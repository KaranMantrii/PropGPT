import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechSession } from '../src/services/speechRecognition.js';
import { normalizeApiResponse, predictFlat, sendChatMessage } from '../src/services/plumberApi.js';
import { getSessions, createNewSession, deleteSession, clearAllSessions, updateSessionMessages } from '../src/services/chatStorage.js';

const data = new Map();
globalThis.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };

test('storage initializes, deletes final session, and clears without recursion or resurrecting history', () => {
  const initial = getSessions()[0];
  const next = createNewSession();
  assert.equal(getSessions().length, 2);
  deleteSession(next.id);
  const fresh = deleteSession(initial.id);
  assert.equal(getSessions().length, 1);
  assert.equal(getSessions()[0].id, fresh[0].id);
  assert.notEqual(fresh[0].id, initial.id);
  updateSessionMessages(initial.id, [{role:'assistant',content:'late response'}]);
  assert.equal(getSessions().length, 1);
  assert.notEqual(getSessions()[0].id, initial.id);
  clearAllSessions();
  assert.equal(getSessions().length, 1);
});

test('legacy API scalars are unboxed while suggestions and evidence rows remain arrays', () => {
  const response = normalizeApiResponse({reply:['hello'],intent:['rent'],prediction:['₹20,000'],property:{area:[1200]},suggestions:['skip'],comparables:[{locality:['Miyapur']}]});
  assert.equal(response.reply, 'hello');
  assert.equal(response.property.area, 1200);
  assert.deepEqual(response.suggestions, ['skip']);
  assert.deepEqual(response.comparables, [{locality:'Miyapur'}]);
});

test('HTTP errors reject instead of returning a fabricated manual estimate; zero balconies preserved', async () => {
  let body;
  globalThis.fetch = async (url, options) => { body = JSON.parse(options.body); return {ok:false,json:async()=>({error:'Service unavailable'})}; };
  await assert.rejects(predictFlat({area:1200,bhk:2,locality:'Kukatpally',balconies:0}), /Service unavailable/);
  assert.equal(body.query_Balcony, 0);
  await assert.rejects(sendChatMessage('test', 'hello'), /Service unavailable/);
});

function harness() {
  let recognition;
  class SpeechMock {
    constructor() { recognition = this; }
    start() { this.onstart?.(); }
    stop() { this.onend?.(); }
    abort() { this.onend?.(); }
  }
  const state = { text:'typed',interim:'',listening:false,error:null };
  const controller = createSpeechSession({SpeechRecognition:SpeechMock,initialText:'typed',onText:x=>state.text=x,onInterim:x=>state.interim=x,onListening:x=>state.listening=x,onError:x=>state.error=x});
  return {state,controller,get recognition(){return recognition;}};
}
function result(text, isFinal) { const value=[{transcript:text}]; value.isFinal=isFinal; return value; }
test('speech preserves typed text, previews interim results and deduplicates repeated final results', () => {
  const h=harness(); h.controller.start();
  assert.equal(h.recognition.lang,'en-IN'); assert.equal(h.recognition.maxAlternatives,3);
  assert.equal(h.state.listening,true);
  h.recognition.onresult({results:[result('2 BHK',false)]});
  assert.equal(h.state.interim,'2 BHK'); assert.equal(h.state.text,'typed');
  h.recognition.onresult({results:[result('2 BHK',true),result('in Miyapur',false)]});
  h.recognition.onresult({results:[result('2 BHK',true),result('in Miyapur',true)]});
  h.recognition.onresult({results:[result('2 BHK',true),result('in Miyapur',true)]});
  assert.equal(h.state.text,'typed 2 BHK in Miyapur'); assert.equal(h.state.interim,'');
  h.controller.stop(); assert.equal(h.state.listening,false);
});
test('speech handles permission denial, empty recognition, unsupported browser and callbacks after disposal', () => {
  const h=harness(); h.controller.start(); h.recognition.onerror({error:'not-allowed'});
  assert.match(h.state.error,/denied/);
  const empty=harness(); empty.controller.start(); empty.controller.stop(); assert.match(empty.state.error,/No speech/);
  const disposed=harness(); const late=disposed.recognition.onresult; disposed.controller.dispose(); late({results:[result('late',true)]}); assert.equal(disposed.state.text,'typed');
  let error; assert.equal(createSpeechSession({onError:x=>error=x}),null); assert.match(error,/not supported/);
});
