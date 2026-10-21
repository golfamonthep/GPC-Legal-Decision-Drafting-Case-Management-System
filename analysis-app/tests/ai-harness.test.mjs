import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {proposeLocalSection} from '../server/ai.mjs';

const env={AI_ENABLED:'true',AI_PROVIDER:'deepseek',AI_API_KEY:'test-key',AI_BASE_URL:'https://api.deepseek.com',AI_MODEL:'deepseek-v4-pro'};
const job=()=>({id:'job-local',version:2,data:{title:'งานทดสอบ',external_case_ref:'55/68',subject_name:'สมหญิง ใจดี',rank_position:'',claim:'คำร้อง',response:'',issues:'',bundle_fingerprint:'current',references:[{id:'law-1',kind:'law',role:'law',label:'กฎหมาย',page:1,text:'หลักกฎหมาย',reviewed:true}],facts:[]}});
const knowledge={summary:{fingerprint:'current'},seniority:[]};
const response=data=>new Response(JSON.stringify({id:'resp-local',status:'completed',model:'deepseek-v4-pro',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}],usage:{input_tokens:5,output_tokens:5,total_tokens:10}}),{status:200,headers:{'Content-Type':'application/json'}});

test('local proposal refuses assertions without an approved evidence source',async()=>{
 const value=job();value.data.references=[];let contacted=false;
 await assert.rejects(proposeLocalSection({job:value,documents:[],knowledge,section:'การวิเคราะห์',userId:'local',env,fetchImpl:async()=>{contacted=true;return response({});}}),/ตรวจและอนุมัติแหล่ง/);
 assert.equal(contacted,false);
});

test('local proposal uses shared pseudonymization and returns auditable metadata',async()=>{
 let sent='';const result=await proposeLocalSection({job:job(),documents:[],knowledge,section:'การวิเคราะห์',userId:'local',env,fetchImpl:async(_url,init)=>{sent=String(init.body);return response({text:'[[PERSON_1]] [[CASE_1]] [law-1]',citations:['law-1'],gaps:[]});}});
 assert.equal(sent.includes('สมหญิง ใจดี'),false);assert.equal(sent.includes('55/68'),false);
 assert.equal(result.text,'สมหญิง ใจดี 55/68 [law-1]');assert.equal(result.provider,'deepseek');assert.equal(result.job_version,2);
});

test('local proposal supports standard DeepSeek / OpenAI chat completions format',async()=>{
 const chatResponse = data => new Response(JSON.stringify({
  id: 'chatcmpl-test',
  object: 'chat.completion',
  model: 'deepseek-chat',
  choices: [{
   index: 0,
   message: {
    role: 'assistant',
    content: `<think>internal reasoning</think>\n${JSON.stringify(data)}`
   },
   finish_reason: 'stop'
  }],
  usage: {prompt_tokens: 12, completion_tokens: 25, total_tokens: 37}
 }), {status: 200, headers: {'Content-Type': 'application/json'}});

 let targetUrl = '';
 const result = await proposeLocalSection({
  job: job(),
  documents: [],
  knowledge,
  section: 'การวิเคราะห์',
  userId: 'local',
  env: {...env, AI_MODEL: 'deepseek-chat'},
  fetchImpl: async (url) => {
   targetUrl = url;
   return chatResponse({text: 'ผลการวิเคราะห์ [[PERSON_1]] [law-1]', citations: ['law-1'], gaps: []});
  }
 });

 assert.equal(targetUrl, 'https://api.deepseek.com/chat/completions');
 assert.equal(result.text, 'ผลการวิเคราะห์ สมหญิง ใจดี [law-1]');
 assert.equal(result.usage.inputTokens, 12);
 assert.equal(result.usage.outputTokens, 25);
});

test('local proposal enforces AI_MAX_BUDGET_USD spend ceiling',async()=>{
 const tmpStateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-budget-test-'));
 const customEnv = {...env, AI_MAX_BUDGET_USD: '0.000001', ANALYSIS_STATE_DIR: tmpStateDir};
 let callCount = 0;
 const chatResponse = () => {
  callCount++;
  return new Response(JSON.stringify({
   id: 'chatcmpl-test',
   choices: [{message: {role: 'assistant', content: JSON.stringify({text: 'ทดสอบ', citations: ['law-1'], gaps: []})}, finish_reason: 'stop'}],
   usage: {prompt_tokens: 1000, completion_tokens: 1000, total_tokens: 2000}
  }), {status: 200, headers: {'Content-Type': 'application/json'}});
 };

 // First call records spend which exceeds 0.000001 USD
 await proposeLocalSection({
  job: job(),
  documents: [],
  knowledge,
  section: 'การวิเคราะห์',
  userId: 'local',
  env: customEnv,
  fetchImpl: async () => chatResponse()
 });
 assert.equal(callCount, 1);

 // Second call must be blocked immediately by budget guard
 await assert.rejects(
  proposeLocalSection({
   job: job(),
   documents: [],
   knowledge,
   section: 'การวิเคราะห์',
   userId: 'local',
   env: customEnv,
   fetchImpl: async () => chatResponse()
  }),
  /ค่าใช้จ่าย AI สะสมถึงเพดานงบประมาณ/
 );
 assert.equal(callCount, 1); // verify fetch was not called second time
});
