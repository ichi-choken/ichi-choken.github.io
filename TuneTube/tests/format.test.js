import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtCount, fmtDuration, fmtMinutes, fmtSubscribers, parseDuration } from '../js/format.js';

test('ISO 8601 の長さを秒にする', () => {
  assert.equal(parseDuration('PT45S'), 45);
  assert.equal(parseDuration('PT3M'), 180);
  assert.equal(parseDuration('PT1H2M3S'), 3723);
  assert.equal(parseDuration('P1DT1S'), 86401);
  assert.equal(parseDuration('P0D'), 0);
  assert.equal(parseDuration('bad'), 0);
});

test('長さの表示', () => {
  assert.equal(fmtDuration(0), 'ライブ');
  assert.equal(fmtDuration(65), '1:05');
  assert.equal(fmtDuration(3723), '1:02:03');
});

test('再生回数の表示', () => {
  assert.equal(fmtCount('999'), '999回');
  assert.equal(fmtCount('12000'), '1.2万回');
  assert.equal(fmtCount('100000000'), '1億回');
});

test('分の表示', () => {
  assert.equal(fmtMinutes(125), '2分');
});

test('登録者数の表示', () => {
  assert.equal(fmtSubscribers('1234'), '登録者 1234人');
  assert.equal(fmtSubscribers('1230000'), '登録者 123万人');
  assert.equal(fmtSubscribers('15000'), '登録者 1.5万人');
  assert.equal(fmtSubscribers('250000000'), '登録者 2.5億人');
  assert.equal(fmtSubscribers(null), '');
});
