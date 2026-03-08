import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MSAL CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID;
const DATAVERSE_URL = import.meta.env.VITE_DATAVERSE_URL || 'https://operations-tiryaki.crm4.dynamics.com';
const ENTITY_NAME = import.meta.env.VITE_DATAVERSE_ENTITY || 'mserp_tryaiinventoryagingreportentities';

export const MSAL_ENABLED = !!(CLIENT_ID && TENANT_ID);

let msalInstance = null;

const msalConfig = {
  auth: {
    clientId: CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${TENANT_ID || ''}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
};

const loginRequest = { scopes: ['User.Read'] };
const dataverseScopes = { scopes: [`${DATAVERSE_URL}/.default`] };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MSAL INIT & AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function initMsal() {
  if (!MSAL_ENABLED) return null;
  if (msalInstance) return msalInstance;
  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  try { await msalInstance.handleRedirectPromise(); } catch (_) { /* redirect handled */ }
  return msalInstance;
}

export function getMsalInstance() { return msalInstance; }

export function getActiveAccount() {
  if (!msalInstance) return null;
  return msalInstance.getAllAccounts()[0] || null;
}

export async function loginPopup() {
  if (!msalInstance) await initMsal();
  const res = await msalInstance.loginPopup(loginRequest);
  return res.account;
}

export async function loginRedirect() {
  if (!msalInstance) await initMsal();
  await msalInstance.loginRedirect(loginRequest);
}

export async function logout(account) {
  if (!msalInstance) return;
  await msalInstance.logoutRedirect({ account, postLogoutRedirectUri: window.location.origin });
}

export async function getGraphToken(account) {
  try {
    const r = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      const r = await msalInstance.acquireTokenPopup(loginRequest);
      return r.accessToken;
    }
    throw e;
  }
}

export async function getDataverseToken(account) {
  try {
    const r = await msalInstance.acquireTokenSilent({ ...dataverseScopes, account });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      const r = await msalInstance.acquireTokenPopup(dataverseScopes);
      return r.accessToken;
    }
    throw e;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GRAPH API — User Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function fetchUserProfile(account) {
  const token = await getGraphToken(account);
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,jobTitle', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph API ${res.status}`);
  return res.json();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATAVERSE API — Entity Fetch
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const API_BASE = `${DATAVERSE_URL}/api/data/v9.2/${ENTITY_NAME}`;

const DV_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0',
  Accept: 'application/json',
  Prefer: 'odata.include-annotations="*"',
});

async function dvFetch(url, token, prefer) {
  const headers = { ...DV_HEADERS(token) };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch { /* ignore parse error */ }
    throw new Error(`Dataverse API ${res.status}: ${detail}`);
  }
  return res.json();
}

const DATE_FIELD = 'mserp_headerreportdate';

// Only fetch these fields from Dataverse (user-approved list)
const SELECT_FIELDS = [
  'mserp_inventcolorid','mserp_closingpricemst','mserp_purchlifo','mserp_purchpricemst',
  'mserp_amountmst','mserp_qty','mserp_itemname','mserp_headerreportdate','mserp_companyid',
  'mserp_etgproductlevel03name','mserp_sfilotid','mserp_purchweav','mserp_amountsec',
  'mserp_itemid','mserp_inventsizeid','mserp_inventdimension1','mserp_etgproductlevel02name',
  'mserp_inventlocationid','mserp_prodweav','mserp_purchfifo','mserp_purchpricesec',
  'mserp_prodfifo','mserp_prodlifo','mserp_vesselassignmentid','mserp_etgproductlevel01name',
  'mserp_inventsiteid','mserp_inventsitename','mserp_pricesec','mserp_companyname',
  'mserp_product','mserp_closingpricesec','mserp_pricemst','mserp_etgproductlevel04name',
  'mserp_inventbatchid','mserp_inventdimension2','mserp_inventlocationname',
].join(',');

// Fetch latest report date — $orderby desc, take top 1
export async function fetchLatestReportDate(token) {
  const url = `${API_BASE}?$orderby=${DATE_FIELD} desc&$top=1`;
  const data = await dvFetch(url, token);
  if (!data.value || data.value.length === 0) throw new Error('Entity boş — rapor verisi bulunamadı');
  const rawDate = data.value[0][DATE_FIELD];
  if (!rawDate) throw new Error('Rapor tarihi alanı boş');
  return rawDate;
}

// Convert raw Dataverse date to YYYY-MM-DD for OData filter
function toISODate(raw) {
  const s = String(raw);
  // Already ISO: 2024-10-20T00:00:00Z
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0];
  // US format from formatted value: 10/20/2024
  const parts = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) return `${parts[3]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
  // Try JS Date parse
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return s;
}

export async function fetchEntityByDate(token, reportDate, onProgress) {
  let allRecords = [];
  const isoDate = toISODate(reportDate);
  const url = `${API_BASE}?$select=${SELECT_FIELDS}&$filter=${DATE_FIELD} eq ${isoDate}&$count=true`;

  let nextUrl = url;
  while (nextUrl) {
    const data = await dvFetch(nextUrl, token, 'odata.include-annotations="*",odata.maxpagesize=5000');
    allRecords = allRecords.concat(data.value || []);
    if (onProgress) onProgress(allRecords.length, data['@odata.count']);
    nextUrl = data['@odata.nextLink'] || null;
  }
  return allRecords;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA MAPPING — Dataverse → App 33-column format
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dataverse → App 33-column mapping (confirmed from actual entity fields)
// L2-L5 code alanları Dataverse'de yok, sadece name alanları var
const FIELD_MAP = [
  { key: 'mserp_companyid',              type: 'string' },  // 0  Şirket Kodu
  { key: 'mserp_companyname',            type: 'string' },  // 1  Şirket Adı
  { key: 'mserp_itemid',                 type: 'string' },  // 2  Madde Kodu
  { key: 'mserp_itemname',               type: 'string' },  // 3  Ürün Adı
  { key: 'mserp_inventcolorid',          type: 'string' },  // 4  Menşe
  { key: 'mserp_sfilotid',               type: 'string' },  // 5  Proje No
  { key: 'mserp_inventdimension1',       type: 'string' },  // 6  Ambalaj
  { key: 'mserp_inventsizeid',           type: 'string' },  // 7  Gümrük
  { key: 'mserp_qty',                    type: 'int' },     // 8  Miktar
  { key: 'mserp_inventsiteid',           type: 'string' },  // 9  Tesis
  { key: 'mserp_inventsitename',         type: 'string' },  // 10 Tesis Adı
  { key: 'mserp_inventlocationid',       type: 'string' },  // 11 Depo
  { key: 'mserp_inventlocationname',     type: 'string' },  // 12 Ambar Adı
  { key: 'mserp_inventbatchid',          type: 'string' },  // 13 Parti No
  { key: 'mserp_vesselassignmentid',     type: 'string' },  // 14 L1
  { key: 'mserp_etgproductlevel01name',  type: 'string' },  // 15 L1 Adı
  { key: '_no_l2_code',                  type: 'string' },  // 16 L2 (Dataverse'de yok)
  { key: 'mserp_etgproductlevel02name',  type: 'string' },  // 17 L2 Adı
  { key: '_no_l3_code',                  type: 'string' },  // 18 L3 (Dataverse'de yok)
  { key: 'mserp_etgproductlevel03name',  type: 'string' },  // 19 L3 Adı
  { key: '_no_l4_code',                  type: 'string' },  // 20 L4 (Dataverse'de yok)
  { key: 'mserp_etgproductlevel04name',  type: 'string' },  // 21 L4 Adı
  { key: '_no_l5_code',                  type: 'string' },  // 22 L5 (Dataverse'de yok)
  { key: '_no_l5_name',                  type: 'string' },  // 23 L5 Adı (Dataverse'de yok)
  { key: 'mserp_pricemst',              type: 'decimal2' },// 24 Fiyat ₺
  { key: 'mserp_pricesec',              type: 'decimal4' },// 25 Fiyat $
  { key: 'mserp_purchweav',             type: 'decimal2' },// 26 PurchWEAV
  { key: 'mserp_purchfifo',             type: 'int' },     // 27 PurchFIFO (aging days)
  { key: 'mserp_purchlifo',             type: 'int' },     // 28 PurchLIFO
  { key: 'mserp_prodweav',              type: 'int' },     // 29 ProdWEAV
  { key: 'mserp_prodfifo',              type: 'int' },     // 30 ProdFIFO
  { key: 'mserp_prodlifo',              type: 'int' },     // 31 ProdLIFO
  { key: 'mserp_purchfifo',             type: 'int' },     // 32 Gün (= PurchFIFO)
];

function castValue(raw, type) {
  if (raw == null || raw === '') {
    return type === 'string' ? '' : 0;
  }
  switch (type) {
    case 'string': return String(raw);
    case 'int': return Math.round(Number(raw) || 0);
    case 'decimal2': return Math.round((Number(raw) || 0) * 100) / 100;
    case 'decimal4': return Math.round((Number(raw) || 0) * 10000) / 10000;
    default: return raw;
  }
}

export function mapToRows(records) {
  return records.map(rec =>
    FIELD_MAP.map(f => castValue(rec[f.key], f.type))
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVENIENCE — Full fetch pipeline
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function fetchErpData(account, onStatus) {
  onStatus?.('Dataverse token alınıyor...');
  const token = await getDataverseToken(account);

  onStatus?.('En son rapor tarihi aranıyor...');
  const reportDate = await fetchLatestReportDate(token);

  onStatus?.(`Veri çekiliyor (${toISODate(reportDate).split('-').reverse().join('.')})...`);
  const records = await fetchEntityByDate(token, reportDate, (loaded, total) => {
    onStatus?.(`Veri çekiliyor... ${loaded}${total ? ' / ' + total : ''} kayıt`);
  });

  onStatus?.('Veri dönüştürülüyor...');
  const rows = mapToRows(records);

  onStatus?.(`${rows.length} satır yüklendi`);
  return { rows, reportDate, recordCount: records.length, rawRecords: records };
}
