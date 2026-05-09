// ═══════════════════════════════════════════════════════════════
// TYRO STOCK — Satış Tahmini Modülü
// Pure JS, dependency yok. Tarayıcıda 36 aylık seri için <100ms.
//
// Modeller:
//   - Holt-Winters Triple Exponential Smoothing (multiplicative seasonal)
//   - STL+ETS (basit klasik dekompozisyon + ETS extrapolation)
//   - Seasonal Naive
//   - Croston / TSB (intermittent demand)
//   - Moving Average (3 aylık)
// Yardımcılar:
//   - aggregateMonthly, buildTraderProfile, backtestMAPE, selectBestFit
// ═══════════════════════════════════════════════════════════════

// ──────────────── Utility ─────────────────────────────────────

export const sum = a => a.reduce((s, x) => s + x, 0);
const mean = a => (a.length ? sum(a) / a.length : 0);
const std = a => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1));
};

// 'YYYY-MM' formatlı ay anahtarı, JS Date'ten
function ymKey(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d)) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// 'YYYY-MM' → JS Date (UTC, ayın ilk günü)
function keyToDate(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

// 'YYYY-MM' anahtarına n ay ekle, yeni anahtar döndür
function addMonths(key, n) {
  const d = keyToDate(key);
  d.setUTCMonth(d.getUTCMonth() + n);
  return ymKey(d);
}

// İki YM key arasındaki ay farkı
function monthsBetween(fromKey, toKey) {
  const a = keyToDate(fromKey), b = keyToDate(toKey);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

// ──────────────── Aggregate ───────────────────────────────────

// Raw historical-sales rows → aylık aggregate map
// rows: [{mserp_quantity, mserp_amountmst, mserp_shipdate, ...}, ...]
// Tutar alanı yoksa value: null
export function aggregateMonthly(rows, opts = {}) {
  const valueField = opts.valueField || null;  // 'mserp_amountmst' vb. veya null
  const dateField = opts.dateField || 'mserp_shipdate';
  const qtyField = opts.qtyField || 'mserp_quantity';

  const m = {};
  for (const r of rows) {
    const key = ymKey(r[dateField]);
    if (!key) continue;
    if (!m[key]) m[key] = { qty: 0, value: 0, count: 0, hasValue: false };
    const q = Number(r[qtyField]) || 0;
    m[key].qty += q;
    m[key].count += 1;
    if (valueField && r[valueField] != null && r[valueField] !== '') {
      m[key].value += Number(r[valueField]) || 0;
      m[key].hasValue = true;
    }
  }
  return m;
}

// Aggregate map'i sıralı seri'ye çevir (ay arasındaki boşlukları sıfırla doldurur)
// Returns: { keys: ['2022-01',...], qty: [n,n,...], value: [n,n,...] | null, valueAvailable: bool }
export function mapToSeries(aggMap) {
  const keys = Object.keys(aggMap).sort();
  if (keys.length === 0) return { keys: [], qty: [], value: null, valueAvailable: false };

  // Boşlukları doldur — ilk aydan son aya kadar her ay için varsa al, yoksa 0
  const filled = [];
  let cur = keys[0];
  const last = keys[keys.length - 1];
  while (cur && cur <= last) {
    filled.push(cur);
    cur = addMonths(cur, 1);
  }

  const qty = filled.map(k => (aggMap[k]?.qty ?? 0));
  const valueAvailable = Object.values(aggMap).some(v => v.hasValue);
  const value = valueAvailable ? filled.map(k => (aggMap[k]?.value ?? 0)) : null;

  return { keys: filled, qty, value, valueAvailable };
}

// ──────────────── Holt-Winters Triple Exponential Smoothing ──

// Damped Holt-Winters — additive ve multiplicative iki varyantı dener, en iyi SSE'liyi seçer.
// Period = 12 (yıllık mevsim). Trend damping φ ile uzun vadede şişmeyi önler.
// Sıfır içeren serilerde additive variant otomatik tercih edilir (multiplicative bozulur).

function fitHWAdditive(y, m = 12) {
  if (y.length < m * 2) return null;
  const initLevel = mean(y.slice(0, m));
  const initTrend = (mean(y.slice(m, 2 * m)) - initLevel) / m;
  const initSeas = [];
  for (let i = 0; i < m; i++) initSeas.push(y[i] - initLevel);
  // Mevsim indekslerini sıfır toplamına normalize et
  const seasMean = mean(initSeas);
  for (let i = 0; i < m; i++) initSeas[i] -= seasMean;
  const grid = [0.05, 0.1, 0.2, 0.3];
  const phiGrid = [0.92, 0.96, 1.0];
  let best = null;
  for (const alpha of grid) for (const beta of grid) for (const gamma of grid) for (const phi of phiGrid) {
    const fit = applyHWAdd(y, m, initLevel, initTrend, initSeas, alpha, beta, gamma, phi);
    if (!best || fit.sse < best.sse) best = fit;
  }
  return best;
}
function applyHWAdd(y, m, L0, T0, S0, alpha, beta, gamma, phi) {
  let L = L0, T = T0;
  const S = [...S0];
  const fitted = new Array(y.length);
  let sse = 0;
  for (let t = 0; t < y.length; t++) {
    const sIdx = t % m;
    const sPrev = S[sIdx];
    const yhat = L + phi * T + sPrev;
    fitted[t] = yhat;
    sse += (y[t] - yhat) ** 2;
    const newL = alpha * (y[t] - sPrev) + (1 - alpha) * (L + phi * T);
    const newT = beta * (newL - L) + (1 - beta) * phi * T;
    const newS = gamma * (y[t] - newL) + (1 - gamma) * sPrev;
    L = newL; T = newT; S[sIdx] = newS;
  }
  return { L, T, S, fitted, sse, alpha, beta, gamma, phi, m, kind: 'add' };
}

function fitHWMultiplicative(y, m = 12) {
  if (y.length < m * 2) return null;
  // Multiplicative sadece tüm değerler pozitifse anlamlı — sıfır ay varsa skip
  const allPositive = y.every(v => v > 0);
  if (!allPositive) return null;
  const initLevel = mean(y.slice(0, m));
  if (initLevel <= 0) return null;
  const initTrend = (mean(y.slice(m, 2 * m)) - initLevel) / m;
  const initSeas = [];
  for (let i = 0; i < m; i++) initSeas.push(y[i] / initLevel);
  const grid = [0.05, 0.1, 0.2, 0.3];
  const phiGrid = [0.92, 0.96, 1.0];
  let best = null;
  for (const alpha of grid) for (const beta of grid) for (const gamma of grid) for (const phi of phiGrid) {
    const fit = applyHWMul(y, m, initLevel, initTrend, initSeas, alpha, beta, gamma, phi);
    if (!best || fit.sse < best.sse) best = fit;
  }
  return best;
}
function applyHWMul(y, m, L0, T0, S0, alpha, beta, gamma, phi) {
  let L = L0, T = T0;
  const S = [...S0];
  const fitted = new Array(y.length);
  let sse = 0;
  for (let t = 0; t < y.length; t++) {
    const sIdx = t % m;
    const sPrev = S[sIdx];
    const yhat = (L + phi * T) * sPrev;
    fitted[t] = yhat;
    sse += (y[t] - yhat) ** 2;
    const newL = sPrev > 0 ? alpha * (y[t] / sPrev) + (1 - alpha) * (L + phi * T) : (L + phi * T);
    const newT = beta * (newL - L) + (1 - beta) * phi * T;
    const newS = newL > 0 ? gamma * (y[t] / newL) + (1 - gamma) * sPrev : sPrev;
    L = newL; T = newT; S[sIdx] = newS;
  }
  return { L, T, S, fitted, sse, alpha, beta, gamma, phi, m, kind: 'mul' };
}

function projectHW(fit, h) {
  if (!fit) return null;
  const out = new Array(h);
  // Damped trend için: T toplamı φ + φ² + ... + φ^h = φ(1-φ^h)/(1-φ); φ=1 ise = h
  for (let i = 1; i <= h; i++) {
    const trendSum = fit.phi >= 1 ? i * fit.T : fit.T * fit.phi * (1 - Math.pow(fit.phi, i)) / (1 - fit.phi);
    const sIdx = (fit.fitted.length + i - 1) % fit.m;
    if (fit.kind === 'mul') {
      out[i - 1] = (fit.L + trendSum) * fit.S[sIdx];
    } else {
      out[i - 1] = fit.L + trendSum + fit.S[sIdx];
    }
  }
  return out;
}

export function forecastHoltWinters(series, h) {
  const fitAdd = fitHWAdditive(series, 12);
  const fitMul = fitHWMultiplicative(series, 12);
  // İkisini karşılaştır, daha düşük SSE'li olanı al
  let fit = null;
  if (fitAdd && fitMul) fit = fitAdd.sse <= fitMul.sse ? fitAdd : fitMul;
  else fit = fitAdd || fitMul;
  if (!fit) return forecastSeasonalNaive(series, h);  // fallback
  const point = projectHW(fit, h).map(x => Math.max(0, x));
  // Sanity check: forecast tarihçenin maksimumunun 3 katından büyükse muhtemelen patladı
  const histMax = Math.max(...series, 1);
  const sane = point.every(p => p <= histMax * 3);
  if (!sane) return forecastSeasonalNaive(series, h);  // güvenlik fallback
  const residuals = series.map((y, i) => y - fit.fitted[i]);
  const sd = std(residuals);
  const ci = point.map((p, i) => 1.96 * sd * Math.sqrt(i + 1));
  return {
    point,
    lower: point.map((p, i) => Math.max(0, p - ci[i])),
    upper: point.map((p, i) => p + ci[i]),
    fitted: fit.fitted,
    params: { alpha: fit.alpha, beta: fit.beta, gamma: fit.gamma, phi: fit.phi, kind: fit.kind },
  };
}

// ──────────────── STL+ETS (basit klasik dekompozisyon) ───────

// Klasik additive decomposition: trend (centered MA-12) + seasonal (mean per month) + residual
// Trend uzantısı: lineer regresyon; seasonal: sezon indeksini tekrarla
export function forecastSTLETS(series, h) {
  const n = series.length;
  const m = 12;
  if (n < m * 2) return forecastSeasonalNaive(series, h);

  // 1. Trend: centered moving average (m=12). 12'lik MA için 6'lı yumuşatma
  const trend = new Array(n).fill(null);
  for (let i = 6; i < n - 6; i++) {
    let s = 0;
    for (let j = -5; j <= 6; j++) s += series[i + j];
    s -= series[i - 5] * 0.5 + series[i + 6] * 0.5;  // centered correction
    trend[i] = s / m;
  }
  // Trend kenarlarını lineer extrapolasyonla doldur
  const validIdx = trend.map((v, i) => v != null ? i : -1).filter(i => i >= 0);
  if (validIdx.length < 2) return forecastSeasonalNaive(series, h);
  const t1 = validIdx[0], t2 = validIdx[validIdx.length - 1];
  const slope = (trend[t2] - trend[t1]) / (t2 - t1);
  for (let i = 0; i < t1; i++) trend[i] = trend[t1] - slope * (t1 - i);
  for (let i = t2 + 1; i < n; i++) trend[i] = trend[t2] + slope * (i - t2);

  // 2. Detrended series
  const detrended = series.map((y, i) => y - trend[i]);

  // 3. Seasonal index (her ay için ortalama detrended değer)
  const seasIdx = new Array(m).fill(0);
  const seasCount = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    const k = i % m;
    seasIdx[k] += detrended[i];
    seasCount[k] += 1;
  }
  for (let k = 0; k < m; k++) seasIdx[k] /= (seasCount[k] || 1);
  // Mevsim indekslerini sıfırla normalize et (toplamı 0)
  const seasMean = mean(seasIdx);
  for (let k = 0; k < m; k++) seasIdx[k] -= seasMean;

  // 4. Forecast: trend (lineer extrapolasyon) + seasonal index + residual yokmuş gibi 0
  const lastTrend = trend[n - 1];
  const point = [];
  for (let i = 0; i < h; i++) {
    const trendF = lastTrend + slope * (i + 1);
    const seasF = seasIdx[(n + i) % m];
    point.push(Math.max(0, trendF + seasF));
  }

  // CI: residual stdev
  const fitted = series.map((_, i) => trend[i] + seasIdx[i % m]);
  const residuals = series.map((y, i) => y - fitted[i]);
  const sd = std(residuals);
  const ci = point.map((_, i) => 1.96 * sd * Math.sqrt(i + 1));

  return {
    point,
    lower: point.map((p, i) => Math.max(0, p - ci[i])),
    upper: point.map((p, i) => p + ci[i]),
    fitted,
    params: { trendSlope: slope },
  };
}

// ──────────────── Seasonal Naive ──────────────────────────────

export function forecastSeasonalNaive(series, h) {
  const n = series.length;
  const m = 12;
  if (n === 0) return { point: new Array(h).fill(0), lower: new Array(h).fill(0), upper: new Array(h).fill(0), fitted: [], params: {} };

  const point = new Array(h);
  for (let i = 0; i < h; i++) {
    // Geçen yılın aynı ayı (n-m+i)
    const idx = n - m + i;
    if (idx >= 0 && idx < n) point[i] = series[idx];
    else point[i] = series[n - 1];  // fallback son değer
  }

  // Fitted: her i için series[i-m] (varsa)
  const fitted = series.map((_, i) => i >= m ? series[i - m] : series[i]);
  const residuals = series.slice(m).map((y, i) => y - fitted[i + m]);
  const sd = std(residuals);
  const ci = point.map((_, i) => 1.96 * sd * Math.sqrt(Math.floor(i / m) + 1));

  return {
    point,
    lower: point.map((p, i) => Math.max(0, p - ci[i])),
    upper: point.map((p, i) => p + ci[i]),
    fitted,
    params: {},
  };
}

// ──────────────── Croston (TSB variant) ───────────────────────

// Intermittent demand için. α'yı 0.1-0.3 arası optimize eder.
export function forecastCroston(series, h) {
  const n = series.length;
  if (n === 0) return { point: new Array(h).fill(0), lower: new Array(h).fill(0), upper: new Array(h).fill(0), fitted: [], params: {} };

  // Α grid search
  const alphas = [0.1, 0.15, 0.2, 0.25, 0.3];
  let best = null;
  for (const alpha of alphas) {
    const fit = applyCroston(series, alpha);
    if (!best || fit.sse < best.sse) best = fit;
  }

  const forecast = best.lastForecast;  // Croston output sabit (level forecast)
  const point = new Array(h).fill(Math.max(0, forecast));
  const sd = std(best.fitted.map((f, i) => series[i] - f));
  const ci = point.map((_, i) => 1.96 * sd * Math.sqrt(i + 1));

  return {
    point,
    lower: point.map((p, i) => Math.max(0, p - ci[i])),
    upper: point.map((p, i) => p + ci[i]),
    fitted: best.fitted,
    params: { alpha: best.alpha },
  };
}

function applyCroston(series, alpha) {
  // İki seri tut: Z (sıfır olmayan demand'in kademeli ortalaması), P (zaman aralığı)
  let Z = 0, P = 1;
  let lastNonzeroIdx = -1;
  let initialized = false;
  const fitted = new Array(series.length).fill(0);
  let sse = 0;

  for (let t = 0; t < series.length; t++) {
    const yt = series[t];
    if (yt > 0) {
      if (!initialized) {
        Z = yt;
        P = lastNonzeroIdx === -1 ? 1 : (t - lastNonzeroIdx);
        initialized = true;
      } else {
        const interval = lastNonzeroIdx === -1 ? 1 : (t - lastNonzeroIdx);
        Z = alpha * yt + (1 - alpha) * Z;
        P = alpha * interval + (1 - alpha) * P;
      }
      lastNonzeroIdx = t;
    }
    const f = P > 0 ? Z / P : 0;
    fitted[t] = f;
    sse += (yt - f) ** 2;
  }
  return { Z, P, lastForecast: P > 0 ? Z / P : 0, fitted, sse, alpha };
}

// ──────────────── Moving Average ──────────────────────────────

export function forecastMovingAverage(series, h, window = 3) {
  const n = series.length;
  if (n < window) return forecastSeasonalNaive(series, h);

  const lastAvg = mean(series.slice(-window));
  const point = new Array(h).fill(Math.max(0, lastAvg));

  // Fitted: her i için son window'un ortalaması
  const fitted = series.map((_, i) => i >= window ? mean(series.slice(i - window, i)) : series[i]);
  const residuals = series.slice(window).map((y, i) => y - fitted[i + window]);
  const sd = std(residuals);
  const ci = point.map((_, i) => 1.96 * sd * Math.sqrt(i + 1));

  return {
    point,
    lower: point.map((p, i) => Math.max(0, p - ci[i])),
    upper: point.map((p, i) => p + ci[i]),
    fitted,
    params: { window },
  };
}

// ──────────────── Backtest (MAPE) ─────────────────────────────

// Son `holdout` ayı sakla, geri kalanla eğit, sakladığını tahmin et, MAPE hesapla
// modelFn: (series, h) => { point, ... }
export function backtestMAPE(modelFn, series, holdout = 6) {
  if (series.length < holdout + 12) return null;  // anlamlı backtest için yetersiz
  const train = series.slice(0, -holdout);
  const test = series.slice(-holdout);
  const result = modelFn(train, holdout);
  if (!result || !result.point) return null;

  let sumPctError = 0, count = 0;
  for (let i = 0; i < holdout; i++) {
    const actual = test[i];
    const pred = result.point[i];
    const denom = Math.max(Math.abs(actual), 1);  // sıfır koruması
    sumPctError += Math.abs(actual - pred) / denom;
    count++;
  }
  return count > 0 ? (sumPctError / count) * 100 : null;
}

// ──────────────── Best Fit selector ───────────────────────────

// Tüm modelleri çalıştır, MAPE'leri hesapla, en düşük MAPE'liyi seç
export function selectBestFit(series, h) {
  const intermittence = (series.filter(x => x > 0).length / series.length);
  const isIntermittent = intermittence < 0.6;

  const models = [
    { id: 'hw', label: 'Holt-Winters', fn: (s, hh) => forecastHoltWinters(s, hh) },
    { id: 'stl', label: 'STL+ETS', fn: (s, hh) => forecastSTLETS(s, hh) },
    { id: 'snaive', label: 'Seasonal Naive', fn: (s, hh) => forecastSeasonalNaive(s, hh) },
    { id: 'croston', label: 'Croston', fn: (s, hh) => forecastCroston(s, hh), onlyIfIntermittent: true },
    { id: 'ma3', label: 'Moving Avg (3)', fn: (s, hh) => forecastMovingAverage(s, hh, 3) },
  ];

  const results = [];
  for (const m of models) {
    if (m.onlyIfIntermittent && !isIntermittent) {
      results.push({ id: m.id, label: m.label, mape: null, forecast: null, skipped: true, reason: 'Seri intermittent değil' });
      continue;
    }
    try {
      const forecast = m.fn(series, h);
      const mape = backtestMAPE(m.fn, series, Math.min(6, Math.floor(series.length / 6)));
      results.push({ id: m.id, label: m.label, mape, forecast, skipped: false });
    } catch (e) {
      results.push({ id: m.id, label: m.label, mape: null, forecast: null, skipped: true, reason: e.message });
    }
  }

  // En düşük MAPE'li (null hariç) en iyi
  const ranked = results.filter(r => !r.skipped && r.mape != null).sort((a, b) => a.mape - b.mape);
  const bestId = ranked.length > 0 ? ranked[0].id : (isIntermittent ? 'croston' : 'hw');
  return { bestId, results, intermittence, isIntermittent };
}

// ──────────────── Trader Profile ──────────────────────────────

// rows: raw historical-sales records
// gGrpFn: (companyCode) => groupName (App.jsx'ten gGrp fonksiyonu)
// monthlyAgg: aggregateMonthly() çıktısı (zaten hesaplanmış)
export function buildTraderProfile(rows, gGrpFn, monthlyAgg) {
  const totalRows = rows.length;
  if (totalRows === 0) {
    return {
      mainGroup: '-',
      topCompanies: [],
      topProducts: [],
      topDestinations: [],
      totals: { qty: 0, value: 0, count: 0 },
      lastYearTotals: { qty: 0, value: 0 },
      yoy: null,
      intermittenceIndex: 0,
      character: '-',
    };
  }

  // Grup şirket: salesdataareaid'den (mserp_salesdataareaid: 'dthy', 'dane' gibi)
  // gGrpFn beklenen çıktı: 'Tiryaki Anadolu' vb. — companyCode CGRP key formatında olmalı (büyük harf)
  const grpCounts = {};
  const compCounts = {};
  const prodCounts = {};
  const destCounts = {};
  let totalQty = 0, totalValue = 0, totalCount = 0;

  for (const r of rows) {
    const co = String(r.mserp_salesdataareaid || '').toUpperCase().trim();
    const grp = gGrpFn ? gGrpFn(co) : 'Diğer';
    grpCounts[grp] = (grpCounts[grp] || 0) + (Number(r.mserp_quantity) || 0);
    compCounts[co] = (compCounts[co] || 0) + (Number(r.mserp_quantity) || 0);

    const p = String(r.mserp_productid || '').trim();
    if (p) prodCounts[p] = (prodCounts[p] || 0) + (Number(r.mserp_quantity) || 0);

    const d = String(r.mserp_toaccountid || '').trim();
    if (d) destCounts[d] = (destCounts[d] || 0) + (Number(r.mserp_quantity) || 0);

    totalQty += Number(r.mserp_quantity) || 0;
    if (r.mserp_amountmst != null) totalValue += Number(r.mserp_amountmst) || 0;
    totalCount += 1;
  }

  const mainGroup = Object.entries(grpCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Diğer';
  const topCompanies = Object.entries(compCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([n, q]) => ({ name: n, qty: q, pct: totalQty > 0 ? (q / totalQty * 100) : 0 }));
  const topProducts = Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, q]) => ({ name: n, qty: q, pct: totalQty > 0 ? (q / totalQty * 100) : 0 }));
  const topDestinations = Object.entries(destCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, q]) => ({ name: n, qty: q, pct: totalQty > 0 ? (q / totalQty * 100) : 0 }));

  // Son 12 ay vs önceki 12 ay (YoY)
  const keys = Object.keys(monthlyAgg).sort();
  const last12Keys = keys.slice(-12);
  const prev12Keys = keys.slice(-24, -12);
  const last12Qty = sum(last12Keys.map(k => monthlyAgg[k]?.qty || 0));
  const prev12Qty = sum(prev12Keys.map(k => monthlyAgg[k]?.qty || 0));
  const last12Value = sum(last12Keys.map(k => monthlyAgg[k]?.value || 0));
  const yoy = prev12Qty > 0 ? ((last12Qty - prev12Qty) / prev12Qty * 100) : null;

  // Intermittence: kaç ayda satış olmuş / toplam ay sayısı
  const filledMonths = keys.length;
  const monthsWithSales = keys.filter(k => (monthlyAgg[k]?.qty || 0) > 0).length;
  const intermittenceIndex = filledMonths > 0 ? (monthsWithSales / filledMonths) : 0;
  const character = intermittenceIndex >= 0.85 ? 'Stabil aylık akış'
    : intermittenceIndex >= 0.6 ? 'Düzensiz akış'
    : 'Lumpy / opportunistic';

  return {
    mainGroup,
    topCompanies,
    topProducts,
    topDestinations,
    totals: { qty: totalQty, value: totalValue, count: totalCount },
    lastYearTotals: { qty: last12Qty, value: last12Value },
    yoy,
    intermittenceIndex,
    character,
  };
}

// ──────────────── Public model registry ───────────────────────

// UI'da sekme listesi + hover detay panelleri için
export const FORECAST_MODELS = [
  {
    id: 'hw',
    label: 'Holt-Winters',
    short: 'Trend + yıllık mevsim',
    description: 'Üçlü üstel düzleme (Triple Exponential Smoothing) — seviye, trend ve yıllık mevsimselliği multiplicative olarak birlikte modelliyor. α/β/γ parametreleri grid search ile minimum hata noktasına optimize ediliyor.',
    strength: 'Yıllık mevsimsel desen + büyüme trendi olan stabil seriler için en güçlüsü. Ramazan-bayram gibi yıllık tekrar eden pikleri yakalar.',
    weakness: 'Yapısal kırılmalara (acquisition, kapanma) ve düzensiz/sıçramalı seriler için zayıf. En az 24 ay tarihçe gerekir.',
    whenToUse: 'Düzenli aylık satış akışı olan B2B trader\'lar (Sunrise, Tiryaki Anadolu domestic, Hasata B2C).',
    formula: 'L_t = α(y_t/S_{t-m}) + (1-α)(L_{t-1} + T_{t-1})',
  },
  {
    id: 'stl',
    label: 'STL+ETS',
    short: 'Dekompozisyon + extrapolasyon',
    description: 'Klasik dekompozisyon — seriyi trend (12-aylık merkezli MA), mevsimsel indeks ve residual\'a ayırır. Trend lineer regresyonla geleceğe taşınır, mevsim deseni tekrarlanır.',
    strength: 'Outlier\'lara (tek vessel sevkiyatı gibi anomaliler) HW\'den daha dayanıklı. Trend ve mevsimi görsel olarak ayrıştırabilirsin.',
    weakness: 'Lineer trend varsayımı — hızlı büyüyen/küçülen seriler için yanlı sonuç verebilir.',
    whenToUse: 'Outlier\'lı vessel-bazlı uluslararası trader\'lar (Mesopotamia, bazı Sunrise akışları).',
    formula: 'y_t = T_t + S_t + R_t  (additive decomposition)',
  },
  {
    id: 'snaive',
    label: 'Seasonal Naive',
    short: 'Geçen yıl aynı ay',
    description: '"Önümüzdeki Mayıs, geçen Mayıs gibi olur" varsayımı. m=12 ile her ay için bir önceki yılın aynı ayı tekrar edilir.',
    strength: 'Çok basit, zorla anlamlı bir baseline. Eğer diğer modeller bundan daha iyi çıkamıyorsa, modelimiz aslında bilgi katmıyor demektir.',
    weakness: 'Trend yok — büyüme veya küçülme trendi varsa düşük tahmin verir. Yapısal değişimi hiç yakalayamaz.',
    whenToUse: 'Stabil mevsimsel ürünler — bakliyat, organik feed gibi yıldan yıla benzer akışlar. Her zaman karşılaştırma için referans.',
    formula: 'ŷ_{t+h} = y_{t+h-12}',
  },
  {
    id: 'croston',
    label: 'Croston (TSB)',
    short: 'Lumpy / intermittent',
    description: 'Aralıklı/sıçramalı talep için özelleşmiş. Demand miktarı (Z) ve sıfır-olmayan satışlar arası süre (P) ayrı üstel düzleme ile takip edilir, tahmin Z/P olarak çıkar.',
    strength: 'Bazı aylarda satış olmayan trader\'lar için doğru olan tek model. HW veya naive bu seriler için resmen yanlış.',
    weakness: 'Yapısal olarak düz forecast verir — trend veya mevsim yakalayamaz. Düzenli serilerde HW\'den daima zayıf.',
    whenToUse: 'Vessel-temelli opportunistic trader\'lar (Mesopotamia FZE), 36 ayın <%60\'ında satış varsa otomatik olarak bu seçilir.',
    formula: 'ŷ = Ẑ / P̂  (level / interval)',
  },
  {
    id: 'ma3',
    label: 'Moving Avg (3)',
    short: 'Son 3 ay ortalaması',
    description: 'Son 3 ayın aritmetik ortalaması, geleceğe sabit olarak taşınır. En basit hareketli ortalama.',
    strength: 'Çok kararlı — kısa vadeli gürültüye dayanıklı. Hızlı trend değişikliklerini takip eder.',
    weakness: 'Mevsimsel desen yok, trend yok — uzun vadede tüm forecast düz çizgi. Yıllık mevsimi tamamen kaçırır.',
    whenToUse: 'Sadece son durum referansı için. Eğer best fit olarak çıkıyorsa, seri tahmin edilemez kadar gürültülü demektir.',
    formula: 'ŷ_{t+h} = (y_{t-2} + y_{t-1} + y_t) / 3',
  },
];
