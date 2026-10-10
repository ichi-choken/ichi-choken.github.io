// ===== YouTube Data API v3 =====
// 公式APIのみを使う（YouTubeサイトのスクレイピングはしない）．
import { CHANNEL_REFRESH_MS, CHANNEL_VIDEOS_PER_CHANNEL, SEARCH_MAX_RESULTS } from './config.js';
import { parseChannelInput } from './channel-input.js';
import { parseDuration } from './format.js';
import { addQuota } from './quota.js';
import { cacheGet, cacheSet } from './storage.js';
import type { Channel, Video } from './types.js';

const BASE = 'https://www.googleapis.com/youtube/v3/';

export class ApiError extends Error {}

interface Thumbs { default?: { url: string }; medium?: { url: string }; high?: { url: string } }

interface VideoItem {
  id: string;
  snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string; thumbnails: Thumbs };
  contentDetails: { duration: string };
  statistics?: { viewCount?: string };
  status?: { embeddable?: boolean; madeForKids?: boolean };
}

interface ChannelItem {
  id: string;
  snippet: { title: string; thumbnails: Thumbs };
  contentDetails: { relatedPlaylists: { uploads: string } };
}

async function call<T>(endpoint: string, params: Record<string, string>, key: string, cost: { units?: number; search?: boolean }): Promise<T> {
  const url = BASE + endpoint + '?' + new URLSearchParams({ ...params, key });
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError('通信できませんでした．ネット接続を確認してください．');
  }
  addQuota(cost); // 失敗したリクエストも枠を消費する
  const data = (await res.json().catch(() => ({}))) as { error?: { errors?: { reason?: string }[] } };
  if (!res.ok) {
    const reason = data.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
      throw new ApiError('今日のAPI使用量の上限に達しました．太平洋時間の0時（日本時間の16時または17時）以降に再度お試しください．');
    }
    if (reason === 'keyInvalid' || res.status === 400) throw new ApiError('APIキーが正しくない可能性があります．設定を確認してください．');
    if (res.status === 403) throw new ApiError('APIへのアクセスが拒否されました．APIキーの制限（リファラー）を確認してください．');
    throw new ApiError(`APIエラー（${res.status}）が発生しました．`);
  }
  return data as T;
}

function thumbOf(t: Thumbs): string {
  return (t.medium ?? t.high ?? t.default)?.url ?? '';
}

function toVideo(it: VideoItem): Video {
  return {
    id: it.id,
    title: it.snippet.title,
    channelId: it.snippet.channelId,
    channel: it.snippet.channelTitle,
    published: it.snippet.publishedAt,
    thumb: thumbOf(it.snippet.thumbnails),
    sec: parseDuration(it.contentDetails.duration),
    views: it.statistics?.viewCount ?? '0',
    madeForKids: it.status?.madeForKids ?? false,
    embeddable: it.status?.embeddable ?? true,
  };
}

/** 動画の詳細（長さ・埋め込み可否・子ども向け指定など）を50件ずつ取得する．各1ユニット． */
export async function fetchVideos(ids: string[], key: string): Promise<Video[]> {
  const out = new Map<string, Video>();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await call<{ items?: VideoItem[] }>('videos', {
      part: 'snippet,contentDetails,statistics,status',
      id: chunk.join(','),
    }, key, { units: 1 });
    for (const it of data.items ?? []) out.set(it.id, toVideo(it));
  }
  return ids.map((id) => out.get(id)).filter((v): v is Video => !!v);
}

function publishedBefore(period: string): string | null {
  const years = parseInt(period, 10);
  if (!years) return null;
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString();
}

/** キーワード検索．検索APIは1日100回の独立枠を使う． */
export async function searchVideos(q: string, order: string, period: string, key: string): Promise<Video[]> {
  const cacheKey = `search:${order}:${period}:${q}`;
  const hit = cacheGet<Video[]>(cacheKey);
  if (hit) return hit;
  const params: Record<string, string> = {
    part: 'snippet', type: 'video', maxResults: String(SEARCH_MAX_RESULTS), q, order,
    regionCode: 'JP', relevanceLanguage: 'ja', safeSearch: 'moderate',
  };
  const before = publishedBefore(period);
  if (before) params.publishedBefore = before;
  const data = await call<{ items?: { id?: { videoId?: string } }[] }>('search', params, key, { search: true });
  const ids = (data.items ?? []).map((i) => i.id?.videoId).filter((id): id is string => !!id);
  const videos = await fetchVideos(ids, key);
  cacheSet(cacheKey, videos);
  return videos;
}

function toChannel(it: ChannelItem): Channel {
  return {
    id: it.id,
    title: it.snippet.title,
    thumb: thumbOf(it.snippet.thumbnails),
    uploads: it.contentDetails.relatedPlaylists.uploads,
    fetchedAt: Date.now(),
  };
}

/** URL・@ハンドル・IDからチャンネルを特定する（検索APIを使わない．1ユニット）． */
export async function resolveChannel(input: string, key: string): Promise<Channel> {
  const ref = parseChannelInput(input);
  if (!ref) throw new ApiError('チャンネルのURL，@ハンドル，またはID（UCで始まる）を入力してください．');
  const params: Record<string, string> = { part: 'snippet,contentDetails' };
  if (ref.kind === 'id') params.id = ref.value; else params.forHandle = ref.value;
  const data = await call<{ items?: ChannelItem[] }>('channels', params, key, { units: 1 });
  const it = data.items?.[0];
  if (!it) throw new ApiError('チャンネルが見つかりませんでした．入力を確認してください．');
  return toChannel(it);
}

/** 名前・アイコンが古くなった登録チャンネルを再取得する（保存データを定期的に更新するため）． */
export async function refreshChannels(channels: Channel[], key: string): Promise<Channel[] | null> {
  const stale = channels.filter((c) => Date.now() - c.fetchedAt > CHANNEL_REFRESH_MS);
  if (!stale.length) return null;
  const fresh = new Map<string, Channel>();
  for (let i = 0; i < stale.length; i += 50) {
    const data = await call<{ items?: ChannelItem[] }>('channels', {
      part: 'snippet,contentDetails',
      id: stale.slice(i, i + 50).map((c) => c.id).join(','),
    }, key, { units: 1 });
    for (const it of data.items ?? []) fresh.set(it.id, toChannel(it));
  }
  return channels.map((c) => fresh.get(c.id) ?? c);
}

/** 登録チャンネルの最新動画（playlistItems.list＋videos.list で各1ユニット）． */
export async function channelVideos(ch: Channel, key: string): Promise<Video[]> {
  const cacheKey = `channel:${ch.id}`;
  const hit = cacheGet<Video[]>(cacheKey);
  if (hit) return hit;
  const data = await call<{ items?: { contentDetails?: { videoId?: string } }[] }>('playlistItems', {
    part: 'contentDetails',
    playlistId: ch.uploads,
    maxResults: String(CHANNEL_VIDEOS_PER_CHANNEL),
  }, key, { units: 1 });
  const ids = (data.items ?? []).map((i) => i.contentDetails?.videoId).filter((id): id is string => !!id);
  const videos = await fetchVideos(ids, key);
  cacheSet(cacheKey, videos);
  return videos;
}
