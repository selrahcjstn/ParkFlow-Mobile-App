import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../services/apiConfig.ts', import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function configuration(env={},development=false) {
 const exports={};
 vm.runInNewContext(compiled,{exports,URL,__DEV__:development,process:{env},require(name){assert.equal(name,'expo-constants');return {default:{expoConfig:{extra:{}}}};}});
 return exports;
}
test('missing production endpoint fails closed without a remote fallback',()=>{
 const value=configuration();assert.equal(value.API_URL,'');assert.match(value.getApiConfigurationError(),/HTTPS/);
});
test('production HTTP and malformed or credentialed URLs fail closed',()=>{
 for(const url of ['http://localhost:5044/api','http://54.90.173.98:5000/api','invalid','ftp://test.invalid/api','https://user:secret@example.invalid/api','https://example.invalid/api?token=secret']){
  const value=configuration({EXPO_PUBLIC_API_URL:url,EXPO_PUBLIC_ALLOW_LOCAL_HTTP:'true'});
  assert.equal(value.API_URL,'');assert.doesNotMatch(value.getApiConfigurationError(),/secret|54\.90/);
 }
});
test('configured HTTPS shares its authority with SignalR and files',()=>{
 const value=configuration({EXPO_PUBLIC_API_URL:'https://api.example.invalid/api/'});assert.equal(value.API_URL,'https://api.example.invalid/api');assert.equal(value.SERVER_BASE_URL,'https://api.example.invalid');assert.equal(value.getApiConfigurationError(),null);
});
test('HTTP development requires explicit opt-in',()=>{
 assert.equal(configuration({EXPO_PUBLIC_API_URL:'http://127.0.0.1:5044/api'},true).API_URL,'');
 const value=configuration({EXPO_PUBLIC_API_URL:'http://192.168.100.13:5044/api',EXPO_PUBLIC_ALLOW_LOCAL_HTTP:'true'},true);assert.equal(value.SERVER_BASE_URL,'http://192.168.100.13:5044');
});
test('release validator rejects missing HTTP and credentialed endpoints',()=>{
 const {requireHttpsApi}=require('../scripts/validate-release-api.cjs');
 for(const value of ['',undefined,'http://localhost/api','https://user:secret@example.invalid/api'])assert.throws(()=>requireHttpsApi(value),/Release blocked/);
 assert.equal(requireHttpsApi('https://api.example.invalid/api/'),'https://api.example.invalid/api');
});
test('native release disables cleartext and requires HTTPS while explicit development remains available',()=>{
 const configure=require('../app.config.js');const config=JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo;
 const keys=['EAS_BUILD_PROFILE','NODE_ENV','EXPO_PUBLIC_API_URL','VITE_API_URL','EXPO_PUBLIC_ALLOW_LOCAL_HTTP'];const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try {
  process.env.EAS_BUILD_PROFILE='production';process.env.NODE_ENV='production';process.env.EXPO_PUBLIC_API_URL='http://localhost:5044/api';assert.throws(()=>configure({config}),/Release blocked/);
  process.env.EXPO_PUBLIC_API_URL='https://api.example.invalid/api';const release=configure({config});assert.equal(release.android.usesCleartextTraffic,false);assert.equal(release.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads,false);assert.equal(release.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-build-properties')[1].android.usesCleartextTraffic,false);
  process.env.EAS_BUILD_PROFILE='development';process.env.EXPO_PUBLIC_API_URL='http://127.0.0.1:5044/api';assert.equal(configure({config}).android.usesCleartextTraffic,true);
 } finally {for(const key of keys)if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
});
test('release profiles and OTA have no hardcoded HTTP fallback and retain approval gates',()=>{
 const eas=JSON.parse(readFileSync(new URL('../eas.json',import.meta.url),'utf8'));for(const key of ['production','preview'])assert.equal(eas.build[key].env.EXPO_PUBLIC_API_URL,undefined);
 const workflow=readFileSync(new URL('../.github/workflows/production.yml',import.meta.url),'utf8');assert.doesNotMatch(workflow,/http:\/\//);assert.match(workflow,/needs: \[validate, release-approval\]/);assert.match(workflow,/vars.EXPO_PUBLIC_API_URL/);assert.match(workflow,/validate-release-api.cjs/);
 const signalr=readFileSync(new URL('../services/signalr.ts',import.meta.url),'utf8');assert.doesNotMatch(signalr,/http:\/\/54/);assert.match(signalr,/getApiConfigurationError/);
});

test('runtime and release validators agree on malformed roots, authority and API path', () => {
 const { requireHttpsApi } = require('../scripts/validate-release-api.cjs');
 for (const url of ['https:api.example.invalid/api','https://api.example.invalid','https://api.example.invalid/wrong','https://api.example.invalid/api?','https://api.example.invalid/api#','https://api.example.invalid\\api','https://api.\nexample.invalid/api']) {
  assert.equal(configuration({EXPO_PUBLIC_API_URL:url}).API_URL,'');
  assert.throws(()=>requireHttpsApi(url), /Release blocked/);
 }
});
