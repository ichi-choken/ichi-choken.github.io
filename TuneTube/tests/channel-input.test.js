import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChannelInput } from '../js/channel-input.js';

const ID = 'UCabcdefghijklmnopqrstuv'; // UC + 22文字

test('@ハンドル', () => {
  assert.deepEqual(parseChannelInput('@example'), { kind: 'handle', value: 'example' });
  assert.deepEqual(parseChannelInput('https://www.youtube.com/@example/videos'), { kind: 'handle', value: 'example' });
});

test('日本語のハンドル（URLエンコード）', () => {
  assert.deepEqual(parseChannelInput('https://www.youtube.com/@%E3%81%82%E3%81%84'), { kind: 'handle', value: 'あい' });
});

test('チャンネルID', () => {
  assert.deepEqual(parseChannelInput(ID), { kind: 'id', value: ID });
  assert.deepEqual(parseChannelInput(`https://www.youtube.com/channel/${ID}`), { kind: 'id', value: ID });
});

test('@なしのハンドル', () => {
  assert.deepEqual(parseChannelInput('example'), { kind: 'handle', value: 'example' });
});

test('解釈できない入力', () => {
  assert.equal(parseChannelInput(''), null);
  assert.equal(parseChannelInput('https://www.youtube.com/watch?v=abc'), null);
});
