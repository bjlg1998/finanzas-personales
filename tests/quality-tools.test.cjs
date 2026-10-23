const test = require('node:test');
const assert = require('node:assert/strict');
const {inventoryComponents, audit} = require('../scripts/audit-native.cjs');
const {summarizeFrames} = require('../scripts/performance.cjs');

test('native inventory deduplicates versions but preserves runtime/tooling scope', () => {
  const components = inventoryComponents({schemaVersion: 1, components: [
    {scope: 'release', name: 'group:module', version: '1.0'},
    {scope: 'tooling', name: 'group:module', version: '1.0'}
  ]});
  assert.equal(components.length, 1);
  assert.deepEqual(components[0].scopes, ['release', 'tooling']);
  assert.throws(() => inventoryComponents({schemaVersion: 1, components: []}));
});

test('native audit follows pagination and reports findings without filtering severities', async () => {
  let calls = 0;
  const result = await audit([{name: 'g:m', version: '1', scopes: ['release']}], async body => {
    calls++;
    if (calls === 1) return {results: [{vulns: [{id: 'GHSA-first'}], next_page_token: 'next'}]};
    assert.equal(body.queries[0].page_token, 'next');
    return {results: [{vulns: [{id: 'GHSA-second'}]}]};
  });
  assert.equal(result.length, 2);
  assert.equal(calls, 2);
});

test('incomplete or failed vulnerability queries never count as a successful clean scan', async () => {
  const components = [{name: 'g:m', version: '1'}];
  await assert.rejects(audit(components, async () => ({results: []})), /incompleta/);
  await assert.rejects(audit(components, async () => ({results: [{error: 'failed'}]})), /inválida/);
  await assert.rejects(audit(components, async () => {throw new Error('offline');}), /offline/);
});

test('frame parser uses actual frame deadlines rather than a fixed 60 or 120 Hz assumption', () => {
  const result = summarizeFrames('Flags,IntendedVsync,FrameDeadline,FrameCompleted,\n0,100000000,108333333,109000000,\n0,200000000,216666667,212000000,\n1,300000000,308333333,350000000,\n0,400000000,408333333,9223372036854775807,');
  assert.equal(result.frames, 2);
  assert.equal(result.p50Ms, 9);
  assert.equal(result.p95Ms, 12);
  assert.equal(result.missedDeadlinePercent, 50);
});

test('empty and legacy frame reports do not invent missing measurements', () => {
  assert.equal(summarizeFrames('').p95Ms, null);
  const result = summarizeFrames('Flags,IntendedVsync,FrameCompleted\n0,100000000,110000000');
  assert.equal(result.frames, 1);
  assert.equal(result.missedDeadlinePercent, null);
});
