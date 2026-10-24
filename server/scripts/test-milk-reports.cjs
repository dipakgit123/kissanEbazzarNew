'use strict';
// Pure checks by default. --database uses only the disposable audit PostgreSQL
// instance at 127.0.0.1:55439, never application config or environment files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const math = require('../src/utils/milkReportMath');
const notebook = require('../src/utils/milkNotebook');
const root = path.resolve(__dirname, '../..');
const notebookSource=fs.readFileSync(path.join(root,'frontend/src/utils/milkNotebook.js'),'utf8');
assert.equal(fs.readFileSync(path.join(root,'mobile/src/utils/milkNotebook.js'),'utf8'),notebookSource);
const serverNotebook=notebookSource.replace("import { calculate, selectTotals, summarize, round, localDate, validDate } from './milkReportMath';", "const { calculate, selectTotals, summarize, round, localDate, validDate } = require('./milkReportMath');").replaceAll('export const ','const ').replaceAll('export function ','function ');
assert.equal(fs.readFileSync(path.join(root,'server/src/utils/milkNotebook.js'),'utf8').split('module.exports =')[0].trim(),serverNotebook.trim());
const canonical = fs.readFileSync(path.join(root, 'server/src/utils/milkReportMath.js'), 'utf8').replace("'use strict';\n", '').replace('module.exports =', 'export');
for (const app of ['frontend', 'mobile']) assert.equal(fs.readFileSync(path.join(root, `${app}/src/utils/milkReportMath.js`), 'utf8'), canonical, `${app} accounting must match the API`);
const row = (id, extra = {}) => ({id, cow_id: id, cow_name: `Animal ${id}`, animal_type: 'cow', report_type: 'individual', report_date: '2026-10-22', morning_liters: 5, afternoon_liters: 5, price_per_liter: 40, feed_cost: 100, ...extra});
assert.equal(math.calculate({morning_liters: 0.1, afternoon_liters: 0.2, price_per_liter: 1, feed_cost: 0.3}).profit_status, 'break_even');
assert.equal(math.localDate(new Date(2026, 10, 1, 0, 30)), '2026-11-01');
assert.ok(math.validDate('2028-02-29'));
for (const value of ['2026-02-29','2026-02-30','2026-13-01','no-date',null]) assert.equal(math.validDate(value), false);
for (const value of ['12abc',-1,'1.234',Infinity,{},true,100000000]) assert.ok(math.validateValues({morning_liters:value}));
assert.equal(math.validateValues({feed_cost:'',medicine_cost:null}),null);
assert.equal(math.normalizeValues({feed_cost:''}).feed_cost,0);
assert.equal(math.normalizeValues({amount_received:''}).amount_received,null);
const sales = row(1,{morning_sold_liters:4,afternoon_sold_liters:3,morning_price_per_liter:40,afternoon_price_per_liter:50,home_liters:1,calf_liters:1,discarded_liters:1,amount_received:200});
assert.equal(math.validateValues(sales),null);
assert.deepEqual([math.calculate(sales).total_revenue,math.calculate(sales).profit_or_loss,math.calculate(sales).amount_pending],[310,210,110]);
assert.equal(math.calculate(sales).revenue_is_estimated,false);
assert.equal(math.calculate(row(1)).revenue_is_estimated,true);
assert.equal(math.calculate(row(1)).amount_pending,null);
for (const [extra, reason] of [[{morning_sold_liters:6},'soldTooMuch'],[{home_liters:1},'enterSold'],[{...sales,home_liters:2},'usageTooMuch'],[{amount_received:401},'receivedTooMuch']]) assert.equal(math.validateValues({...row(1),...extra}).reason,reason);
const mixed = [row(1),row(2,{report_type:'overall',cow_id:null})];
assert.equal(math.summarize(mixed).total_liters,10);
assert.equal(math.summarize(mixed).excluded_reports,1);
assert.equal(math.summarize([row(1),row(2)]).profitable_days,1);
const ranked = [row(1,{feed_cost:300}),row(2,{cow_id:1,cow_name:'Animal 1',report_date:'2026-10-21',feed_cost:300}),row(3,{feed_cost:250})];
assert.equal(math.summarize(ranked).best_cow.cow_name,'Animal 1');
assert.equal(math.csvCell('=1+1'),'"\'=1+1"');
assert.equal(math.csvCell('  @SUM(A1)'),'"\'  @SUM(A1)"');
assert.equal(math.csvCell(-10),'"-10"');
assert.ok(math.csvDocument([['मराठी','a,"b"\nc']]).startsWith('\uFEFF'));
console.log('PASS: shared web/mobile/API accounting, overlap, ranking, dates, validation, payment tracking, break-even and CSV escaping.');
const notebookRows = [row(1),row(2,{report_type:'overall',cow_id:null}),row(3,{report_date:'2026-10-21',feed_cost:0,expense_status:'none'})];
const notebookExpenses = [{id:1,expense_date:'2026-10-20',category:'feed',kind:'purchase',scope:'herd',amount:1000},{id:2,expense_date:'2026-10-22',category:'medicine',scope:'animal',cow_id:1,animal_type:'cow',amount:50}];
const ledger=notebook.notebookData(notebookRows,notebookExpenses);
assert.equal(ledger.total_liters,20);assert.equal(ledger.total_cost,1150);assert.equal(ledger.balance,-350);
assert.equal(ledger.purchases,1000);assert.equal(ledger.days.find(day=>day.date==='2026-10-20').milk,null);
assert.equal(ledger.unknown_costs,0);assert.equal(ledger.categories.feed,1100);
assert.equal(notebook.notebookData(notebookRows,notebookExpenses,'1').shared_excluded,1000);
assert.equal(notebook.notebookData([row(1,{feed_cost:0})],[]).unknown_costs,1);
assert.equal(notebook.notebookData([row(1,{feed_cost:0,expense_status:'none'})],[]).unknown_costs,0);
assert.equal(notebook.dateList('2024-01-01','2024-12-31').length,366);
assert.equal(notebook.notebookRange('history','custom','','2026-01-01','2027-01-03'),null);
assert.deepEqual(notebook.notebookRange('history','week','2026-11-01'),{from:'2026-10-26',to:'2026-11-01'});
console.log('PASS: notebook independent expenses, overlap, no-milk days, bulk purchase, unknown costs, shared exclusion and date ranges.');

async function databaseChecks() {
 const { Sequelize, DataTypes } = require('sequelize');
 const net = require('node:net');
 const connect = net.Socket.prototype.connect;
 net.Socket.prototype.connect = function(...args) {
   const options = net._normalizeArgs(args)[0];
   if (options.host !== '127.0.0.1' || Number(options.port) !== 55439) throw Error('Only isolated audit PostgreSQL is allowed');
   return connect.apply(this,args);
 };
 const database = 'milk_report_test_' + Date.now();
 const options = {dialect:'postgres',host:'127.0.0.1',port:55439,logging:false,dialectOptions:{ssl:false}};
 let admin,sequelize;
 try {
   admin=new Sequelize('postgres','audit_admin','',options);
   await admin.query(`CREATE DATABASE "${database}"`); await admin.close(); admin=null;
   sequelize=new Sequelize(database,'audit_admin','',options);
   const qi=sequelize.getQueryInterface();
   await qi.createTable('users',{id:{type:DataTypes.INTEGER,primaryKey:true}});
   await qi.bulkInsert('users',[{id:1},{id:2}]);
   for(const name of ['20260603000000-create-milk-reports','20260603000001-create-farmer-cows','20260603000002-add-cow-id-to-milk-reports','20260606000000-add-report-type-to-milk-reports','20260606000001-add-animal-type-to-farmer-cows-and-milk-reports']) await require('../src/migrations/'+name).up(qi,Sequelize);
   // Run the existing integrity migration against minimal local fixtures for its other tables.
   await qi.createTable('appointments',{veterinarian_id:DataTypes.INTEGER,appointment_date:DataTypes.DATEONLY,appointment_time:DataTypes.TIME,status:DataTypes.STRING});
   await qi.createTable('vet_reviews',{id:{type:DataTypes.INTEGER,primaryKey:true}});
   for(const table of ['call_logs','notifications','veterinarians']) await qi.createTable(table,{id:{type:DataTypes.INTEGER,primaryKey:true}});
   await require('../src/migrations/20261019000000-enforce-runtime-integrity').up(qi,Sequelize);
   await qi.bulkInsert('farmer_cows',[{id:100,user_id:1,cow_name:'Legacy',cow_tag:'LEGACY',animal_type:'cow',created_at:new Date(),updated_at:new Date()}]);
   await qi.bulkInsert('milk_reports',[{user_id:1,cow_id:100,cow_name:'Legacy',cow_tag:'LEGACY',animal_type:'cow',report_type:'individual',report_date:'2026-10-01',morning_liters:5,afternoon_liters:5,price_per_liter:40,created_at:new Date(),updated_at:new Date()}]);
   const migration=require('../src/migrations/20261022000000-improve-milk-report-accounting');
   await migration.up(qi,Sequelize);
   const expenseMigration=require('../src/migrations/20261022000001-add-milk-expense-notebook');
   await expenseMigration.up(qi,Sequelize);
   const db={sequelize,Sequelize};
   db.FarmerCow=require('../src/models/FarmerCow')(sequelize,DataTypes);
   db.MilkReport=require('../src/models/MilkReport')(sequelize,DataTypes);
   db.MilkExpense=require('../src/models/MilkExpense')(sequelize,DataTypes);
   db.FarmerCow.associate(db);db.MilkReport.associate(db);
   const modelPath=require.resolve('../src/models');require.cache[modelPath]={id:modelPath,filename:modelPath,loaded:true,exports:db};
   const controller=require('../src/controllers/milkReportController');
   const expenseController=require('../src/controllers/milkExpenseController');
   let checks=0;
   async function call(method,body={},id=1,user=1,query={}) {
     const res={code:200,status(code){this.code=code;return this;},json(data){this.body=JSON.parse(JSON.stringify(data));return this;}};
     await controller[method]({body,params:{id},user:{id:user},query},res);checks++;return res;
   }
   const legacy=(await call('getReports',{},1,1,{from_date:'2026-10-01',to_date:'2026-10-01'})).body.data[0];
   assert.equal(legacy.total_revenue,400);assert.equal(legacy.revenue_is_estimated,true);assert.equal(legacy.amount_received,null);
   const cow=(await call('createCow',{cow_name:'Cow',cow_tag:'SAME',animal_type:'cow'})).body.data;
   const buffalo=(await call('createCow',{cow_name:'Buffalo',cow_tag:'SAME',animal_type:'buffalo'})).body.data;
   let result=await call('createReport',{...row(1),cow_id:cow.id,feed_cost:'',medicine_cost:'',labor_cost:'',other_cost:''});
   assert.equal(result.code,201,JSON.stringify(result));const id=result.body.data.id;
   assert.equal((await call('createReport',{...row(1),cow_id:buffalo.id})).code,201);
   assert.equal((await call('createReport',{...row(1),cow_id:cow.id})).code,409);
   assert.equal((await call('createReport',{...row(1),cow_id:cow.id},1,2)).code,404);
   for(const body of [{...row(1),report_date:'2026-02-30'},{...row(1),morning_liters:'12abc'},{...row(1),report_type:'wrong'},{...row(1),cow_id:'1foo'}]) assert.equal((await call('createReport',body)).code,400);
   result=await call('updateReport',{...sales,cow_id:cow.id},id);
   assert.equal(result.code,200,JSON.stringify(result));assert.equal(result.body.data.total_revenue,310);assert.equal(result.body.data.amount_pending,110);
   assert.equal((await call('updateReport',{morning_sold_liters:6},id)).code,400);
   assert.equal((await call('updateReport',{notes:'foreign'},id,2)).code,404);
   assert.equal((await call('deleteReport',{},id,2)).code,404);
   assert.equal((await call('deleteCow',{},cow.id,2)).code,404);
   assert.equal((await call('deleteCow',{},cow.id)).code,200);
   result=await call('updateReport',{notes:'Corrected after deletion',cow_id:null},id);
   assert.equal(result.code,200,JSON.stringify(result));assert.equal(result.body.data.cow_id,null);assert.equal(result.body.data.cow_name,'Cow');
   const herdPayload={...row(1),report_type:'overall',cow_id:null,report_date:'2026-10-22',morning_liters:10,afternoon_liters:10};
   const concurrent=await Promise.all([call('createReport',herdPayload),call('createReport',herdPayload)]);
   assert.deepEqual(concurrent.map(r=>r.code).sort(),[201,409]);
   result=await call('getStats',{},1,1,{month:'10',year:'2026'});
   assert.equal(result.body.data.total_liters,30); // 10 legacy + 20 authoritative herd
   assert.equal(result.body.data.excluded_reports,2);
   for(const query of [{month:'13',year:'2026'},{month:'10',year:'bad'}])assert.equal((await call('getStats',{},1,1,query)).code,400);
   for(const query of [{from_date:'bad'},{from_date:'2026-11-01',to_date:'2026-10-01'},{cow_id:'abc'}])assert.equal((await call('getReports',{},1,1,query)).code,400);
   assert.equal((await call('deleteReport',{},id)).code,200);
   const indexes=await qi.showIndex('milk_reports');
   assert.ok(!indexes.some(i=>i.name==='milk_reports_user_tag_date_unique'));
   assert.ok(indexes.some(i=>i.name==='milk_reports_unique_herd_day'));
   async function expenseCall(method,body={},id=1,user=1,query={}) {
     const res={code:200,status(code){this.code=code;return this;},json(data){this.body=JSON.parse(JSON.stringify(data));return this;}};
     await expenseController[method]({body,params:{id},user:{id:user},query},res);checks++;return res;
   }
   const batch={request_id:'local-audit-batch',scope:'herd',expense_date:'2026-10-20',items:[{category:'feed',kind:'purchase',amount:1000},{category:'medicine',amount:50}]};
   result=await expenseCall('create',batch);assert.equal(result.code,201,JSON.stringify(result));
   const expenseId=result.body.data[0].id;
   assert.equal((await expenseCall('create',batch)).code,200);
   assert.equal((await db.MilkExpense.findAll()).length,2);
   assert.equal((await expenseCall('create',{...batch,items:[{category:'feed',amount:2000}]})).code,409);
   assert.equal((await expenseCall('create',{...batch,request_id:'invalid-batch',items:[{category:'feed',amount:20},{category:'medicine',amount:-2}]})).code,400);
   assert.equal((await db.MilkExpense.findAll()).length,2);
   for (const change of [{amount:'1.234'},{amount:0},{expense_date:'2026-02-30'},{kind:'purchase',category:'medicine'},{scope:'animal',cow_id:buffalo.id,user_id:1}]) {
     const user=change.cow_id?2:1;
     assert.equal((await expenseCall('create',{request_id:'invalid-single',scope:'herd',expense_date:'2026-10-22',category:'feed',amount:10,...change},1,user)).code,400);
   }
   assert.equal((await expenseCall('list',{},1,2)).body.data.length,0);
   assert.equal((await expenseCall('update',{amount:30},expenseId,2)).code,404);
   assert.equal((await expenseCall('remove',{},expenseId,2)).code,404);
   assert.equal((await expenseCall('list',{},1,1,{from_date:'2026-10-21'})).body.data.length,0);
   result=await call('getStats',{},1,1,{from_date:'2026-10-20',to_date:'2026-10-20'});
   assert.equal(result.body.data.total_liters,0);assert.equal(result.body.data.total_cost,1050);assert.equal(result.body.data.net_profit_or_loss,-1050);
   const animalExpense=await expenseCall('create',{request_id:'animal-expense',scope:'animal',cow_id:buffalo.id,expense_date:'2026-10-22',category:'medicine',amount:99});
   assert.equal(animalExpense.code,201);
   await call('deleteCow',{},buffalo.id);
   result=await expenseCall('update',{amount:100},animalExpense.body.data[0].id);
   assert.equal(result.code,200);assert.equal(result.body.data.cow_id,null);assert.equal(result.body.data.cow_name,'Buffalo');
   const races=await Promise.all([expenseCall('create',{...batch,request_id:'concurrent-batch'}),expenseCall('create',{...batch,request_id:'concurrent-batch'})]);
   assert.deepEqual(races.map(r=>r.code).sort(),[200,201]);
   assert.equal((await expenseCall('remove',{},expenseId)).code,200);
   assert.equal((await call('updateReport',{expense_status:'bad'},concurrent.find(r=>r.code===201).body.data.id)).code,400);
   await expenseMigration.down(qi);await expenseMigration.up(qi,Sequelize);
   // Down/up round trip against disposable rows verifies migration structure.
   await migration.down(qi);await migration.up(qi,Sequelize);
   console.log(`PASS: ${checks} isolated PostgreSQL controller checks, legacy upgrade, cross-species tags, CRUD, ownership, concurrent uniqueness, orphan editing, stats and migration rollback.`);
 } finally {
   if(sequelize)await sequelize.close();if(admin)await admin.close();
   const cleanup=new Sequelize('postgres','audit_admin','',options);
   try { if(!/^milk_report_test_\d+$/.test(database))throw Error('Unexpected database');await cleanup.query(`DROP DATABASE IF EXISTS "${database}"`); }
   finally {await cleanup.close();net.Socket.prototype.connect=connect;}
 }
}
if(process.argv.includes('--database'))databaseChecks().catch(error=>{console.error(error);process.exitCode=1;});
