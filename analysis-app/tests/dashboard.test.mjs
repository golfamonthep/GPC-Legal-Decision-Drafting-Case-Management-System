import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {dashboardSnapshot} from '../server/dashboard.mjs';
import {readRoute,pageUrl} from '../src/routes.mjs';

test('home, analysis deep links, and registry handoff have separate routes',()=>{
 assert.equal(readRoute({pathname:'/',search:''}).view,'home');
 assert.equal(readRoute({pathname:'/analysis',search:''}).listing,true);
 assert.deepEqual(readRoute({pathname:'/analysis',search:'?job=job-1'}),{view:'work',jobId:'job-1',listing:false});
 assert.equal(readRoute({pathname:'/analysis',search:'?new=1'}).listing,false);
 assert.equal(readRoute({pathname:'/',search:'?handoff=1&registry_origin=http%3A%2F%2F127.0.0.1%3A3000'}).view,'transfer');
 assert.equal(pageUrl('work',{jobId:'job-1'}),'/analysis?job=job-1');
});

test('dashboard distinguishes the empty analysis store from unavailable storage',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE jobs(id TEXT,title TEXT,version INTEGER,updated_at TEXT); CREATE TABLE documents(data TEXT); CREATE TABLE revisions(id TEXT);');
 const empty=dashboardSnapshot(db,()=> '2026-10-12T00:00:00Z');
 assert.equal(empty.state,'empty');assert.equal(empty.jobs_count,0);assert.equal(empty.last_job_update,null);assert.deepEqual(empty.recent_jobs,[]);
 db.exec('DROP TABLE documents');assert.throws(()=>dashboardSnapshot(db));db.close();
});

test('dashboard counts only local jobs and unreviewed documents and orders recent work',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE jobs(id TEXT,title TEXT,version INTEGER,updated_at TEXT); CREATE TABLE documents(data TEXT); CREATE TABLE revisions(id TEXT);');
 const insert=db.prepare('INSERT INTO jobs VALUES(?,?,?,?)');
 insert.run('old','งานเก่า',1,'2026-10-09T00:00:00Z');insert.run('new','งานล่าสุด',3,'2026-10-12T00:00:00Z');
 for(const data of [{reviewed:true},{reviewed:false},{}])db.prepare('INSERT INTO documents VALUES(?)').run(JSON.stringify(data));
 db.exec("INSERT INTO revisions VALUES('rev-1'); INSERT INTO revisions VALUES('rev-2');");
 const result=dashboardSnapshot(db);assert.equal(result.state,'ready');assert.equal(result.jobs_count,2);assert.equal(result.pending_documents,2);assert.equal(result.saved_revisions,2);assert.equal(result.recent_jobs[0].id,'new');assert.equal(result.last_job_update,'2026-10-12T00:00:00Z');db.close();
});
