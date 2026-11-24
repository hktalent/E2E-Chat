/**
 * 频道列表持久缓存（跨重启、跨断网）。
 *
 * 目的：公共频道（含人数）列表在网络上很难稳定拿到，一旦某个网络/协议临时不可达，
 * 页面不应该变成空白 —— 用本地 JSON 快照兜底，最长 7 天（IM_CACHE_TTL_DAYS 可调）。
 *
 * 存放：<repo>/app/im/.cache/<key>.json（已在 .gitignore，不进仓库）
 * 结构：{ ts: 时间戳, items: [频道对象...] }
 */
const fs = require('fs');
const path = require('path');

const DIR = process.env.IM_CACHE_DIR || path.join(__dirname, '.cache');
const TTL_MS = Math.max(1, parseInt(process.env.IM_CACHE_TTL_DAYS || '7', 10)) * 24 * 60 * 60 * 1000;

function fileFor(key) {
  return path.join(DIR, String(key).replace(/[^a-zA-Z0-9._-]/g, '_') + '.json');
}

function save(key, items) {
  if (!Array.isArray(items) || !items.length) return; // 空列表不落盘，避免把「拿不到」当成有效快照
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const f = fileFor(key);
    const tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ ts: Date.now(), items }));
    fs.renameSync(tmp, f); // 原子替换，避免读到半截文件
  } catch (e) {
    console.warn('[im/cache] 写入失败 ' + key + ': ' + e.message);
  }
}

function load(key) {
  try {
    const f = fileFor(key);
    if (!fs.existsSync(f)) return null;
    const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!obj || !Array.isArray(obj.items) || !obj.items.length || !obj.ts) return null;
    if (Date.now() - obj.ts > TTL_MS) return null; // 超过 7 天视为失效
    return { ts: obj.ts, items: obj.items, ageMs: Date.now() - obj.ts };
  } catch (e) {
    console.warn('[im/cache] 读取失败 ' + key + ': ' + e.message);
    return null;
  }
}

/** 给缓存条目打上 stale 标记，前端可显示「缓存」角标 */
function markStale(items, ts) {
  return (items || []).map((it) => Object.assign({}, it, { stale: true, asOf: ts }));
}

function ttlDays() {
  return Math.round(TTL_MS / (24 * 60 * 60 * 1000));
}

function cacheDir() {
  return DIR;
}

module.exports = { save, load, markStale, ttlDays, cacheDir };
