import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function store(service) {
  let state;
  const modules = {
    zustand: { create: factory => { const get = () => state; const set = value => { state = {...state,...(typeof value === 'function' ? value(state) : value)}; }; state = factory(set,get); return {getState:get}; } },
    '@/features/user/store/vehicle.store': {useVehicleStore:{getState:()=>({vehicle:null})}},
    '@/features/history/store/history.store': {useHistoryStore:{getState:()=>({markLogAsPaid(){}})}},
    '@/features/violation/services/violation.service': {violationService:service},
    '@/services/signalr': {}, '@microsoft/signalr': {},
  };
  const exports={};
  const code=ts.transpileModule(readFileSync(new URL('../features/violation/store/violation.store.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,console:{log(){},error(){},warn(){}},require:name=>{assert.ok(name in modules,`Unexpected dependency: ${name}`);return modules[name];}});
  return exports.useViolationStore;
}

test('financial rows are cleared when the authenticated session ends',async()=>{
  const row={referenceNumber:'SYNTHETIC',penaltyFee:10,isPaid:false};
  const financial=store({getActiveViolations:async()=>({data:[row]}),getViolationHistory:async()=>({data:{items:[row]}})});
  await financial.getState().loadActiveViolations();await financial.getState().loadGuardViolations();
  assert.equal(financial.getState().activeViolationsList.length,1);assert.equal(financial.getState().guardViolationsList.length,1);
  financial.getState().resetFinancialState();
  assert.equal(financial.getState().activeViolationsList.length,0);assert.equal(financial.getState().guardViolationsList.length,0);assert.equal(financial.getState().guardUnpaidCount,0);
});

test('late financial responses from a previous account cannot repopulate the next session',async()=>{
  let finishPersonal,finishGuard;
  const personal=new Promise(resolve=>finishPersonal=resolve),guard=new Promise(resolve=>finishGuard=resolve);
  const financial=store({getActiveViolations:()=>personal,getViolationHistory:()=>guard});
  const requests=[financial.getState().loadActiveViolations(),financial.getState().loadGuardViolations(),financial.getState().fetchGuardUnpaidCount()];
  financial.getState().resetFinancialState();
  finishPersonal({data:[{referenceNumber:'PREVIOUS-ACCOUNT'}]});finishGuard({data:{items:[{isPaid:false}]}});await Promise.all(requests);
  assert.equal(financial.getState().activeViolationsList.length,0);assert.equal(financial.getState().guardViolationsList.length,0);assert.equal(financial.getState().guardUnpaidCount,0);
});
