// Uses the same service client as the React UI against the running R backend.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { checkHealth, predictFlat, predictHouse, predictRent, sendChatMessage } from '../src/services/plumberApi.js';
const records = [];
const log = (label, details) => { records.push({label,details}); console.log('PASS:', label, JSON.stringify(details).slice(0,300)); };
assert.equal((await checkHealth()).status, 'ok'); log('HTTP health scalar contract', {});
const payload = {area:1200,bhk:2,locality:'Kukatpally',furnishing:'Semi-Furnished',transaction:'Resale',area_source:'Super',bathrooms:2,balconies:0,property_floor:1,total_floors:5,ownership:'Freehold',facing:'East'};
const manualId = `manual_integration_${Date.now()}`;
for (const [type, fn] of [['flat',predictFlat],['house',predictHouse],['rent',predictRent]]) {
  const r=await fn(type === 'flat' ? {...payload,session_id:manualId} : payload); assert.equal(r.success,true); assert.equal(typeof r.predicted_price,'string'); assert.notEqual(r.predicted_price,'N/A');
  log(`HTTP ${type} model`, {price:r.predicted_price});
}
await assert.rejects(predictHouse({...payload,bathrooms:1.5}), /whole number/); log('HTTP validation rejects fractional bathrooms', {});
await assert.rejects(predictRent({...payload,furnishing:'invalid'}), /Unsupported/); log('HTTP validation rejects invalid rent category', {});
const id=`integration_${Date.now()}`;
const chat = async (label,text,check,session=id) => { const r=await sendChatMessage(session,text); check(r); log(label,{reply:r.reply,prediction:r.prediction,property:r.property,state:r.conversation_state,market_status:r.market_context?.status}); return r; };
await chat('manual estimate reused for AI explanation','Please explain the previous manual valuation without changing any property details.',r=>{assert.equal(r.prediction,null);assert.equal(r.conversation_state.prediction_status,'information');assert.equal(r.property.area,1200);},manualId);
await chat('live LLM missing required details','I want to buy a flat in Kukatpally.',r=>{assert.equal(r.prediction_success,false);assert.ok(r.missing_fields.includes('area'));assert.ok(r.missing_fields.includes('bhk'));});
await chat('live LLM required details across turns','It is a 2 BHK around 1200 sqft.',r=>{assert.equal(r.property.bhk,2);assert.equal(r.property.area,1200);assert.equal(r.conversation_state.optional_fields_asked,true);assert.equal(r.prediction_success,false);});
await chat('live LLM partial optional details','Semi-furnished resale with two bathrooms and zero balconies. Skip anything else.',r=>{assert.equal(r.prediction_success,true);assert.equal(r.property.balcony,0);});
await chat('live LLM locality follow-up','What about the same property in Miyapur?',r=>{assert.equal(r.property.locality.toLowerCase(),'miyapur');assert.equal(r.property.area,1200);assert.equal(r.prediction_success,true);});
await chat('live LLM explanation uses previous result','Why is the previous estimate so high? Explain without changing any details.',r=>{assert.equal(r.prediction,null);assert.equal(r.conversation_state.prediction_status,'information');});
await chat('live LLM market comparison','Compare advertised flat listing statistics for Kukatpally and Miyapur, not a new property valuation.',r=>{assert.equal(r.prediction,null);assert.match(r.reply,/median|No matching/);});
await chat('live LLM complete house request','Estimate a 3 BHK independent house in Kukatpally, 1800 sqft Super built-up, semi-furnished resale, 3 bathrooms, 1 balcony, Freehold ownership, East facing, ground floor of a 2-floor building. All details are supplied; please predict.',r=>{assert.equal(r.intent,'house_purchase');assert.equal(r.prediction_success,true);},id+'_house');
await chat('live LLM complete rental request','Estimate monthly rent for a 2 BHK flat in Gachibowli, 1200 sqft Super built-up, semi-furnished, 2 bathrooms, 1 balcony, floor 3 of 5. Please predict with these details.',r=>{assert.equal(r.intent,'rent');assert.equal(r.prediction_success,true);},id+'_rent');
await chat('live session isolation','I want to buy a flat in Kokapet.',r=>{assert.ok(r.property.area == null);assert.equal(r.prediction_success,false);},id+'_isolated');
await writeFile('../docs/integration-results.json', JSON.stringify({testedAt:new Date().toISOString(),records},null,2));
console.log(`${records.length} HTTP and live LLM checks passed.`);
