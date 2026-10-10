// ===== この端末からのAPI使用量の目安（太平洋時間0時でリセット） =====
// 実際の枠はプロジェクト全体で共有されるため，正確な値は Google Cloud Console で確認する．
import { load, save } from './storage.js';

export interface QuotaUsage { day: string; units: number; searches: number }

function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export function getQuota(): QuotaUsage {
  const q = load<QuotaUsage>('quota', { day: '', units: 0, searches: 0 });
  return q.day === today() ? q : { day: today(), units: 0, searches: 0 };
}

export function addQuota(cost: { units?: number; search?: boolean }): void {
  const q = getQuota();
  q.units += cost.units ?? 0;
  if (cost.search) q.searches += 1;
  save('quota', q);
}
