import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterVideos, isShortCandidate } from '../js/filters.js';

const v = (title, sec) => ({ id: title, title, sec, channelId: 'c', channel: 'c', published: '', thumb: '', views: '0', madeForKids: false, embeddable: true });

test('3分以下はショート候補', () => {
  assert.equal(isShortCandidate(v('a', 59)), true);
  assert.equal(isShortCandidate(v('a', 180)), true);
  assert.equal(isShortCandidate(v('a', 181)), false);
});

test('ライブ（長さ0）は除外しない', () => {
  assert.equal(isShortCandidate(v('live', 0)), false);
});

test('タイトルの #shorts は長さに関係なく候補', () => {
  assert.equal(isShortCandidate(v('猫 #shorts', 600)), true);
  assert.equal(isShortCandidate(v('猫 #Short', 600)), true);
  assert.equal(isShortCandidate(v('#shortstory の話', 600)), false);
});

test('フィルタOFFなら何も除外しない', () => {
  const list = [v('a', 30), v('b', 600)];
  assert.deepEqual(filterVideos(list, false), { kept: list, removed: 0 });
  const r = filterVideos(list, true);
  assert.equal(r.removed, 1);
  assert.equal(r.kept[0].title, 'b');
});
