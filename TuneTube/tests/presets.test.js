import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_CATEGORIES } from '../js/presets.js';

test('おすすめチャンネルのIDは UC + 22文字で，重複しない', () => {
  const ids = PRESET_CATEGORIES.flatMap((c) => c.channels.map((ch) => ch.id));
  for (const id of ids) assert.match(id, /^UC[\w-]{22}$/, id);
  assert.equal(new Set(ids).size, ids.length);
});

test('各カテゴリーにID・表示名・検索語・チャンネルがある', () => {
  const catIds = PRESET_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(catIds).size, catIds.length);
  for (const c of PRESET_CATEGORIES) {
    assert.ok(c.label && c.icon && c.keyword, c.id);
    assert.ok(c.channels.length >= 2 && c.channels.length <= 50, c.id); // channels.list 1回で取得できる件数
  }
});
