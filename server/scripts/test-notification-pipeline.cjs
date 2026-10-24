const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const root=path.resolve(__dirname,'..');
const Op=Object.fromEntries(['or','in','gt','lt','lte','gte','between','ne'].map(k=>[k,Symbol(k)]));
const logger={log(){},error(){}};
const load=(name,deps={},extra={})=>{const box={module:{exports:{}},require:id=>{if(id in deps)return deps[id];if(id==='../utils/animalGroup')return require('../src/utils/animalGroup');throw Error('Unmocked dependency: '+id);},global:{},setTimeout,clearTimeout,console,process:{env:{}},...extra};vm.runInNewContext(fs.readFileSync(path.join(root,'src',name),'utf8'),box,{filename:name});return box.module.exports;};
const plain=x=>JSON.parse(JSON.stringify(x));
function serviceFixture(){
 const rows=[],jobs=[],emits=[];let prefs=null;
 const row=v=>({...v,id:rows.length+1,update:async function(v){Object.assign(this,v);}});
 const db={User:{findByPk:async()=>({is_verified:true})},NotificationPreference:{findOne:async()=>prefs},NotificationJob:{},sequelize:{transaction:async fn=>fn({})},Notification:{create:async v=>{const n=row(v);rows.push(n);return n;},findOrCreate:async({where,defaults})=>{const old=rows.find(n=>n.dedupe_key===where.dedupe_key);if(old)return[old,false];const n=row(defaults);rows.push(n);return[n,true];}}};
 class Expo{};Expo.isExpoPushToken=()=>false;
 const service=load('services/notificationService.js',{'expo-server-sdk':{Expo},sequelize:{Op},'../utils/logger':logger,'../config/firebase':{getMessaging:()=>null},'./notificationQueue':{enqueue:async(...args)=>jobs.push(args)},'./notificationText':require('../src/services/notificationText')},{global:{io:{to:()=>({emit:(...a)=>emits.push(a)})}}});
 return {service,db,rows,jobs,emits,setPrefs:p=>{prefs=p;}};
}
test('inbox + queued dispatch; never claims device delivery; duplicate does not re-emit',async()=>{
 const f=serviceFixture(),args={db:f.db,recipientId:4,title:'t',body:'b',type:'new_listing',data:{dedupe_key:'a'}};
 let result=await f.service.deliverNotification(args);assert.equal(result.stored,true);assert.equal(result.delivered,false);assert.equal(f.jobs.length,1);assert.equal(f.rows[0].push_delivered_at,undefined);
 result=await f.service.deliverNotification(args);assert.equal(result.duplicate,true);assert.equal(f.rows.length,1);assert.equal(f.jobs.length,1);assert.equal(f.emits.length,1);
});
test('push off keeps inbox; category off suppresses; appointments always disabled',async()=>{
 const f=serviceFixture(),a={db:f.db,recipientId:1,title:'t',body:'b',type:'health_report'};
 f.setPrefs({push_enabled:false});await f.service.deliverNotification(a);assert.equal(f.rows.length,1);assert.equal(f.jobs.length,0);
 f.setPrefs({health_enabled:false});assert.equal((await f.service.deliverNotification(a)).suppressed,true);
 assert.equal((await f.service.deliverNotification({...a,type:'new_appointment'})).suppressed,true);
});
test('stored content is localized and recipient-bound',async()=>{const f=serviceFixture();f.setPrefs({language:'mr'});await f.service.deliverNotification({db:f.db,recipientId:8,type:'health_report',title:'t',body:'b'});assert.match(f.rows[0].title,/[\u0900-\u097F]/);assert.equal(f.rows[0].data.recipient_id,8);});
function queueFixture(){
 let tokens=[],prefs=null,receipt=null,sends=0;const updates=[],jobs=[];
 const n={id:1,recipient_id:5,recipient_type:'user',type:'system',data:{},update:async v=>updates.push(v)};
 const db={sequelize:{transaction:async f=>f({})},User:{findByPk:async()=>({is_verified:true})},NotificationPreference:{findOne:async()=>prefs},DeviceToken:{findAll:async()=>tokens,findOne:async()=>tokens[0]},Notification:{findByPk:async()=>n,count:async()=>2,update:async v=>updates.push(v)},NotificationJob:{findOrCreate:async a=>{jobs.push(a);return[a,true];},findAll:async()=>jobs}};
 const service={getCategoryPreference:()=> 'system_enabled',buildRecipientTokenWhere:()=>({is_active:true}),buildRecipientWhere:()=>({}),sendPushAttempt:async()=>{sends++;return{accepted:true};},getExpoReceipt:async()=>receipt,recordTokenFailure:async()=>{}};
 const q=load('services/notificationQueue.js',{sequelize:{Op},crypto:require('crypto'),'../utils/logger':logger,'./notificationService':service,'../utils/businessTime':{calendarDate:()=> '2026-10-22'}});
 return {q,db,n,jobs,updates,service,tokens:t=>{tokens=t;},prefs:p=>{prefs=p;},receipt:r=>{receipt=r;},sends:()=>sends};
}
test('no devices remains pending and is never marked delivered',async()=>{const f=queueFixture();const r=await f.q.processJob(f.db,{kind:'notification',payload:{notificationId:1}});assert.equal(r.noAttempt,true);assert.equal(f.updates[0].push_status,'no_devices');assert.equal(f.sends(),0);});
test('dispatch creates separate persistent jobs per device',async()=>{const f=queueFixture();f.tokens([{id:7},{id:9}]);await f.q.processJob(f.db,{kind:'notification',payload:{notificationId:1}});assert.deepEqual(f.jobs.map(j=>j.where.dedupe_key),['push:1:7','push:1:9']);});
test('partial acceptance is not full delivery',async()=>{const f=queueFixture();f.jobs.push({status:'accepted'},{status:'pending'});await f.q.syncDeliveryState(f.db,1);assert.equal(f.updates[0].push_status,'partial');assert.equal(f.updates[0].push_delivered_at,null);});
test('Expo receipt resumes without resending; transient receipt error retries independently',async()=>{const f=queueFixture();f.tokens([{id:7,token:'mock'}]);const j={kind:'push',payload:{notificationId:1,receiptId:'receipt'}};assert.equal((await f.q.processJob(f.db,j)).noAttempt,true);f.receipt({status:'ok'});assert.equal((await f.q.processJob(f.db,j)).status,'accepted');assert.equal(f.sends(),0);f.receipt({status:'error',details:{error:'MessageRateExceeded'}});assert.equal((await f.q.processJob(f.db,j)).payload.receiptId,null);});
test('disabled preferences suppress queued jobs',async()=>{const f=queueFixture();f.prefs({push_enabled:false});assert.equal((await f.q.processJob(f.db,{kind:'push',payload:{notificationId:1}})).status,'suppressed');});
test('delivered pregnancy and completed milk entries cancel stale queued pushes',async()=>{const f=queueFixture();f.n.type='pregnancy_reminder';f.n.data={record_id:1};f.db.PregnancyRecord={findByPk:async()=>({status:'delivered',reminder_enabled:true})};assert.equal(await f.q.eligible(f.db,f.n),false);f.n.type='milk_reminder';f.n.data={report_date:'2026-10-22'};f.db.MilkReport={findOne:async()=>({id:1})};assert.equal(await f.q.eligible(f.db,f.n),false);});
function eventsFixture(row){const sends=[],queued=[];const dependencies={sequelize:{Op},crypto:require('crypto'),'./notificationQueue':{enqueue:async(...a)=>queued.push(a)},'./notificationService':{deliverNotification:async a=>sends.push(a)},'./nearbyUserService':{findNearbyUsers:async()=>[{id:2}]}};const events=load('services/notificationEvents.js',dependencies);return {events,sends,queued,db:new Proxy({Wishlist:{findAll:async()=>[{id:10,user_id:3}]},NotificationPreference:{findAll:async()=>[{id:4,recipient_id:5}]}},{get:(obj,key)=>obj[key]||{findByPk:async()=>row}})};}
test('all seven animal types generate nearby alerts',async()=>{for(const model of ['AnimalListing','BuffaloListing','HorseListing','GoatListing','DogListing','CatListing','OtherAnimalListing']){const f=eventsFixture({id:1,user_id:1,status:'active'});await f.events.processEvent(f.db,{id:6,payload:{model,id:1,before:null,after:{}}});assert.equal(f.sends[0].type,'new_listing');assert.ok(f.sends[0].data.animal_type);}});
test('wishlist price and sold triggers; suppress stale price change',async()=>{const row={id:1,user_id:1,status:'active',expectedPrice:80};const f=eventsFixture(row);let j={id:1,payload:{model:'AnimalListing',id:1,before:{expectedPrice:100,status:'active'},after:{expectedPrice:80,status:'active'}}};await f.events.processEvent(f.db,j);assert.equal(f.sends[0].type,'price_drop');row.expectedPrice=120;await f.events.processEvent(f.db,j);assert.equal(f.sends.length,1);row.status='sold';j.payload.after.status='sold';await f.events.processEvent(f.db,j);assert.equal(f.sends[1].type,'listing_sold');});
test('health, pet profile, vet contact/status and opted-in content triggers',async()=>{for(const [model,type]of [['AIHealthReport','health_report'],['PetMatingProfile','pet_status'],['VetLeadLog','vet_contact'],['Veterinarian','vet_status'],['Blog','blog_published'],['GovernmentScheme','scheme_published']]){const f=eventsFixture({id:1,user_id:1,veterinarian_id:8,lead_type:'call_click',status:'published',title:'Article',slug:'article'});await f.events.processEvent(f.db,{id:1,payload:{model,id:1,after:{}}});assert.equal(f.sends[0].type,type);}});
test('model hooks use original transaction and support static status updates',async()=>{const f=eventsFixture({});const hooks={};const old={id:1,status:'active',expectedPrice:100},row={id:1,status:'sold',expectedPrice:100};const Model={addHook:(event,_name,fn)=>hooks[event]=fn,findAll:async()=>[old],findByPk:async()=>row};f.events.install({AnimalListing:Model});const tx={},opts={attributes:{status:'sold'},where:{id:1},transaction:tx};await hooks.beforeBulkUpdate(opts);await hooks.afterBulkUpdate(opts);assert.equal(f.queued.length,1);assert.equal(f.queued[0][4].transaction,tx);assert.equal(f.queued[0][3].before.status,'active');});
test('mobile templates match server templates in all three languages',()=>{assert.equal(fs.readFileSync(path.join(root,'src/services/notificationMessages.json'),'utf8'),fs.readFileSync(path.join(root,'../mobile/src/utils/notificationMessages.json'),'utf8'));});
test('reminder scan catches overdue dates and appointments are not scheduled',async()=>{
 const sent=[],scheduled=[];const record={id:1,user_id:2,status:'pregnant',confirmed_on:'2026-01-01',reminder_enabled:true,expected_delivery_date:'2026-10-21',next_check_date:'2026-10-21',animal_name:'Cow',update:async()=>{}};
 const db={PregnancyRecord:{findAll:async()=>[record]}};
 const reminders=load('services/scheduledNotifications.js',{'../utils/businessTime':{calendarDate:()=> '2026-10-22',addCalendarDays:(date,days)=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}},'node-cron':{schedule:(expression,fn)=>{scheduled.push(expression);return{stop(){}};}},sequelize:{Op},'../models':db,'./notificationService':{deliverNotification:async a=>{sent.push(a);return{stored:true};}},'./notificationQueue':{},'../utils/logger':logger});
 await reminders.runPregnancyReminders();assert.equal(sent.length,2);assert.ok(sent.some(x=>x.data.reminder_kind==='examination'));assert.equal(reminders.runAppointmentReminders,undefined);assert.ok(scheduled.includes('*/15 * * * *'));
});
test('worker leases a job and persists retry state without losing it', async () => {
 const f=queueFixture();f.tokens([{id:7}]);f.service.sendPushAttempt=async()=>({error:'provider_busy'});
 const job={id:11,kind:'push',payload:{notificationId:1,tokenId:7},attempts:0,expires_at:new Date(Date.now()+86400000),update:async function(values){Object.assign(this,values);}};
 let claims=0,final;
 f.db.sequelize.transaction=async fn=>fn({LOCK:{UPDATE:'UPDATE'}});
 f.db.NotificationJob.findOne=async options=>{assert.equal(options.skipLocked,true);return claims++===0?job:null;};
 f.db.NotificationJob.update=async(values,options)=>{assert.equal(options.where.lease,job.lease);final=values;};
 await f.q.run(f.db);assert.equal(final.status,'pending');assert.equal(final.attempts,1);assert.equal(final.locked_until,null);assert.ok(final.next_attempt_at>Date.now());
});
test('expired worker jobs never call the push provider', async () => {
 const f=queueFixture();const job={id:11,kind:'push',payload:{notificationId:1},attempts:0,expires_at:new Date(0),update:async function(v){Object.assign(this,v);}};
 let claims=0,final;f.db.sequelize.transaction=async fn=>fn({LOCK:{UPDATE:'UPDATE'}});f.db.NotificationJob.findOne=async()=>claims++===0?job:null;
 f.db.NotificationJob.update=async values=>{final=values;};await f.q.run(f.db);assert.equal(final.status,'expired');assert.equal(f.sends(),0);
});

test('group preferences suppress unwanted animal alerts and preserve target group',async()=>{
 const f=serviceFixture();f.setPrefs({pet_enabled:false});
 const blocked=await f.service.deliverNotification({db:f.db,recipientId:1,type:'price_drop',title:'Price',body:'Changed',data:{animal_type:'dog',listing_id:4}});
 assert.equal(blocked.suppressed,true);assert.equal(f.rows.length,0);
 f.setPrefs({pet_enabled:true});await f.service.deliverNotification({db:f.db,recipientId:1,type:'price_drop',title:'Price',body:'Changed',data:{animal_type:'dog',listing_id:4}});
 assert.equal(f.rows[0].data.animal_group,'pet');
});
