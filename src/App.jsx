import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { Package, Clock, MapPin, BarChart3, TrendingUp, Building2, Database, Layers, ArrowUpDown, ChevronRight, Search, Plus, Trash2, Pencil, Upload, CheckCircle2, ChevronLeft, FileBarChart, Settings, Download, Globe, Palette, Info, Activity, LogOut, X, Briefcase, AlertTriangle, Zap, Target, ShieldAlert, Eye, MoreHorizontal, SlidersHorizontal, RotateCcw } from "lucide-react";
const TurkeyMap3D = lazy(() => import('./TurkeyMap3D'));
const WorldMap3D = lazy(() => import('./WorldMap3D'));
const LoginGlobe = lazy(() => import('./LoginGlobe'));
import { MSAL_ENABLED, initMsal, loginRedirect, logout, fetchErpData, fetchKPITrend, fetchHistoricalSalesByTrader, fetchHistoricalAggregatesByTrader, fetchTraderNames, getDataverseToken } from './dataverseService';
import { buildDataContext, askGemini, testGeminiKey } from './geminiService';
import { aggregateMonthly, aggregateFromServer, mapToSeries, selectBestFit, buildTraderProfile, buildTraderProfileFromAggregates, FORECAST_MODELS, sum as sumArr } from './salesForecast';

const INIT=[];
const DEMO=INIT;
const HDR=["Şirket Kodu","Şirket Adı","Madde Kodu","Ürün Adı","Menşe","Proje No","Ambalaj","Gümrük","Miktar","Tesis","Tesis Adı","Depo","Ambar Adı","Parti No","L1","L1 Adı","L2","L2 Adı","L3","L3 Adı","L4","L4 Adı","L5","L5 Adı","Fiyat ₺","Fiyat $","PurchWEAV","PurchFIFO","PurchLIFO","ProdWEAV","ProdFIFO","ProdLIFO","Gün","Proje ID","Trader","Ana Trader","Trader Adı","Ana Trader Adı"];
const NC=new Set([8,24,25,26,27,28,29,30,31,32]);
const CTM={"ADN":"Adana","ADP":"Adapazarı","BND":"Bandırma","BRS":"Bursa","CRM":"Çorum","EDN":"Edirne","GZT":"Gaziantep","GRS":"Giresun","HTY":"Hatay","ISK":"İskenderun","DTC":"İstanbul","DISTICARET":"İstanbul","IST":"İstanbul","IZM":"İzmir","KRM":"Karaman","KON":"Konya","MRS":"Mersin","MUS":"Muş","ORD":"Ordu","SMS":"Samsun","TKR":"Tekirdağ","KOC":"Kocaeli","TRB":"Trabzon","SILAM":"Samsun","TRY-BND":"Bandırma","TRY-CRM":"Çorum","TRY-DTS":"İstanbul","TRY-GYM":"Gaziantep","TRY-GZT":"Gaziantep","TRY-IST":"İstanbul","TRY-MRS":"Mersin","TRY-SLM":"Bandırma","TRY-SDN":"İstanbul","YLD-KON":"Konya","YLD-MUS":"Muş","YLD-TKD":"Tekirdağ"};
const CLL={"Adana":[37,35.33],"Adapazarı":[40.68,30.4],"Bandırma":[40.35,27.97],"Bursa":[40.19,29.06],"Çorum":[40.55,34.96],"Edirne":[41.68,26.56],"Gaziantep":[37.07,37.38],"Giresun":[40.91,38.39],"Hatay":[36.2,36.16],"İskenderun":[36.59,36.17],"İstanbul":[41.01,28.98],"İzmir":[38.42,27.14],"Karaman":[37.18,33.23],"Konya":[37.87,32.48],"Mersin":[36.81,34.64],"Muş":[38.74,41.49],"Ordu":[40.99,37.88],"Samsun":[41.29,36.33],"Tekirdağ":[41.0,27.52],"Kocaeli":[40.76,29.92],"Trabzon":[41.0,39.72]};
const fmt=n=>n>=1e12?(n/1e12).toFixed(1)+' Trilyon':n>=1e9?(n/1e9).toFixed(1)+' Milyar':n>=1e6?(n/1e6).toFixed(1)+' Milyon':n>=1e3?(n/1e3).toFixed(1)+' Bin':String(Math.round(n));
const fmtTon=n=>{const t=n/1000;return t>=1e6?(t/1e6).toFixed(1)+' Milyon Ton':t>=1e3?(t/1e3).toFixed(1)+' Bin Ton':t>=1?Math.round(t)+' Ton':fN(n)+' kg';};
const fN=n=>new Intl.NumberFormat('tr-TR').format(Math.round(n));
const arcFn=(cx,cy,r,s,e)=>{const sr=s*Math.PI/180,er=e*Math.PI/180;const x1=cx+r*Math.cos(sr),y1=cy+r*Math.sin(sr),x2=cx+r*Math.cos(er),y2=cy+r*Math.sin(er);const lg=e-s>180?1:0;return`M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2}`;};
const RL=[{k:'fresh',l:'Taze Stok',r:'0-60 gün',c:'#0d6e4f',bg:'rgba(45,212,160,.08)',fn:f=>f.a<60},{k:'normal',l:'Normal',r:'60-180 gün',c:'#f5a623',bg:'rgba(245,166,35,.06)',fn:f=>f.a>=60&&f.a<180},{k:'risky',l:'Riskli',r:'180-365 gün',c:'#ea580c',bg:'rgba(234,88,12,.06)',fn:f=>f.a>=180&&f.a<365},{k:'critical',l:'Kritik',r:'365+ gün',c:'#e5484d',bg:'rgba(229,72,77,.06)',fn:f=>f.a>=365}];
const ac=d=>d<60?'#0d6e4f':d<90?'#16a34a':d<180?'#f5a623':d<365?'#ea580c':'#e5484d';
const acBg=d=>d<60?'rgba(45,212,160,.1)':d<90?'rgba(22,163,74,.08)':d<180?'rgba(245,166,35,.08)':d<365?'rgba(234,88,12,.08)':'rgba(229,72,77,.08)';
const TI={own:{color:'#0d6e4f',label:'Öz Tesis'},fason:{color:'#8b5cf6',label:'Fason'},dis:{color:'#3b82f6',label:'Dış Tesis'},disticaret:{color:'#f5a623',label:'Dış Ticaret'}};
// Tesis adı override'ları — kod CTM/FCTM'de yanlış prefix'e eşlense bile ad üzerinden zorla doğru yere koy
// Eklendikçe burayı genişlet: rx tesis adında match ediyorsa city/country zorlanır
const FAC_NAME_OVERRIDES=[
  {rx:/\bTREBIL\b/i,  city:'Yurtdışı', country:'Irak'},     // TRB→Trabzon çakışması
  {rx:/SILAMAGRO/i,    city:'Bursa',   country:'Türkiye'},  // SILAM→Samsun çakışması
];
const facOverride=name=>{if(!name)return null;for(const o of FAC_NAME_OVERRIDES)if(o.rx.test(name))return o;return null;};
const gC=(c,name)=>{const ov=facOverride(name);if(ov)return ov.city;if(CTM[c])return CTM[c];const p=c.split('-')[0];return CTM[p]||Object.entries(CTM).find(([k])=>c.includes(k))?.[1]||'Yurtdışı';};
const gT=c=>{if(!c)return'dis';const u=c.toUpperCase();if(u.includes('FSN'))return'fason';if(u==='DISTICARET'||u.includes('DTC'))return'disticaret';if(u.startsWith('TRY-')||u.startsWith('YLD-'))return'own';return'dis';};
const CGRP={'TAND':'Tiryaki Anadolu','TGFZ':'Tiryaki Anadolu','TSHY':'Tiryaki Anadolu','DNSG':'Tiryaki Anadolu','DPFZ':'Tiryaki Anadolu','THSG':'Tiryaki Anadolu','DANE':'Tiryaki Anadolu','ENUT':'Tiryaki Anadolu','LNUT':'Tiryaki Anadolu','LNCN':'Tiryaki Anadolu','DLDN':'Tiryaki Anadolu','LNFZ':'Tiryaki Anadolu','LSGA':'Tiryaki Anadolu','DYLD':'Tiryaki Anadolu','DLDP':'Tiryaki Anadolu','TSRY':'Tiryaki Anadolu','SUHO':'Tiryaki Emerging Markets','SAMA':'Tiryaki Emerging Markets','MESQ':'Tiryaki Emerging Markets','MFZC':'Tiryaki Emerging Markets','HFLT':'Tiryaki Emerging Markets','HNLT':'Tiryaki Emerging Markets','TOGO':'Tiryaki Emerging Markets','TGAN':'Tiryaki Emerging Markets','GANA':'Tiryaki Emerging Markets','NOVA':'Tiryaki Emerging Markets','TNGA':'Tiryaki Emerging Markets','DMES':'Tiryaki Emerging Markets','DTRK':'Tiryaki Emerging Markets','DARG':'Tiryaki Emerging Markets','AFZE':'Tiryaki Emerging Markets','SARG':'Tiryaki Emerging Markets','TARG':'Tiryaki Emerging Markets','MERC':'Tiryaki Emerging Markets','VMES':'Tiryaki Emerging Markets','TMES':'Tiryaki Emerging Markets','SRCA':'Tiryaki Organics','SRNL':'Tiryaki Organics','SRUS':'Tiryaki Organics','SRDE':'Tiryaki Organics','SRIL':'Tiryaki Organics','GPOR':'Tiryaki Organics','GLON':'Tiryaki Organics','DSSM':'Tiryaki Organics','DDIA':'Tiryaki Organics','DSSA':'Tiryaki Organics','DIAS':'Tiryaki Organics','TTEC':'Tiryaki Strategic Services','DNAI':'Tiryaki Strategic Services','DTFZ':'Tiryaki Strategic Services','EDGA':'Tiryaki Energy','EGNY':'Tiryaki Energy','EGNS':'Tiryaki Energy','EHUR':'Tiryaki Energy','ENIL':'Tiryaki Energy','EOKL':'Tiryaki Energy','EOZB':'Tiryaki Energy','ESFZ':'Tiryaki Energy','ETRY':'Tiryaki Energy','DTGT':'Tiryaki Energy','EYIL':'Tiryaki Energy','EYZY':'Tiryaki Energy','ASET':'Tiryaki Holding','DHDG':'Tiryaki Holding','MAEP':'Tiryaki Holding','MEFA':'Tiryaki Holding','DTMX':'Tiryaki Holding'};
const gGrp=code=>{if(!code)return'Diğer';const u=code.toUpperCase().trim();return CGRP[u]||'Diğer';};
const BK=[{k:'0-30',c:'#0d6e4f'},{k:'31-60',c:'#16a34a'},{k:'61-90',c:'#65a30d'},{k:'91-120',c:'#f5a623'},{k:'121-180',c:'#ea580c'},{k:'181-365',c:'#e5484d'},{k:'365+',c:'#991b1b'}];
const MONTHS_TR=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const QUARTERS_TR=['Q1 (Oca-Mar)','Q2 (Nis-Haz)','Q3 (Tem-Eyl)','Q4 (Eki-Ara)'];
// Kısa ton formatı (chart bar etiketi için) — "1.5Mt", "446Kt", "12t"
const fmtShortTon=n=>{const t=n/1000;if(t>=1e6)return(t/1e6).toFixed(1)+'Mt';if(t>=1e3)return(t/1e3).toFixed(0)+'Kt';if(t>=1)return Math.round(t)+'t';return Math.round(n)+'kg';};
// Kısa genel sayı formatı ("1.2M", "446K", "12")
const fmtShortNum=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':String(Math.round(n));

// Trend helper: her ay için ilk haftanın (day<=7) en erken snapshot'ı.
// İstisna: verideki en güncel ay için ilk hafta yerine en güncel reportdate kullanılır.
function getMonthlyPoints(trendRaw, year){
  let maxP=null;
  for(const d of trendRaw){if(!maxP||String(d.date)>String(maxP.date))maxP=d;}
  const maxDt=maxP?new Date(maxP.date):null;
  const maxYear=maxDt?maxDt.getFullYear():null;
  const maxMonth=maxDt?maxDt.getMonth():null;
  const out=[];
  for(let m=0;m<12;m++){
    const isLatest=year===maxYear&&m===maxMonth;
    if(isLatest&&maxP){
      out.push({label:MONTHS_TR[m],date:maxP.date,value:maxP.value,recordCount:maxP.recordCount,month:m,year,isLatest:true});
      continue;
    }
    const candidates=trendRaw.filter(d=>{const dt=new Date(d.date);return dt.getFullYear()===year&&dt.getMonth()===m&&dt.getDate()<=7;});
    candidates.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const p=candidates[0];
    out.push({label:MONTHS_TR[m],date:p?.date||null,value:p?p.value:null,recordCount:p?p.recordCount:null,month:m,year});
  }
  return out;
}
function getQuarterlyPoints(trendRaw, year){
  const monthly=getMonthlyPoints(trendRaw,year);
  return [0,3,6,9].map((sm,qi)=>{const p=monthly[sm];return{label:QUARTERS_TR[qi],date:p.date,value:p.value,recordCount:p.recordCount,quarter:qi,year};});
}
function getYearlyPoints(trendRaw){
  const years=[...new Set(trendRaw.map(d=>new Date(d.date).getFullYear()))].sort();
  return years.map(y=>{
    const inYear=trendRaw.filter(d=>new Date(d.date).getFullYear()===y).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const janFirstWeek=inYear.filter(d=>{const dt=new Date(d.date);return dt.getMonth()===0&&dt.getDate()<=7;});
    const p=janFirstWeek[0]||inYear[0];
    return{label:String(y),date:p?.date||null,value:p?p.value:null,recordCount:p?p.recordCount:null,year:y};
  });
}

function buildD(rows){
  const fm={},wm={};
  rows.forEach(r=>{const mi=r[8],ts=r[9],ta=r[10],dp=r[11],da=r[12],ua=r[3],fu=r[25],fifo=r[27];
    if(!fm[ts])fm[ts]={id:ts,n:ta,city:gC(ts,ta),type:gT(ts),q:0,v:0,ws:new Set(),ps:new Set(),td:0,tq:0};
    const f=fm[ts];f.q+=mi;f.v+=mi*fu;f.ws.add(dp);f.ps.add(ua);f.td+=mi*fifo;f.tq+=mi;
    const wk=ts+'|'+dp;if(!wm[wk])wm[wk]={fc:ts,id:dp,n:da,q:0,v:0,ps:new Set(),td:0,tq:0};
    const w=wm[wk];w.q+=mi;w.v+=mi*fu;w.ps.add(ua);w.td+=mi*fifo;w.tq+=mi;});
  const f=Object.values(fm).map(x=>({id:x.id,n:x.n,city:x.city,type:x.type,q:x.q,v:x.v,wc:x.ws.size,pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const w=Object.values(wm).map(x=>({fc:x.fc,id:x.id,n:x.n,q:x.q,v:x.v,pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const cm={};f.forEach(fc=>{const c=fc.city;if(!cm[c])cm[c]={n:c,q:0,v:0,fc:0,wc:0,fcs:[],td:0,tq:0};const o=cm[c];o.q+=fc.q;o.v+=fc.v;o.fc++;o.wc+=fc.wc;o.fcs.push(fc.id);o.td+=fc.a*fc.q;o.tq+=fc.q;});
  const ct=Object.values(cm).map(c=>{const ll=CLL[c.n]||[39,35];return{n:c.n,q:c.q,v:c.v,fc:c.fc,wc:c.wc,fcs:c.fcs,a:c.tq>0?Math.round(c.td/c.tq):0,lat:ll[0],lng:ll[1]};});
  const ag={};BK.forEach(b=>{ag[b.k]=0;});
  rows.forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});
  const tQ=f.reduce((s,x)=>s+x.q,0),tV=f.reduce((s,x)=>s+x.v,0);
  return{f,w,ct,ag,s:{totalQty:tQ,totalVal:tV,facilityCount:f.length,whCount:w.length,prodCount:new Set(rows.map(r=>r[3])).size,avgAge:tQ>0?Math.round(f.reduce((s,x)=>s+x.a*x.q,0)/tQ):0,cityCount:ct.length}};
}

// ── Emerging Markets: Ülke bazlı mapping ──
// Uluslararası tesis kodu → Ülke (gerçek ERP verisinden)
const FCTM={
  // ABD
  'ALEX':'ABD','ARMIL':'ABD','BWC':'ABD','BORD':'ABD','BRIDG':'ABD','CHERO':'ABD','COLDZ':'ABD','COLU':'ABD','COZAD':'ABD','DEJON':'ABD','DELTA':'ABD','DESM':'ABD','ECHO':'ABD','FIVER':'ABD','GALVA':'ABD','GLADS':'ABD','GRAN':'ABD','GROV':'ABD','HAMM':'ABD','HERC':'ABD','HUNT':'ABD','LANG':'ABD','LATHR':'ABD','LONGB':'ABD','MANLY':'ABD','MANOR':'ABD','MHC':'ABD','MARSE':'ABD','NEWC':'ABD','NOLA3':'ABD','NOLA4':'ABD','NOLA5':'ABD','NOLA6':'ABD','NOLA7':'ABD','NOLA8':'ABD','OAK':'ABD','ONT':'ABD','OTT':'ABD','OZARK':'ABD','PASA':'ABD','PENN':'ABD','PHIL':'ABD','PHOE':'ABD','PLEAS':'ABD','PROG':'ABD','RED':'ABD','ROCH':'ABD','SIOUX':'ABD','SUMN':'ABD','SWEDE':'ABD','VALLA':'ABD','VANCO':'ABD','WILM':'ABD','BOONE':'ABD','BOON':'ABD','SRUS':'ABD','LEBAN':'ABD','ALTAS':'ABD',
  // Kanada
  'AUS':'Kanada','GNGT':'Kanada','HEP':'Kanada','MONTR':'Kanada','MONTPORT':'Kanada','REG':'Kanada','SAS':'Kanada','VANC':'Kanada','VANCP':'Kanada','VANCY':'Kanada',
  // Avrupa
  'ANTW':'Belçika','CALINESTI':'Romanya','MARACINENI':'Romanya','GBI':'Romanya',
  // Orta Doğu / Irak
  'BBL':'Irak','BGD':'Irak','BSR':'Irak','KBR':'Irak','KUT':'Irak','NJF':'Irak','DHK':'Irak','DUHOK':'Irak','ERB':'Irak','ERBIL':'Irak','MSL':'Irak','MOSUL':'Irak','SLM':'Irak',
  // Afrika
  'GHANA':'Gana',
  // Özel Türk kodları (TRY- prefix ama yurtdışı)
  'TRY-SDN':'Sudan',
  // Sistem kodları → Diğer
  'P2SALE':'Diğer','IMPORT':'Diğer','INTER':'Diğer','VSL':'Diğer','RJCT':'Diğer','Cust Site':'Diğer'
};
const COUNTRY_LL={
  'Türkiye':[39,35],'ABD':[39,-98],'Kanada':[56,-106],'Belçika':[50.8,4.4],'Romanya':[46,25],
  'Irak':[33,44],'Gana':[7.9,-1],'Sudan':[15.6,32.5],
  'Diğer':[18,-30]
};
// ABD eyalet ve Kanada il kodları — tesis adından ülke tespiti için
const US_STATES=new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']);
const CA_PROVS=new Set(['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','PQ','QC','SK','YT']);

const gCountry=(code,name)=>{
  // 0. Tesis adı override — kod Türkçe prefix'le çakışan tesisler (örn: TRB→TREBIL Irak, SILAM→Sılamagro Bursa)
  const ov=facOverride(name);if(ov)return ov.country;
  // 1. Tam kodu FCTM'de ara
  if(FCTM[code])return FCTM[code];
  // 2. Tam kodu CTM'de ara (Türkiye)
  if(CTM[code])return'Türkiye';
  const p=code.split('-')[0];
  // 3. Prefix'i FCTM'de ara
  if(FCTM[p])return FCTM[p];
  // 4. Prefix'i CTM'de ara
  if(CTM[p])return'Türkiye';
  // 5. Akıllı fallback: tesis adından eyalet/il kodu tespit et
  // Örn: "Boone, IA - AgCertain..." → IA = Iowa = ABD
  // Örn: "Vancouver, BC - CN Intermodal..." → BC = British Columbia = Kanada
  if(name){
    const m=name.match(/,\s*([A-Z]{2})\s*[-–—]/);
    if(m){
      if(US_STATES.has(m[1]))return'ABD';
      if(CA_PROVS.has(m[1]))return'Kanada';
    }
    // İsim içinde ülke ipuçları
    const u=name.toUpperCase();
    if(u.includes('GHANA'))return'Gana';
    if(u.includes('IRAQ')||u.includes('IRAK'))return'Irak';
    if(u.includes('SUDAN'))return'Sudan';
    if(u.includes('ROMANIA')||u.includes('ROMANYA'))return'Romanya';
  }
  return'Diğer';
};

function buildDWorld(rows){
  const fm={},wm={};
  rows.forEach(r=>{const mi=r[8],ts=r[9],ta=r[10],dp=r[11],da=r[12],ua=r[3],fu=r[25],fifo=r[27];
    if(!fm[ts])fm[ts]={id:ts,n:ta,country:gCountry(ts,ta),type:gT(ts),q:0,v:0,ws:new Set(),ps:new Set(),td:0,tq:0};
    const f=fm[ts];f.q+=mi;f.v+=mi*fu;f.ws.add(dp);f.ps.add(ua);f.td+=mi*fifo;f.tq+=mi;
    const wk=ts+'|'+dp;if(!wm[wk])wm[wk]={fc:ts,id:dp,n:da,q:0,v:0,ps:new Set(),td:0,tq:0};
    const w=wm[wk];w.q+=mi;w.v+=mi*fu;w.ps.add(ua);w.td+=mi*fifo;w.tq+=mi;});
  const f=Object.values(fm).map(x=>({id:x.id,n:x.n,country:x.country,type:x.type,q:x.q,v:x.v,wc:x.ws.size,pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const w=Object.values(wm).map(x=>({fc:x.fc,id:x.id,n:x.n,q:x.q,v:x.v,pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const cm={};f.forEach(fc=>{const c=fc.country;if(!cm[c])cm[c]={n:c,q:0,v:0,fc:0,wc:0,fcs:[],td:0,tq:0};const o=cm[c];o.q+=fc.q;o.v+=fc.v;o.fc++;o.wc+=fc.wc;o.fcs.push(fc.id);o.td+=fc.a*fc.q;o.tq+=fc.q;});
  const countries=Object.values(cm).map(c=>{const ll=COUNTRY_LL[c.n]||[20,0];return{n:c.n,q:c.q,v:c.v,fc:c.fc,wc:c.wc,fcs:c.fcs,a:c.tq>0?Math.round(c.td/c.tq):0,lat:ll[0],lng:ll[1]};});
  const ag={};BK.forEach(b=>{ag[b.k]=0;});
  rows.forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});
  const tQ=f.reduce((s,x)=>s+x.q,0),tV=f.reduce((s,x)=>s+x.v,0);
  return{f,w,countries,ag,s:{totalQty:tQ,totalVal:tV,facilityCount:f.length,whCount:w.length,prodCount:new Set(rows.map(r=>r[3])).size,avgAge:tQ>0?Math.round(f.reduce((s,x)=>s+x.a*x.q,0)/tQ):0,countryCount:countries.length}};
}

function getL2(rows,filterFn){
  const m={};
  rows.filter(filterFn).forEach(r=>{const l2=r[17]||'Diğer';const q=r[8];const v=r[8]*r[25];const fifo=r[27];if(!m[l2])m[l2]={n:l2,q:0,v:0,td:0,tq:0};m[l2].q+=q;m[l2].v+=v;m[l2].td+=q*fifo;m[l2].tq+=q;});
  return Object.values(m).map(x=>({n:x.n,q:Math.round(x.q),v:Math.round(x.v),a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.q-a.q);
}

function agingOf(rows,facIds){
  const ag={};BK.forEach(b=>{ag[b.k]=0;});
  rows.filter(r=>facIds.includes(r[9])).forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});
  return ag;
}

function buildGroupPivot(rows,fn){
  const m={};
  rows.forEach(r=>{
    const g=fn(r)||'Diğer';
    const q=r[8];const d=r[27];const vl=r[8]*r[25];
    if(!m[g])m[g]={n:g,total:0,totalVal:0,td:0,ag:{}};
    BK.forEach(b=>{if(!m[g].ag[b.k])m[g].ag[b.k]=0;});
    m[g].total+=q;m[g].totalVal+=vl;m[g].td+=q*d;
    if(d<=30)m[g].ag['0-30']+=q;else if(d<=60)m[g].ag['31-60']+=q;else if(d<=90)m[g].ag['61-90']+=q;else if(d<=120)m[g].ag['91-120']+=q;else if(d<=180)m[g].ag['121-180']+=q;else if(d<=365)m[g].ag['181-365']+=q;else m[g].ag['365+']+=q;
  });
  return Object.values(m).map(x=>({...x,avg:x.total>0?Math.round(x.td/x.total):0})).sort((a,b)=>b.total-a.total);
}

function buildPivot(rows,groupIdx,labelIdx){
  const m={};
  rows.forEach(r=>{
    const g=r[labelIdx]||r[groupIdx]||'Diğer';
    const q=r[8];const d=r[27];const vl=r[8]*r[25];
    if(!m[g])m[g]={n:g,total:0,totalVal:0,td:0,ag:{}};
    BK.forEach(b=>{if(!m[g].ag[b.k])m[g].ag[b.k]=0;});
    m[g].total+=q;m[g].totalVal+=vl;m[g].td+=q*d;
    if(d<=30)m[g].ag['0-30']+=q;else if(d<=60)m[g].ag['31-60']+=q;else if(d<=90)m[g].ag['61-90']+=q;else if(d<=120)m[g].ag['91-120']+=q;else if(d<=180)m[g].ag['121-180']+=q;else if(d<=365)m[g].ag['181-365']+=q;else m[g].ag['365+']+=q;
  });
  return Object.values(m).map(x=>({...x,avg:x.total>0?Math.round(x.td/x.total):0})).sort((a,b)=>b.total-a.total);
}

const $={bg:'#fafbfc',bg2:'#fff',bg3:'#edf1f6',t1:'#1a2332',t2:'#5a6b7f',t3:'#8e9bb3',ac:'#0d6e4f',acL:'#e4f5ee',grn:'#2dd4a0',grnB:'rgba(45,212,160,.1)',blu:'#3b82f6',bluB:'rgba(59,130,246,.08)',red:'#e5484d',redB:'rgba(229,72,77,.08)',pur:'#8b5cf6',purB:'rgba(139,92,246,.08)',org:'#f5a623',orgB:'rgba(245,166,35,.08)',tel:'#14b8a6',telB:'rgba(20,184,166,.08)',bd:'#e2e7ee',bdL:'#eef1f6',sh:'0 1px 3px rgba(0,0,0,.04)',shM:'0 4px 16px rgba(0,0,0,.07)',r:'8px',rM:'12px',rL:'16px',f:"'Plus Jakarta Sans',-apple-system,sans-serif",mo:"'Plus Jakarta Sans',-apple-system,sans-serif"};

const KI=({children,bg,color})=><div style={{width:30,height:30,borderRadius:8,background:bg,color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{children}</div>;
// Custom Dropdown — native select yerine glassmorphism açılır liste
const CustomSelect=({value,onChange,options,placeholder='Tümü'})=>{
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const selected=options.find(o=>o===value);
  useEffect(()=>{
    if(!open)return;
    const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);
  },[open]);
  return(
    <div ref={ref} style={{position:'relative'}}>
      <div onClick={()=>setOpen(v=>!v)} style={{
        padding:'7px 28px 7px 10px',borderRadius:10,fontSize:11,fontFamily:'inherit',cursor:'pointer',
        background:open?'rgba(255,255,255,.95)':'rgba(255,255,255,.7)',
        backdropFilter:'blur(8px)',border:'1px solid '+(open?'rgba(13,110,79,.3)':'rgba(226,231,238,.5)'),
        boxShadow:open?'0 0 0 3px rgba(13,110,79,.08),0 2px 6px rgba(0,0,0,.04)':'0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)',
        color:value?'#1a2332':'#8e9bb3',fontWeight:value?600:500,transition:'all .2s',
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {selected||placeholder}
        <svg width="10" height="6" viewBox="0 0 10 6" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'+(open?' rotate(180deg)':''),transition:'transform .2s'}}>
          <path d="M1 1l4 4 4-4" stroke="#0d6e4f" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:300,
        background:'rgba(255,255,255,.96)',backdropFilter:'blur(20px) saturate(180%)',
        borderRadius:12,border:'1px solid rgba(0,0,0,.06)',
        boxShadow:'0 8px 28px rgba(0,0,0,.1)',
        maxHeight:180,overflowY:'auto',padding:4}}>
        <div onClick={()=>{onChange('');setOpen(false);}} style={{
          padding:'7px 10px',borderRadius:8,fontSize:11,cursor:'pointer',color:!value?'#0d6e4f':'#5a6b7f',
          fontWeight:!value?700:500,background:!value?'rgba(13,110,79,.06)':'transparent',
          transition:'background .15s'}} className="rh">{placeholder}</div>
        {options.map(o=>(
          <div key={o} onClick={()=>{onChange(o);setOpen(false);}} style={{
            padding:'7px 10px',borderRadius:8,fontSize:11,cursor:'pointer',
            color:o===value?'#0d6e4f':'#1a2332',fontWeight:o===value?700:500,
            background:o===value?'rgba(13,110,79,.06)':'transparent',
            transition:'background .15s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} className="rh">{o}</div>
        ))}
      </div>}
    </div>
  );
};
// SearchableSelect — kod ve isim bazlı arama destekli combobox (trader dropdown için)
// items: [{value, label, sub}] — value seçim, label arama+display, sub alt yazı (opsiyonel)
// multi=true ise value array, checkbox listesi gösterir
const SearchableSelect=({value,onChange,items,placeholder='Seçin...',disabled,emptyText='Eşleşme yok',multi=false})=>{
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const ref=useRef(null);
  const inputRef=useRef(null);
  const valueArr=multi?(Array.isArray(value)?value:[]):null;
  const isSelected=v=>multi?valueArr.includes(v):v===value;
  const selected=multi?null:items.find(i=>i.value===value);
  useEffect(()=>{
    if(!open)return;
    const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);
  },[open]);
  useEffect(()=>{if(open&&inputRef.current)setTimeout(()=>inputRef.current?.focus(),50);},[open]);
  const norm=s=>String(s||'').toLocaleLowerCase('tr-TR');
  const q=norm(query.trim());
  const filtered=q?items.filter(i=>norm(i.label).includes(q)||norm(i.value).includes(q)||norm(i.sub).includes(q)):items;
  const triggerLabel=multi?(valueArr.length===0?placeholder:valueArr.length===1?(items.find(i=>i.value===valueArr[0])?.label||valueArr[0]):`${valueArr.length} trader seçili`):(selected?.label||placeholder);
  const handleClick=v=>{
    if(multi){
      const next=valueArr.includes(v)?valueArr.filter(x=>x!==v):[...valueArr,v];
      onChange(next);
    }else{
      onChange(v);setOpen(false);setQuery('');
    }
  };
  return(
    <div ref={ref} style={{position:'relative'}}>
      <div onClick={()=>{if(!disabled)setOpen(v=>!v);}} style={{
        padding:'9px 32px 9px 12px',borderRadius:10,fontSize:12.5,fontFamily:'inherit',cursor:disabled?'not-allowed':'pointer',
        background:disabled?'rgba(0,0,0,.03)':open?'rgba(255,255,255,.95)':'rgba(255,255,255,.85)',
        border:'1px solid '+(open?'rgba(13,110,79,.35)':'rgba(226,231,238,.6)'),
        boxShadow:open?'0 0 0 3px rgba(13,110,79,.08),0 2px 6px rgba(0,0,0,.04)':'0 1px 3px rgba(0,0,0,.03)',
        color:(multi?valueArr.length>0:!!value)?'#1a2332':'#8e9bb3',fontWeight:(multi?valueArr.length>0:!!value)?600:500,transition:'all .2s',
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',position:'relative',userSelect:'none'}}>
        {triggerLabel}
        <svg width="11" height="7" viewBox="0 0 11 7" style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)'+(open?' rotate(180deg)':''),transition:'transform .2s'}}>
          <path d="M1 1l4.5 4.5L10 1" stroke="#0d6e4f" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open&&!disabled&&(
        <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,right:0,zIndex:300,background:'rgba(255,255,255,.98)',backdropFilter:'blur(20px) saturate(180%)',borderRadius:12,border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 12px 40px rgba(0,0,0,.15)',overflow:'hidden'}}>
          <div style={{padding:'8px 10px',borderBottom:'1px solid '+$.bdL,position:'relative',display:'flex',gap:8,alignItems:'center'}}>
            <div style={{position:'relative',flex:1}}>
              <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kod veya isim ile ara..." style={{width:'100%',boxSizing:'border-box',padding:'7px 10px 7px 30px',borderRadius:8,border:'1px solid '+$.bdL,fontSize:12,fontFamily:'inherit',outline:'none',background:'#fafbfc'}}/>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8e9bb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            {multi&&valueArr.length>0&&<div onClick={()=>onChange([])} style={{cursor:'pointer',fontSize:11,fontWeight:600,color:$.red,padding:'4px 9px',borderRadius:6,background:$.redB,whiteSpace:'nowrap'}} className="rh">Temizle ({valueArr.length})</div>}
          </div>
          <div style={{maxHeight:280,overflowY:'auto',padding:4}}>
            {filtered.length===0?(
              <div style={{padding:'14px 12px',fontSize:11,color:$.t3,textAlign:'center'}}>{emptyText}</div>
            ):filtered.slice(0,200).map(i=>{
              const sel=isSelected(i.value);
              return(
              <div key={i.value} onClick={()=>handleClick(i.value)} style={{padding:'8px 12px',borderRadius:7,cursor:'pointer',fontSize:12,color:sel?'#0d6e4f':'#1a2332',fontWeight:sel?700:500,background:sel?'rgba(13,110,79,.08)':'transparent',transition:'background .12s',display:'flex',alignItems:'center',gap:8}} className="rh">
                {multi&&<div style={{width:14,height:14,borderRadius:4,border:'1.5px solid '+(sel?'#0d6e4f':$.bd),background:sel?'#0d6e4f':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>}
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.label}</span>
                {!multi&&sel&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d6e4f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              );
            })}
            {filtered.length>200&&<div style={{padding:'8px 12px',fontSize:10,color:$.t3,textAlign:'center',borderTop:'1px solid '+$.bdL}}>+{filtered.length-200} daha · aramayı daraltın</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Premium hover tooltip — terim açıklamaları için. Çocuk üzerine gelince koyu kart açılır.
const InfoTip=({title,desc,detail,formula,children,placement='top',iconSize=11,inline=false})=>{
  const [open,setOpen]=useState(false);
  return(
    <span style={{position:'relative',display:inline?'inline-flex':'inline-flex',alignItems:'center',gap:5}} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      <Info size={iconSize} style={{opacity:.45,cursor:'help',flexShrink:0}}/>
      {open&&(
        <div style={{position:'absolute',[placement==='top'?'bottom':'top']:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',zIndex:200,minWidth:240,maxWidth:340,background:'#1a2332',color:'#fff',borderRadius:10,padding:'12px 14px',boxShadow:'0 12px 32px rgba(0,0,0,.25)',pointerEvents:'none',animation:'stepFade .15s ease-out'}}>
          <div style={{fontSize:12.5,fontWeight:800,color:'#fff',marginBottom:5}}>{title}</div>
          <div style={{fontSize:11,color:'#cbd5e1',lineHeight:1.55}}>{desc}</div>
          {detail&&<div style={{fontSize:10.5,color:'#94a3b8',marginTop:6,paddingTop:6,borderTop:'1px solid rgba(255,255,255,.08)',lineHeight:1.55}}>{detail}</div>}
          {formula&&<div style={{fontSize:10.5,fontFamily:'Consolas,monospace',color:'#94a3b8',marginTop:6,padding:'5px 8px',background:'rgba(255,255,255,.04)',borderRadius:5}}>{formula}</div>}
          <div style={{position:'absolute',[placement==='top'?'bottom':'top']:-5,left:'50%',transform:'translateX(-50%) rotate(45deg)',width:10,height:10,background:'#1a2332'}}/>
        </div>
      )}
    </span>
  );
};

const BCard=({children,span,rSpan,style:s2})=><div style={{gridColumn:span?`span ${span}`:'span 1',gridRow:rSpan?`span ${rSpan}`:'span 1',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,overflow:'hidden',...(s2||{})}}>{children}</div>;
const BHead=({icon:Ic,color,bg,title})=><div style={{padding:'14px 18px 12px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8}}><div style={{width:26,height:26,borderRadius:7,background:bg,color,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Ic size={14}/></div><span style={{fontSize:13,fontWeight:700,color:$.t1}}>{title}</span></div>;

const AgBar=({ag,total,big})=>{const tq=total||1;const sz=big?12:11;const dt=big?9:8;const gp=big?'6px 16px':'6px 14px';const bh=big?12:8;return(<div><div style={{display:'flex',height:bh,borderRadius:bh/2,overflow:'hidden',background:$.bdL,marginBottom:big?10:8}}>{BK.map(b=>{const p=(ag[b.k]||0)/tq*100;return p>0?<div key={b.k} style={{width:p+'%',background:b.c,transition:'width .4s'}}/>:null;})}</div><div style={{display:'flex',flexWrap:'wrap',gap:gp}}>{BK.map(b=>{const v=ag[b.k]||0;return v>0?<div key={b.k} style={{display:'flex',alignItems:'center',gap:big?5:4,fontSize:sz,color:$.t2}}><div style={{width:dt,height:dt,borderRadius:3,background:b.c,flexShrink:0}}/><span style={{fontWeight:700}}>{((v/tq)*100).toFixed(0)}%</span><span style={{color:$.t3,fontWeight:500}}>{b.k}</span></div>:null;})}</div></div>);};

const TypeBar=({facs,total,big})=>{const tq=total||1;const sz=big?12:11;const dt=big?9:8;const gp=big?'6px 16px':'6px 14px';const bh=big?12:8;const types=Object.entries(TI).map(([k,v])=>({k,c:v.color,l:v.label,q:facs.filter(f=>f.type===k).reduce((s,f)=>s+f.q,0)})).filter(t=>t.q>0);if(types.length<1)return null;return(<div><div style={{display:'flex',height:bh,borderRadius:bh/2,overflow:'hidden',background:$.bdL,marginBottom:big?10:6}}>{types.map(t=><div key={t.k} style={{width:(t.q/tq)*100+'%',background:t.c,transition:'width .4s'}}/>)}</div><div style={{display:'flex',flexWrap:'wrap',gap:gp}}>{types.map(t=><div key={t.k} style={{display:'flex',alignItems:'center',gap:big?5:3,fontSize:sz,color:$.t2}}><div style={{width:dt,height:dt,borderRadius:3,background:t.c}}/><span style={{fontFamily:$.mo,fontWeight:700}}>{((t.q/tq)*100).toFixed(0)}%</span><span style={{color:$.t3,fontWeight:500}}>{t.l}</span></div>)}</div></div>);};

const SegBar=({ag,total,h,rd})=>{const tq=total||1;const hh=h||10;const rr=rd||5;return(
  <div style={{flex:1,height:hh,borderRadius:rr,background:$.bdL,display:'flex',position:'relative',overflow:'visible'}}>
    {BK.map(b=>{const v=ag[b.k]||0;const p=tq>0?(v/tq)*100:0;return p>0?(
      <div key={b.k} className="sg" style={{width:p+'%',background:b.c,opacity:.7,transition:'width .4s',position:'relative',cursor:'pointer'}}>
        <div className="sgt" style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',padding:'7px 11px',background:$.bg2,border:'1px solid '+$.bd,borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,.12)',whiteSpace:'nowrap',zIndex:30,pointerEvents:'none',opacity:0,transition:'opacity .15s',fontSize:11.5,lineHeight:1.5}}>
          <div style={{fontWeight:700,color:b.c,marginBottom:1}}>{b.k} gün</div>
          <div style={{fontFamily:$.mo,fontWeight:600,color:$.t1}}>{fN(v)} kg</div>
          <div style={{fontFamily:$.mo,fontSize:10,color:$.t3}}>{p.toFixed(1)}%</div>
          <div style={{position:'absolute',bottom:-5,left:'50%',marginLeft:-5,width:10,height:10,background:$.bg2,border:'1px solid '+$.bd,borderTop:'none',borderLeft:'none',transform:'rotate(45deg)'}}/>
        </div>
      </div>
    ):null;})}
  </div>
);};

export default function App(){
  const [rows,setRows]=useState(()=>{if(DEMO&&DEMO.length>0)return DEMO;try{const s=localStorage.getItem('tyrowms_rows');if(s){const p=JSON.parse(s);if(Array.isArray(p)&&p.length>0)return p;}}catch(e){}return INIT;});
  useEffect(()=>{try{if(rows.length>0)localStorage.setItem('tyrowms_rows',JSON.stringify(rows));else localStorage.removeItem('tyrowms_rows');}catch(e){}},[rows]);
  const [gSearch,setGSearch]=useState('');
  const [gSearchFocus,setGSearchFocus]=useState(false);
  const GS_IDX=[1,3,4,10,12,15,17,19,21,23,33,34,35,36,37]; // searchable text column indices (33=Proje ID, 34=Trader, 35=Ana Trader, 36=Trader Adı, 37=Ana Trader Adı)
  // ── Global Gelişmiş Filtre (gRows'dan önce tanımlanmalı) ──
  const GF_INIT={grp:'',comp:'',urun:'',mense:'',tesis:'',l2:'',l3:'',mtrader:'',trader:''};
  const [gFilter,setGFilter]=useState(()=>{try{const s=localStorage.getItem('tyrowms_gfilter');if(s){const p=JSON.parse(s);if(p&&typeof p==='object')return{...GF_INIT,...p};}}catch(e){}return GF_INIT;});
  const [showGFilter,setShowGFilter]=useState(false);
  useEffect(()=>{try{localStorage.setItem('tyrowms_gfilter',JSON.stringify(gFilter));}catch(e){}},[gFilter]);
  const gFilterCount=useMemo(()=>Object.values(gFilter).filter(v=>v!=='').length,[gFilter]);
  // Transit/Fark ambar dahil et — default false (hesaplamadan çıkar)
  const [incTransit,setIncTransit]=useState(()=>{try{return localStorage.getItem('tyrowms_inc_transit')==='1';}catch(e){return false;}});
  const [incFark,setIncFark]=useState(()=>{try{return localStorage.getItem('tyrowms_inc_fark')==='1';}catch(e){return false;}});
  useEffect(()=>{try{localStorage.setItem('tyrowms_inc_transit',incTransit?'1':'0');}catch(e){}},[incTransit]);
  useEffect(()=>{try{localStorage.setItem('tyrowms_inc_fark',incFark?'1':'0');}catch(e){}},[incFark]);
  // calcRows: only rows where madde kodu (index 2) starts with 1, 2 or 3 — used in all calculations
  // Ayrıca transit/fark ambar adlı satırlar opsiyonel (default dışarıda)
  // Türkçe/İngilizce farkı için İ/I/ı hepsi i'ye normalize edilir; TRANSIT, TRANSİT, INTRANSIT, In-Transit hepsi yakalanır
  const normWh=s=>String(s||'').replace(/[İIı]/g,'i').toLowerCase();
  const calcRows=useMemo(()=>rows.filter(r=>{
    if(!/^[123]/.test(String(r[2]||'')))return false;
    const wh=normWh(r[12]);
    if(!incTransit&&wh.includes('transit'))return false;
    if(!incFark&&wh.includes('fark'))return false;
    return true;
  }),[rows,incTransit,incFark]);
  // Trader & Ana Trader için "kod — isim" birleşik display formatı (filtre, dropdown ve grouplama)
  const traderLabel=(code,name)=>{const c=String(code||'').trim();const n=String(name||'').trim();if(!c&&!n)return'';return n?(c?`${c} — ${n}`:n):c;};
  const gFilterOpts=useMemo(()=>({grps:[...new Set(calcRows.map(r=>gGrp(r[0])))].filter(Boolean).sort(),comps:[...new Set(calcRows.map(r=>r[1]||r[0]||''))].filter(Boolean).sort(),uruns:[...new Set(calcRows.map(r=>r[3]||''))].filter(Boolean).sort(),menses:[...new Set(calcRows.map(r=>r[4]||''))].filter(v=>v).sort(),tesisler:[...new Set(calcRows.map(r=>r[10]||''))].filter(v=>v).sort(),l2s:[...new Set(calcRows.map(r=>r[17]||''))].filter(v=>v).sort(),l3s:[...new Set(calcRows.map(r=>r[19]||''))].filter(v=>v).sort(),traders:[...new Set(calcRows.map(r=>traderLabel(r[34],r[36])))].filter(v=>v).sort(),mtraders:[...new Set(calcRows.map(r=>traderLabel(r[35],r[37])))].filter(v=>v).sort()}),[calcRows]);
  const applyGF=(r,gf)=>{if(gf.grp&&gGrp(r[0])!==gf.grp)return false;if(gf.comp&&(r[1]||r[0])!==gf.comp)return false;if(gf.urun&&(r[3]||'')!==gf.urun)return false;if(gf.mense&&(r[4]||'')!==gf.mense)return false;if(gf.tesis&&(r[10]||'')!==gf.tesis)return false;if(gf.l2&&(r[17]||'')!==gf.l2)return false;if(gf.l3&&(r[19]||'')!==gf.l3)return false;if(gf.trader&&traderLabel(r[34],r[36])!==gf.trader)return false;if(gf.mtrader&&traderLabel(r[35],r[37])!==gf.mtrader)return false;return true;};
  const gRows=useMemo(()=>{let r=calcRows;if(gSearch.trim()){const terms=gSearch.toLowerCase().split(/\s+/).filter(Boolean);r=r.filter(row=>{const grp=gGrp(row[0]).toLowerCase();return terms.every(t=>GS_IDX.some(i=>String(row[i]||'').toLowerCase().includes(t))||grp.includes(t));});}if(gFilterCount>0)r=r.filter(row=>applyGF(row,gFilter));return r;},[calcRows,gSearch,gFilter,gFilterCount]);
  // rawRows: all rows (unfiltered by madde kodu) for Rapor Satırları only
  const rawRows=useMemo(()=>{let r=rows;if(gSearch.trim()){const terms=gSearch.toLowerCase().split(/\s+/).filter(Boolean);r=r.filter(row=>{const grp=gGrp(row[0]).toLowerCase();return terms.every(t=>GS_IDX.some(i=>String(row[i]||'').toLowerCase().includes(t))||grp.includes(t));});}if(gFilterCount>0)r=r.filter(row=>applyGF(row,gFilter));return r;},[rows,gSearch,gFilter,gFilterCount]);
  const D=useMemo(()=>buildD(gRows),[gRows]);
  const DW=useMemo(()=>buildDWorld(gRows),[gRows]);
  const mQW=useMemo(()=>Math.max(...DW.countries.map(c=>c.q),1),[DW]);
  const gSuggestions=useMemo(()=>{
    if(!gSearch.trim()||calcRows.length===0)return[];
    const t=gSearch.toLowerCase();
    const cats=[
      {id:'mtrader',l:'Ana Trader',icon:'users',vals:[...new Set(calcRows.map(r=>traderLabel(r[35],r[37])))]},
      {id:'trader',l:'Trader',icon:'user',vals:[...new Set(calcRows.map(r=>traderLabel(r[34],r[36])))]},
      {id:'grp',l:'Grup',icon:'layers',vals:[...new Set(calcRows.map(r=>gGrp(r[0])))]},
      {id:'comp',l:'Şirket',icon:'building',vals:[...new Set(calcRows.map(r=>r[1]||r[0]||''))]},
      {id:'prod',l:'Ürün',icon:'package',vals:[...new Set(calcRows.map(r=>r[3]||''))]},
      {id:'fac',l:'Tesis',icon:'map-pin',vals:[...new Set(calcRows.map(r=>r[10]||''))]},
      {id:'l2',l:'Seviye 2',icon:'git-branch',vals:[...new Set(calcRows.map(r=>r[17]||''))]},
      {id:'l3',l:'Seviye 3',icon:'git-merge',vals:[...new Set(calcRows.map(r=>r[19]||''))]},
      {id:'origin',l:'Menşe',icon:'globe',vals:[...new Set(calcRows.map(r=>r[4]||''))]},
    ];
    return cats.map(c=>({...c,matches:c.vals.filter(v=>v&&v.toLowerCase().includes(t)).slice(0,5)})).filter(c=>c.matches.length>0);
  },[calcRows,gSearch]);
  const [mob,setMob]=useState(typeof window!=='undefined'&&window.innerWidth<768);
  const [sbOpen,setSbOpen]=useState(false);
  const [sbPinned,setSbPinned]=useState(false);
  const [sbHov,setSbHov]=useState(false);
  const sbTimerRef=useRef(null);
  const sbExpanded=mob?sbOpen:(sbPinned||sbHov);
  useEffect(()=>{const h=()=>{setMob(window.innerWidth<768);if(window.innerWidth>=768)setSbOpen(false);};window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  const [pg,setPg]=useState('dash');
  const [anaDetail,setAnaDetail]=useState(null);
  const [yonDetail,setYonDetail]=useState(null);
  const [sel,setSel]=useState(null);
  const [hov,setHov]=useState(null);
  const [tab,setTab]=useState('f');
  const [dashMapMode,setDashMapMode]=useState('world'); // 'turkey' | 'world'
  // Emerging Markets state
  const [emSel,setEmSel]=useState(null);
  const [emHov,setEmHov]=useState(null);
  const [emDrillFac,setEmDrillFac]=useState(null);
  const [emDrillWh,setEmDrillWh]=useState(null);
  const [emDrillL2,setEmDrillL2]=useState(null);
  const [emTab,setEmTab]=useState('f');
  const [rC,setRC]=useState(27);
  const [rD,setRD]=useState(-1);
  const fR=useRef(null);
  const [search,setSearch]=useState('');
  const [selRows,setSelRows]=useState(new Set());
  const [editIdx,setEditIdx]=useState(null);
  const [editRow,setEditRow]=useState(null);
  const [addMode,setAddMode]=useState(false);
  const [newRow,setNewRow]=useState(null);
  const [drillFac,setDrillFac]=useState(null);
  const [drillWh,setDrillWh]=useState(null);
  const [drillL2,setDrillL2]=useState(null);
  const [hovTip,setHovTip]=useState(null); // {i, x, y}
  const [repTab,setRepTab]=useState('grp');
  const [repSearch,setRepSearch]=useState('');
  const [repSC,setRepSC]=useState('total'); // sort column: n, total, avg, or bucket key
  const [repSD,setRepSD]=useState(-1); // sort direction
  // ─── Stok Raporu (sto) ───
  const [stoSearch,setStoSearch]=useState('');
  const [stoSC,setStoSC]=useState('q'); // sort column
  const [stoSD,setStoSD]=useState(-1); // sort direction
  const [mobMenu,setMobMenu]=useState(false); // three-dot menu on mobile bottom nav

  // ─── AI Chatbot (Gemini) ───
  const [chatOpen,setChatOpen]=useState(false);
  const [chatMsgs,setChatMsgs]=useState([]);
  const [chatInput,setChatInput]=useState('');
  const [chatLoading,setChatLoading]=useState(false);
  const [geminiKey,setGeminiKey]=useState(()=>localStorage.getItem('tyrowms_gemini_key')||'');
  const [showGeminiKey,setShowGeminiKey]=useState(false);
  const chatEndRef=useRef(null);

  const sendChat=useCallback(async()=>{
    const q=chatInput.trim();if(!q||chatLoading)return;
    const newMsgs=[...chatMsgs,{role:'user',text:q}];
    setChatMsgs(newMsgs);setChatInput('');setChatLoading(true);
    try{
      const ctx=buildDataContext(D,DW,fmtTon,fmt,fN,gRows);
      const answer=await askGemini(geminiKey,newMsgs,ctx);
      setChatMsgs(m=>[...m,{role:'model',text:answer}]);
    }catch(e){
      setChatMsgs(m=>[...m,{role:'model',text:'❌ '+e.message}]);
    }finally{setChatLoading(false);}
  },[chatInput,chatMsgs,chatLoading,geminiKey,D,DW]);
  useEffect(()=>{if(chatEndRef.current)chatEndRef.current.scrollIntoView({behavior:'smooth'});},[chatMsgs]);

  // ─── KPI Trend Paneli (tüm 6 KPI için ortak) ───
  const [trendKPI,setTrendKPI]=useState(null); // null=kapalı, yoksa metric ID: 'qty'|'value'|'facilities'|'products'|'avgAge'|'criticalStock'
  const trendPctCache=useRef({}); // % değişim cache — panel kapansa bile kalır
  const [trendRaw,setTrendRaw]=useState([]);
  const [trendLoading,setTrendLoading]=useState(false);
  const [trendErr,setTrendErr]=useState(null);
  const [trendMode,setTrendMode]=useState('month');
  const [trendYear,setTrendYear]=useState(new Date().getFullYear());
  const [trendMonth,setTrendMonth]=useState(null);

  // ─── Memoized Analiz computations ───
  const anaData=useMemo(()=>{
    const tq=D.s.totalQty||1;
    const vBk={};BK.forEach(b=>{vBk[b.k]=0;});
    gRows.forEach(r=>{const d=r[27],v=r[8]*r[25];if(d<=30)vBk['0-30']+=v;else if(d<=60)vBk['31-60']+=v;else if(d<=90)vBk['61-90']+=v;else if(d<=120)vBk['91-120']+=v;else if(d<=180)vBk['121-180']+=v;else if(d<=365)vBk['181-365']+=v;else vBk['365+']+=v;});
    const tVal=Object.values(vBk).reduce((s,v)=>s+v,0)||1;
    const pm={};gRows.forEach(r=>{const n=r[3];if(!pm[n])pm[n]={n,q:0,v:0,td:0,tq:0,sites:new Set()};pm[n].q+=r[8];pm[n].v+=r[8]*r[25];pm[n].td+=r[8]*r[27];pm[n].tq+=r[8];pm[n].sites.add(r[9]);});
    Object.values(pm).forEach(x=>{x.a=x.tq>0?Math.round(x.td/x.tq):0;x.sc=x.sites.size;});
    const allProds=Object.values(pm);
    const prods1t=[...allProds].filter(p=>p.q>=1000);
    const oldest10=[...prods1t].sort((a,b)=>b.a-a.a).slice(0,10);
    const youngest10=[...prods1t].sort((a,b)=>a.a-b.a).slice(0,10);
    const top10=[...allProds].sort((a,b)=>b.q-a.q).slice(0,10);
    const bot10=[...allProds].filter(p=>p.q>0).sort((a,b)=>a.q-b.q).slice(0,10);
    const mxP=top10[0]?.q||1;
    const rCounts=RL.map(r=>({...r,count:D.f.filter(r.fn).length,qty:D.f.filter(r.fn).reduce((s,f)=>s+f.q,0),facs:D.f.filter(r.fn)}));
    const donutSegs=[];let cumAngle=0;
    BK.forEach(b=>{const v=vBk[b.k]||0;const pct=v/tVal;if(pct>0){const a=pct*360;donutSegs.push({k:b.k,c:b.c,start:cumAngle,end:cumAngle+a,pct,v});cumAngle+=a;}});
    return{tq,vBk,tVal,oldest10,youngest10,top10,bot10,mxP,rCounts,donutSegs};
  },[gRows,D]);

  // ─── Memoized Yönetim computations ───
  const yonData=useMemo(()=>{
    const tq=D.s.totalQty||1;
    const compMap={};gRows.forEach(r=>{const c=r[1]||r[0]||'Diğer';const q=r[8];const v=r[8]*r[25];const d=r[27];if(!compMap[c])compMap[c]={n:c,q:0,v:0,td:0,tq:0,prods:new Set()};compMap[c].q+=q;compMap[c].v+=v;compMap[c].td+=q*d;compMap[c].tq+=q;compMap[c].prods.add(r[3]);});
    const comps=Object.values(compMap).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0,pc:x.prods.size})).sort((a,b)=>b.v-a.v);
    const heatData=comps.slice(0,10).map(c=>{const ag={};BK.forEach(b=>{ag[b.k]=0;});gRows.filter(r=>(r[1]||r[0])===c.n).forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});return{n:c.n,ag,total:c.q};});
    const facPerf=[...D.f].sort((a,b)=>b.v-a.v).slice(0,12);const maxFV=facPerf[0]?.v||1;
    const l2Map={};gRows.forEach(r=>{const l=r[17]||'Diğer';const q=r[8];const v=r[8]*r[25];const d=r[27];if(!l2Map[l])l2Map[l]={n:l,q:0,v:0,td:0,tq:0};l2Map[l].q+=q;l2Map[l].v+=v;l2Map[l].td+=q*d;l2Map[l].tq+=q;});
    const l2s=Object.values(l2Map).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.v-a.v).slice(0,8);const maxL2V=l2s[0]?.v||1;
    const crit365=gRows.filter(r=>r[27]>=365);const critQty=crit365.reduce((s,r)=>s+r[8],0);const critVal=crit365.reduce((s,r)=>s+r[8]*r[25],0);
    const crit180=gRows.filter(r=>r[27]>=180);const c180Qty=crit180.reduce((s,r)=>s+r[8],0);
    const topCritProd={};crit365.forEach(r=>{const n=r[3];if(!topCritProd[n])topCritProd[n]={n,q:0,v:0,a:0,td:0,tq:0,sites:new Set()};topCritProd[n].q+=r[8];topCritProd[n].v+=r[8]*r[25];topCritProd[n].td+=r[8]*r[27];topCritProd[n].tq+=r[8];topCritProd[n].sites.add(r[9]);});
    const critProds=Object.values(topCritProd).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0,sc:x.sites.size})).sort((a,b)=>b.v-a.v).slice(0,8);
    const typeStats=Object.entries(TI).map(([k,v])=>{const fcs=D.f.filter(f=>f.type===k);return{k,l:v.label,c:v.color,count:fcs.length,q:fcs.reduce((s,f)=>s+f.q,0),v:fcs.reduce((s,f)=>s+f.v,0),a:fcs.length>0?Math.round(fcs.reduce((s,f)=>s+f.a*f.q,0)/(fcs.reduce((s,f)=>s+f.q,0)||1)):0};}).filter(t=>t.count>0);
    const avgAge=D.s.avgAge;const critPct=tq>0?((critQty/tq)*100):0;const c180Pct=tq>0?((c180Qty/tq)*100):0;
    const worstFac=[...D.f].sort((a,b)=>b.a-a.a)[0];const bestFac=[...D.f].sort((a,b)=>a.a-b.a)[0];
    const topComp=comps[0];const worstComp=[...comps].sort((a,b)=>b.a-a.a)[0];
    // Grup bazlı analiz
    const grpMap={};gRows.forEach(r=>{const c=r[0]||'';const g=gGrp(c);const q=r[8];const v=r[8]*r[25];const d=r[27];if(!grpMap[g])grpMap[g]={n:g,q:0,v:0,td:0,tq:0,crit:0,critV:0,comps:new Set()};grpMap[g].q+=q;grpMap[g].v+=v;grpMap[g].td+=q*d;grpMap[g].tq+=q;grpMap[g].comps.add(r[1]||r[0]||'');if(d>=365){grpMap[g].crit+=q;grpMap[g].critV+=v;}});
    const grps=Object.values(grpMap).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0,cc:x.comps.size,critPct:x.q>0?((x.crit/x.q)*100):0})).sort((a,b)=>b.v-a.v);
    const worstGrp=[...grps].filter(g=>g.n!=='Diğer').sort((a,b)=>b.a-a.a)[0];
    const topGrp=grps.filter(g=>g.n!=='Diğer')[0];
    const critGrps=grps.filter(g=>g.critPct>5&&g.n!=='Diğer');
    const insights=[];
    if(critPct>5)insights.push({icon:AlertTriangle,c:'#e5484d',bg:'rgba(229,72,77,.06)',t:'Kritik Yaşlanma Uyarısı',d:`Toplam stoğun %${critPct.toFixed(1)}'i 365+ gün yaşında. Değeri $${fmt(critVal)}. Acil değerlendirme gerektirir.`});
    else if(critPct>0)insights.push({icon:ShieldAlert,c:'#ea580c',bg:'rgba(234,88,12,.06)',t:'Yaşlı Stok İzleme',d:`365+ gün stok oranı %${critPct.toFixed(1)} — kontrol altında. ${fN(Math.round(critQty))} kg stok bu grupta.`});
    if(worstGrp&&grps.length>1)insights.push({icon:Building2,c:'#6366f1',bg:'rgba(99,102,241,.06)',t:'Grup Performansı',d:`${worstGrp.n} ort. ${worstGrp.a} gün yaş ile en yüksek (${worstGrp.cc} şirket). ${topGrp?.n||'-'} $${fmt(topGrp?.v||0)} ile en büyük portföy.`});
    if(critGrps.length>0){const cg=critGrps[0];insights.push({icon:AlertTriangle,c:'#e5484d',bg:'rgba(229,72,77,.06)',t:`${cg.n} Grubu Risk Altında`,d:`Grubun %${cg.critPct.toFixed(1)}'i 365+ gün yaşında (${fmtTon(cg.crit)}). ${cg.cc} şirket bu gruptan etkileniyor.`});}
    if(c180Pct>20)insights.push({icon:Zap,c:'#f5a623',bg:'rgba(245,166,35,.06)',t:'180+ Gün Yoğunluğu',d:`Stoğun %${c180Pct.toFixed(1)}'i 180 günü aşmış. Toplam ${fmtTon(c180Qty)} stok 6 aydan eski.`});
    if(worstFac)insights.push({icon:Target,c:'#8b5cf6',bg:'rgba(139,92,246,.06)',t:'Tesis Karşılaştırma',d:`En yüksek yaş: ${worstFac.n} (${worstFac.a} gün). En düşük: ${bestFac?.n||'-'} (${bestFac?.a||0} gün). Fark: ${(worstFac.a-(bestFac?.a||0))} gün.`});
    if(worstComp&&comps.length>1)insights.push({icon:Building2,c:'#3b82f6',bg:'rgba(59,130,246,.06)',t:'Şirket Performansı',d:`${worstComp.n} ort. ${worstComp.a} gün yaş ile en yüksek. ${topComp.n} $${fmt(topComp.v)} değer ile en büyük portföy.`});
    const actions=[];
    if(critProds.length>0)actions.push({pri:'Yüksek',c:'#e5484d',bg:'rgba(229,72,77,.06)',t:`${critProds.length} ürün 365+ gün yaşında — eritme planı oluşturun`,sub:`En büyük: ${critProds[0].n} (${fmtTon(critProds[0].q)}, $${fmt(critProds[0].v)})`});
    if(critGrps.length>0)actions.push({pri:'Yüksek',c:'#6366f1',bg:'rgba(99,102,241,.06)',t:`${critGrps.map(g=>g.n).join(', ')} grubunda kritik stok yoğunlaşması`,sub:`${critGrps.length} grupta 365+ gün stok oranı %5'in üzerinde — grup bazlı eritme stratejisi gerekli`});
    if(worstFac&&worstFac.a>180)actions.push({pri:'Yüksek',c:'#ea580c',bg:'rgba(234,88,12,.06)',t:`${worstFac.n} tesisi yaş ortalaması ${worstFac.a} gün`,sub:'Tesis bazlı stok devir hızını artırın'});
    if(c180Pct>15)actions.push({pri:'Orta',c:'#f5a623',bg:'rgba(245,166,35,.06)',t:`180+ gün stok oranını %${c180Pct.toFixed(0)}'den düşürün`,sub:'Satış ve lojistik ile koordineli aksiyon planı'});
    if(grps.filter(g=>g.n!=='Diğer').length>1){const ages=grps.filter(g=>g.n!=='Diğer').map(g=>g.a);const spread=Math.max(...ages)-Math.min(...ages);if(spread>30)actions.push({pri:'Orta',c:'#8b5cf6',bg:'rgba(139,92,246,.06)',t:`Gruplar arası ${spread} gün yaş farkı — dengeleme fırsatı`,sub:'Yüksek yaşlı gruplardan transfer veya öncelikli satış planı'});}
    if(D.s.facilityCount>5)actions.push({pri:'Normal',c:'#3b82f6',bg:'rgba(59,130,246,.06)',t:`${D.s.facilityCount} tesis arasında stok dengeleme analizi`,sub:'Yüksek yaşlı tesislerden düşük yaşlı tesislere transfer değerlendirmesi'});
    actions.push({pri:'Bilgi',c:'#0d6e4f',bg:'rgba(45,212,160,.06)',t:`${D.s.prodCount} ürün, ${D.s.cityCount} şehir, ${D.s.facilityCount} tesis aktif izleniyor`,sub:`${grps.filter(g=>g.n!=='Diğer').length} şirket grubu takipte — sistem nominal durumda`});
    return{comps,heatData,facPerf,maxFV,l2s,maxL2V,critQty,critVal,c180Qty,critProds,typeStats,avgAge,critPct,c180Pct,insights,actions};
  },[gRows,D]);

  // ─── MSAL Auth State ───
  const [msalReady,setMsalReady]=useState(false);
  const [msalAccount,setMsalAccount]=useState(null);
  const [authLoading,setAuthLoading]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [erpLoading,setErpLoading]=useState(false);
  const [erpStatus,setErpStatus]=useState('');
  const [erpError,setErpError]=useState('');
  const [erpRaw,setErpRaw]=useState([]);  // raw Dataverse records
  const [erpFields,setErpFields]=useState([]);  // actual field names
  const [erpSearch,setErpSearch]=useState('');
  const [rawPage,setRawPage]=useState(0);
  const [erpPage,setErpPage]=useState(0);
  const RAWF_INIT={grp:'',comp:'',madde:'',urun:'',mense:'',tesis:'',l2:'',l3:'',miktarMin:'',miktarMax:'',gunMin:'',gunMax:'',risk:'',trader:'',mtrader:''};
  const [rawFilter,setRawFilter]=useState(RAWF_INIT);
  const [showRawFilter,setShowRawFilter]=useState(false);
  const [pageSize,setPageSize]=useState(100);
  const ERP_KEEP=useMemo(()=>new Set(['mserp_inventcolorid','mserp_closingpricemst','mserp_purchlifo','mserp_purchpricemst','mserp_amountmst','mserp_qty','mserp_itemname','mserp_headerreportdate','mserp_companyid','mserp_etgproductlevel03name','mserp_sfilotid','mserp_purchweav','mserp_amountsec','mserp_itemid','mserp_inventsizeid','mserp_inventdimension1','mserp_etgproductlevel02name','mserp_inventlocationid','mserp_prodweav','mserp_purchfifo','mserp_purchpricesec','mserp_prodfifo','mserp_prodlifo','mserp_vesselassignmentid','mserp_etgproductlevel01name','mserp_inventsiteid','mserp_inventsitename','mserp_pricesec','mserp_companyname','mserp_product','mserp_closingpricesec','mserp_pricemst','mserp_etgproductlevel04name','mserp_inventbatchid','mserp_inventdimension2','versionnumber','mserp_inventlocationname','mserp_traderid','mserp_maintraderid','mserp_tradername','mserp_maintradername']),[]);

  // ─── Satış Tahmini (fcst) ──────────────────────────────────
  const [fcstTrader,setFcstTrader]=useState([]);  // multi-select: trader code array
  const [fcstHorizon,setFcstHorizon]=useState(12);
  const [fcstMetric,setFcstMetric]=useState('qty');
  const [fcstActiveModel,setFcstActiveModel]=useState(null);
  const [fcstResult,setFcstResult]=useState(null);
  const [fcstLoading,setFcstLoading]=useState(false);
  const [fcstStatus,setFcstStatus]=useState('');
  const [fcstError,setFcstError]=useState('');
  const [fcstTraderList,setFcstTraderList]=useState([]);
  const [fcstTraderListLoading,setFcstTraderListLoading]=useState(false);
  const [fcstStep,setFcstStep]=useState(0);  // 0=idle, 1=fetch, 2=aggregate, 3=models, 4=backtest, 5=bestFit, 6=done
  const [fcstStepData,setFcstStepData]=useState({});  // her aşamadan veri (rows count, model results vs.)
  const [fcstHoverIdx,setFcstHoverIdx]=useState(null);  // grafikte hover edilen ay indexi
  const [fcstHoverModel,setFcstHoverModel]=useState(null);  // modeli üzerinde hover (id)
  const [fcstChartW,setFcstChartW]=useState(1200);  // gerçek container genişliği (responsive, no stretch)
  const fcstChartRef=useRef(null);
  useEffect(()=>{
    if(!fcstChartRef.current)return;
    const update=()=>{const w=fcstChartRef.current?.getBoundingClientRect()?.width;if(w&&w>200)setFcstChartW(Math.round(w));};
    update();
    const ro=new ResizeObserver(update);
    ro.observe(fcstChartRef.current);
    return()=>ro.disconnect();
  },[fcstResult,pg]);

  const loadFcstTraderList=useCallback(async()=>{
    if(!msalAccount||fcstTraderList.length>0||fcstTraderListLoading)return;
    try{
      const cached=localStorage.getItem('tyrowms_fcst_traders_v2');
      if(cached){
        const p=JSON.parse(cached);
        if(p&&p.fetchedAt&&Date.now()-p.fetchedAt<86400000&&Array.isArray(p.list)){
          setFcstTraderList(p.list);return;
        }
      }
    }catch(_){}
    setFcstTraderListLoading(true);
    try{
      const token=await getDataverseToken(msalAccount);
      const map=await fetchTraderNames(token);
      // Sadece TRD- veya DNM- prefix'li trader'lar; format "CODE : Name"
      const list=[...map.entries()]
        .filter(([code])=>{const c=String(code||'').toUpperCase();return c.startsWith('TRD-')||c.startsWith('TRD_')||c.startsWith('TRD')||c.startsWith('DNM-')||c.startsWith('DNM_')||c.startsWith('DNM');})
        .filter(([code])=>{const c=String(code||'').toUpperCase();return /^(TRD|DNM)[-_A-Z0-9]*$/.test(c);})
        .map(([code,name])=>({code,name,label:name?`${code} : ${name}`:code}))
        .sort((a,b)=>a.label.localeCompare(b.label,'tr'));
      setFcstTraderList(list);
      try{localStorage.setItem('tyrowms_fcst_traders_v2',JSON.stringify({fetchedAt:Date.now(),list}));}catch(_){}
    }catch(e){console.warn('Trader list yüklenemedi:',e);}
    finally{setFcstTraderListLoading(false);}
  },[msalAccount,fcstTraderList.length,fcstTraderListLoading]);

  useEffect(()=>{if(pg==='fcst')loadFcstTraderList();},[pg,loadFcstTraderList]);

  const runForecast=useCallback(async()=>{
    const traders=Array.isArray(fcstTrader)?fcstTrader:(fcstTrader?[fcstTrader]:[]);
    if(traders.length===0||!msalAccount||fcstLoading)return;
    setFcstLoading(true);setFcstError('');setFcstStatus('');
    setFcstStep(1);setFcstStepData({});
    setFcstResult(null);  // önceki sonucu temizle ki yeni hesaplama belli olsun
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    try{
      // Cache key v3: multi-trader desteği için sıralanmış kodlar
      const cacheKey=`tyrowms_fcst_v3_${[...traders].sort().join('+')}`;
      let aggMap=null,profile=null,valueAvailable=false,fromCache=false,recordCount=0,fetchMode='aggregate';
      try{
        const cached=localStorage.getItem(cacheKey);
        if(cached){
          const p=JSON.parse(cached);
          if(p&&p.fetchedAt&&Date.now()-p.fetchedAt<86400000){
            aggMap=p.aggMap;profile=p.profile;valueAvailable=p.valueAvailable;recordCount=p.recordCount||0;fromCache=true;fetchMode=p.fetchMode||'aggregate';
            setFcstStepData(d=>({...d,fetched:{count:recordCount,fromCache:true,mode:fetchMode}}));
          }
        }
      }catch(_){}
      if(!aggMap){
        // Önce aggregate path dene — Hasata gibi 80K+ satırlı trader'lar için 25-30sn → 3-5sn
        try{
          const agg=await fetchHistoricalAggregatesByTrader(msalAccount,traders,{
            onProgress:(loaded,total)=>setFcstStepData(d=>({...d,fetched:{loaded,total,fromCache:false,mode:'aggregate'}})),
          });
          aggMap=aggregateFromServer(agg.monthly);
          profile=buildTraderProfileFromAggregates(aggMap,agg.products,agg.accounts,agg.companies,gGrp);
          recordCount=agg.monthly.length;
          fetchMode='aggregate';
          valueAvailable=false;  // aggregate path tutar getirmez (v1)
        }catch(aggErr){
          console.warn('[Forecast] Aggregate fetch failed, raw fallback:',aggErr);
          fetchMode='raw';
          setFcstStepData(d=>({...d,fetched:{loaded:0,total:null,fromCache:false,mode:'raw',aggError:aggErr.message||String(aggErr)}}));
          // Fallback: raw fetch (mevcut akış, tutar discovery dahil)
          const fetchRes=await fetchHistoricalSalesByTrader(msalAccount,traders,{
            onProgress:(loaded,total)=>setFcstStepData(d=>({...d,fetched:{loaded,total,fromCache:false,mode:'raw'}})),
          });
          recordCount=fetchRes.records.length;
          setFcstStep(2);await wait(120);
          aggMap=aggregateMonthly(fetchRes.records,{valueField:fetchRes.valueField});
          profile=buildTraderProfile(fetchRes.records,gGrp,aggMap);
          valueAvailable=!!fetchRes.valueField;
        }
        setFcstStep(2);await wait(120);
        try{localStorage.setItem(cacheKey,JSON.stringify({fetchedAt:Date.now(),aggMap,profile,valueAvailable,recordCount,fetchMode}));}catch(_){}
      } else {
        setFcstStep(2);await wait(120);
      }
      setFcstStepData(d=>({...d,aggregate:{months:Object.keys(aggMap).length,records:recordCount}}));
      setFcstStep(3);await wait(160);
      const seriesQty=mapToSeries(aggMap);
      // Modelleri tek tek koşturup UI'da progressively göster
      setFcstStepData(d=>({...d,modelsRunning:'Holt-Winters'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'Outlier STL+ETS'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'Theta'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:"Holt's Linear"}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'STL+ETS'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'Seasonal Naive'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'Croston'}));await wait(50);
      setFcstStepData(d=>({...d,modelsRunning:'Moving Avg'}));await wait(50);
      setFcstStep(4);await wait(140);
      const fitQty=selectBestFit(seriesQty.qty,fcstHorizon);
      let fitValue=null;
      if(seriesQty.valueAvailable&&seriesQty.value){
        fitValue=selectBestFit(seriesQty.value,fcstHorizon);
      }
      setFcstStepData(d=>({...d,backtest:{models:fitQty.results.filter(r=>!r.skipped).length}}));
      setFcstStep(5);await wait(150);
      setFcstStepData(d=>({...d,bestFit:{id:fitQty.bestId,mape:fitQty.results.find(r=>r.id===fitQty.bestId)?.mape}}));
      await wait(200);
      setFcstStep(6);
      setFcstResult({series:seriesQty,profile,fitQty,fitValue,valueAvailable,traderCode:traders.length===1?traders[0]:traders.join('+'),traderCodes:traders,horizon:fcstHorizon,fetchedAt:Date.now(),fromCache,recordCount});
      setFcstActiveModel(null);
      await wait(300);
      setFcstStep(0);
    }catch(e){
      setFcstError(e.message||'Tahmin hesaplanamadı');
      setFcstStatus('');
      setFcstStep(0);
    }finally{setFcstLoading(false);}
  },[fcstTrader,fcstHorizon,msalAccount,fcstLoading]);

  // ─── MSAL Init ───
  useEffect(()=>{
    if(!MSAL_ENABLED)return;
    let mounted=true;
    initMsal().then(inst=>{
      if(!mounted||!inst)return;
      setMsalReady(true);
      const acc=inst.getAllAccounts()[0]||null;
      if(acc)setMsalAccount(acc);
    }).catch(()=>{if(mounted)setMsalReady(true);});
    return()=>{mounted=false;};
  },[]);

  // ─── Trend Data Fetch (panel açıkken + metric/filtre/arama değiştikçe) ───
  useEffect(()=>{
    if(!trendKPI||!msalAccount)return;
    let cancelled=false;
    (async()=>{
      setTrendLoading(true);setTrendErr(null);setTrendRaw([]);
      try{
        const gf={...gFilter};
        if(gFilter.grp){
          gf.grpCompanies=Object.entries(CGRP).filter(([_,v])=>v===gFilter.grp).map(([k])=>k);
          delete gf.grp;
        }
        // Global arama terimlerini geç
        const terms=gSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if(terms.length>0)gf.searchTerms=terms;
        // Transit/Fark ambar bayrakları — dashboard calcRows davranışını trend'e taşı
        gf.incTransit=incTransit;
        gf.incFark=incFark;
        const data=await fetchKPITrend(msalAccount,gf,trendKPI);
        if(!cancelled)setTrendRaw(data);
      }catch(e){
        if(!cancelled)setTrendErr(e.message||'Trend verisi alınamadı');
      }finally{
        if(!cancelled)setTrendLoading(false);
      }
    })();
    return()=>{cancelled=true;};
  },[trendKPI,gFilter,gSearch,msalAccount,incTransit,incFark]);

  // KPI Metric Config — her kart için ayrı
  const KPI_METRICS=useMemo(()=>({
    qty:           {label:'Toplam Stok',           subtitle:'Miktar trendi',                c:$.blu,      bg:$.bluB, icon:Package,       fmt:v=>fmtTon(v),              fmtShort:v=>fmtShortTon(v)},
    value:         {label:'Toplam Değer',          subtitle:'USD değer trendi',             c:'#0d6e4f',  bg:$.grnB, icon:TrendingUp,    fmt:v=>'$'+fmt(v),             fmtShort:v=>'$'+fmtShortNum(v)},
    facilities:    {label:'Tesis Sayısı',          subtitle:'Benzersiz tesis sayısı',       c:$.pur,      bg:$.purB, icon:Building2,     fmt:v=>fN(Math.round(v)),      fmtShort:v=>String(Math.round(v))},
    products:      {label:'Aktif Ürün',            subtitle:'Benzersiz ürün sayısı',        c:$.tel,      bg:$.telB, icon:Layers,        fmt:v=>fN(Math.round(v)),      fmtShort:v=>String(Math.round(v))},
    avgAge:        {label:'Ort. Yaşlanma (FIFO)',  subtitle:'PurchFIFO ortalaması (gün)',   c:$.org,      bg:$.orgB, icon:Clock,         fmt:v=>Math.round(v)+' gün',   fmtShort:v=>Math.round(v)+'g'},
    criticalStock: {label:'Kritik Stok (180+ gün)',subtitle:'180+ gün yaşlı stok miktarı',  c:$.red,      bg:$.redB, icon:AlertTriangle, fmt:v=>fmtTon(v),              fmtShort:v=>fmtShortTon(v)},
  }),[]);

  // Trend için hesaplanmış data point'ler
  const trendPoints=useMemo(()=>{
    if(trendMode==='year')return getYearlyPoints(trendRaw);
    if(trendMode==='quarter')return getQuarterlyPoints(trendRaw,trendYear);
    const all=getMonthlyPoints(trendRaw,trendYear);
    return trendMonth!==null?all.filter(p=>p.month===trendMonth):all;
  },[trendRaw,trendMode,trendYear,trendMonth]);

  // % değişim cache'i güncelle — panel açıkken son iki noktanın farkı
  useMemo(()=>{
    if(!trendKPI||!trendPoints||trendPoints.length<2)return;
    const valid=trendPoints.filter(p=>p.value!=null);
    if(valid.length<2)return;
    const cur=valid[valid.length-1].value,prev=valid[valid.length-2].value;
    if(!prev||prev===0)return;
    trendPctCache.current[trendKPI]=((cur-prev)/prev)*100;
  },[trendKPI,trendPoints]);

  // Trend yıl seçenekleri (verideki unique yıllar, son 3 yılla sınırlı zaten)
  const trendYearOpts=useMemo(()=>{
    const years=[...new Set(trendRaw.map(d=>new Date(d.date).getFullYear()))].sort();
    if(years.length===0){const y=new Date().getFullYear();return[y-2,y-1,y];}
    return years;
  },[trendRaw]);

  const handleLogin=useCallback(async()=>{
    if(!msalReady)return;
    setAuthLoading(true);
    try{await loginRedirect();}
    catch(err){if(err.errorCode!=='user_cancelled')setErpError('Giriş başarısız');setAuthLoading(false);}
  },[msalReady]);

  const handleLogout=useCallback(async()=>{
    try{await logout(msalAccount);}catch(_){/* silent */}
    setMsalAccount(null);setProfileOpen(false);
  },[msalAccount]);

  const handleErpFetch=useCallback(async()=>{
    if(!msalAccount)return;
    setErpLoading(true);setErpError('');setErpStatus('Bağlanılıyor...');
    try{
      const{rows:newRows,rawRecords}=await fetchErpData(msalAccount,s=>setErpStatus(s));
      setRows(newRows);setSearch('');setSelRows(new Set());
      // Store raw records for ERP Verileri page — only approved fields
      if(rawRecords&&rawRecords.length>0){
        const fields=Object.keys(rawRecords[0]).filter(k=>!k.includes('@')&&!k.startsWith('_')&&ERP_KEEP.has(k));
        setErpFields(fields);
        setErpRaw(rawRecords);
      }
      setErpStatus(`${newRows.length} satır başarıyla yüklendi`);
      setTimeout(()=>setErpStatus(''),4000);
    }catch(err){
      setErpError(err.message||'Veri çekilemedi');
      setErpStatus('');
    }finally{setErpLoading(false);}
  },[msalAccount]);


  const l2Data=useMemo(()=>{
    if(drillWh)return getL2(calcRows,r=>r[11]===drillWh);
    if(drillFac)return getL2(calcRows,r=>r[9]===drillFac);
    return null;
  },[drillFac,drillWh,calcRows]);

  const prodData=useMemo(()=>{
    if(!drillL2)return null;
    const base=calcRows.filter(r=>(drillWh?r[11]===drillWh:drillFac?r[9]===drillFac:false)&&r[17]===drillL2);
    const m={};
    base.forEach(r=>{const n=r[3]||'Bilinmiyor';const q=r[8];const v=r[8]*r[25];const d=r[27];if(!m[n])m[n]={n,q:0,v:0,td:0,tq:0};m[n].q+=q;m[n].v+=v;m[n].td+=q*d;m[n].tq+=q;});
    return Object.values(m).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.q-a.q);
  },[drillL2,drillFac,drillWh,calcRows]);

  const mQ=Math.max(...D.ct.map(c=>c.q),1);

  const rawFilterOpts=useMemo(()=>({
    grps:[...new Set(rows.map(r=>gGrp(r[0])))].filter(Boolean).sort(),
    comps:[...new Set(rows.map(r=>r[1]||r[0]||''))].filter(Boolean).sort(),
    menses:[...new Set(rows.map(r=>r[4]||''))].filter(v=>v).sort(),
    tesisler:[...new Set(rows.map(r=>r[10]||''))].filter(v=>v).sort(),
    l2s:[...new Set(rows.map(r=>r[17]||''))].filter(v=>v).sort(),
    l3s:[...new Set(rows.map(r=>r[19]||''))].filter(v=>v).sort(),
    traders:[...new Set(rows.map(r=>traderLabel(r[34],r[36])))].filter(v=>v).sort(),
    mtraders:[...new Set(rows.map(r=>traderLabel(r[35],r[37])))].filter(v=>v).sort(),
  }),[rows]);
  const activeFilterCount=useMemo(()=>Object.values(rawFilter).filter(v=>v!=='').length,[rawFilter]);
  const filtered=useMemo(()=>{
    let r=rawRows;
    if(search.trim()){const s=search.toLowerCase();r=r.filter(row=>row.some(v=>String(v).toLowerCase().includes(s)));}
    if(rawFilter.grp)r=r.filter(row=>gGrp(row[0])===rawFilter.grp);
    if(rawFilter.comp)r=r.filter(row=>(row[1]||row[0]||'')===rawFilter.comp);
    if(rawFilter.madde)r=r.filter(row=>String(row[2]||'').toLowerCase().includes(rawFilter.madde.toLowerCase()));
    if(rawFilter.urun)r=r.filter(row=>String(row[3]||'').toLowerCase().includes(rawFilter.urun.toLowerCase()));
    if(rawFilter.mense)r=r.filter(row=>row[4]===rawFilter.mense);
    if(rawFilter.tesis)r=r.filter(row=>row[10]===rawFilter.tesis);
    if(rawFilter.l2)r=r.filter(row=>row[17]===rawFilter.l2);
    if(rawFilter.l3)r=r.filter(row=>row[19]===rawFilter.l3);
    if(rawFilter.trader)r=r.filter(row=>traderLabel(row[34],row[36])===rawFilter.trader);
    if(rawFilter.mtrader)r=r.filter(row=>traderLabel(row[35],row[37])===rawFilter.mtrader);
    if(rawFilter.miktarMin!=='')r=r.filter(row=>row[8]>=Number(rawFilter.miktarMin));
    if(rawFilter.miktarMax!=='')r=r.filter(row=>row[8]<=Number(rawFilter.miktarMax));
    if(rawFilter.gunMin!=='')r=r.filter(row=>row[27]>=Number(rawFilter.gunMin));
    if(rawFilter.gunMax!=='')r=r.filter(row=>row[27]<=Number(rawFilter.gunMax));
    if(rawFilter.risk){const rng={fresh:[0,60],normal:[60,180],risky:[180,365],critical:[365,1e9]};const[mn,mx]=rng[rawFilter.risk]||[0,1e9];r=r.filter(row=>row[27]>=mn&&row[27]<mx);}
    return r;
  },[rawRows,search,rawFilter]);
  const sorted=useMemo(()=>[...filtered].sort((a,b)=>{const x=a[rC],y=b[rC];return(typeof x==='number'?(x-y):String(x).localeCompare(String(y)))*rD;}),[filtered,rC,rD]);
  useEffect(()=>{setRawPage(0);},[search,rC,rD,rawFilter]);
  useEffect(()=>{setErpPage(0);},[erpSearch]);

  const handleDelete=()=>{if(selRows.size===0)return;setRows(prev=>prev.filter((_,i)=>!selRows.has(i)));setSelRows(new Set());};
  const handleImport=(e)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=(evt)=>{try{
    const doIt=()=>{const wb=window.XLSX.read(new Uint8Array(evt.target.result),{type:'array',cellDates:true});const json=window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    const imp=json.map(r=>[String(r['Şirket hesapları kodu']||''),String(r['Şirket adı']||''),String(r['Madde kodu']||''),String(r['Ürün adı']||''),String(r['Menşe']||''),String(r['Proje no']||''),String(r['Ambalaj tipi']||''),String(r['Gümrük durumu']||''),Math.round(Number(r['Miktar'])||0),String(r['Tesis']||''),String(r['Tesis adı']||''),String(r['Depo']||''),String(r['Ambar adı']||''),String(r['Parti numarası']||''),String(r['Seviye 1']||''),String(r['Seviye 1 Adı']||''),String(r['Seviye 2']||''),String(r['Seviye 2 Adı']||''),String(r['Seviye 3']||''),String(r['Seviye 3 Adı']||''),String(r['Seviye 4']||''),String(r['Seviye 4 Adı']||''),String(r['Seviye 5']||''),String(r['Seviye 5 Adı']||''),Math.round((Number(r['Birim fiyat (şirket para birimi)'])||0)*100)/100,Math.round((Number(r['Birim fiyat (raporlama para birimi)'])||0)*10000)/10000,Math.round((Number(r['PurchWEAV'])||0)*100)/100,Math.round(Number(r['PurchFIFO'])||0),Math.round(Number(r['PurchLIFO'])||0),Math.round(Number(r['ProdWEAV'])||0),Math.round(Number(r['ProdFIFO'])||0),Math.round(Number(r['ProdLIFO'])||0),Math.round(Number(r['Sitting in site day'])||0)]);
    setRows(imp);setSearch('');setSelRows(new Set());};
    if(window.XLSX)doIt();else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);}
  }catch(err){alert('Hata: '+err.message);}};reader.readAsArrayBuffer(file);e.target.value='';};

  const sd=useMemo(()=>{
    if(!sel)return null;const ct=D.ct.find(c=>c.n===sel);if(!ct)return null;
    const facs=D.f.filter(f=>ct.fcs.includes(f.id));
    const whs=D.w.filter(w=>ct.fcs.includes(w.fc));
    const tQ=facs.reduce((s,f)=>s+f.q,0);
    const tV=facs.reduce((s,f)=>s+f.v,0);
    const tWh=facs.reduce((s,f)=>s+f.wc,0);
    const tPc=facs.reduce((s,f)=>s+f.pc,0);
    const avgA=tQ>0?Math.round(facs.reduce((s,f)=>s+f.a*f.q,0)/tQ):0;
    const cityAg=agingOf(calcRows,facs.map(f=>f.id));
    return{ct,facs,whs,tQ,tV,tWh,tPc,avgA,cityAg};
  },[sel,D,calcRows]);

  // Emerging Markets selected country data
  const emSD=useMemo(()=>{
    if(!emSel)return null;const ct=DW.countries.find(c=>c.n===emSel);if(!ct)return null;
    const facs=DW.f.filter(f=>ct.fcs.includes(f.id));
    const whs=DW.w.filter(w=>ct.fcs.includes(w.fc));
    const tQ=facs.reduce((s,f)=>s+f.q,0);
    const tV=facs.reduce((s,f)=>s+f.v,0);
    const tWh=facs.reduce((s,f)=>s+f.wc,0);
    const tPc=facs.reduce((s,f)=>s+f.pc,0);
    const avgA=tQ>0?Math.round(facs.reduce((s,f)=>s+f.a*f.q,0)/tQ):0;
    const countryAg=agingOf(calcRows,facs.map(f=>f.id));
    return{ct,facs,whs,tQ,tV,tWh,tPc,avgA,countryAg};
  },[emSel,DW,calcRows]);

  const emL2Data=useMemo(()=>{
    if(emDrillWh)return getL2(calcRows,r=>r[11]===emDrillWh);
    if(emDrillFac)return getL2(calcRows,r=>r[9]===emDrillFac);
    return null;
  },[emDrillFac,emDrillWh,calcRows]);

  const emProdData=useMemo(()=>{
    if(!emDrillL2)return null;
    const base=calcRows.filter(r=>(emDrillWh?r[11]===emDrillWh:emDrillFac?r[9]===emDrillFac:false)&&r[17]===emDrillL2);
    const m={};base.forEach(r=>{const n=r[3]||'Bilinmiyor';const q=r[8];const v=r[8]*r[25];const d=r[27];if(!m[n])m[n]={n,q:0,v:0,td:0,tq:0};m[n].q+=q;m[n].v+=v;m[n].td+=q*d;m[n].tq+=q;});
    return Object.values(m).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.q-a.q);
  },[emDrillL2,emDrillFac,emDrillWh,calcRows]);

  const clr=(cls)=>({blu:{c:$.blu,bg:$.bluB},grn:{c:'#0d6e4f',bg:$.grnB},pur:{c:$.pur,bg:$.purB},org:{c:$.org,bg:$.orgB},red:{c:$.red,bg:$.redB},tel:{c:$.tel,bg:$.telB}}[cls]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOGIN SCREEN — Interactive Globe + Liquid Glass
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if(MSAL_ENABLED&&!msalAccount){
    const features=[
      {icon:BarChart3,t:'Gerçek Zamanlı Dashboard',d:'Tüm depo ve tesislerin anlık stok durumu, yaşlanma analizi ve KPI takibi'},
      {icon:MapPin,t:'Coğrafi Görünürlük',d:'Türkiye haritası üzerinde tesis bazlı stok dağılımı ve ısı haritası'},
      {icon:Eye,t:'AI Destekli İçgörüler',d:'Yapay zeka ile stok optimizasyonu, risk tespiti ve aksiyon önerileri'},
      {icon:ShieldAlert,t:'Risk Radarı',d:'Kritik yaşlanma uyarıları, FIFO analizi ve erken müdahale sistemi'},
    ];
    return(
      <div style={{fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif",minHeight:'100vh',background:'linear-gradient(135deg,#f0f4f8 0%,#e8f0f2 40%,#eef2f7 100%)',position:'relative',overflow:'hidden'}}>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
        <style>{`
          @keyframes splashFadeUp{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
          @keyframes fadeInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
          @keyframes featureIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
          @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(45,212,160,.12)}50%{box-shadow:0 0 40px rgba(45,212,160,.22)}}
          @keyframes titleReveal{from{opacity:0;transform:translateY(20px);filter:blur(8px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
          @keyframes subtitleFade{from{opacity:0}to{opacity:1}}
          @keyframes cardFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes portalOpen{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3);filter:blur(12px)}40%{opacity:1;filter:blur(0)}100%{transform:translate(-50%,-50%) scale(1)}}
          @keyframes portalRing{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.5);opacity:0}}
          @keyframes vignetteIn{0%{opacity:0}100%{opacity:1}}
          @keyframes flashBang{0%{opacity:0}30%{opacity:1}100%{opacity:1}}
          @keyframes typeChar{from{width:0}to{width:100%}}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
          .login-btn{transition:all .25s cubic-bezier(.4,0,.2,1)!important}
          .login-btn:hover{transform:scale(1.03)!important;box-shadow:0 8px 32px rgba(99,102,241,.4)!important}
          .login-btn:active{transform:scale(.97)!important}
          .feat-pill{transition:all .25s cubic-bezier(.4,0,.2,1)!important}
          .feat-pill:hover{background:rgba(255,255,255,.75)!important;transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(0,0,0,.06)!important}
          .login-card{transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s ease}
          .login-card:hover{transform:translateY(-4px);box-shadow:0 28px 70px rgba(0,0,0,.09),inset 0 1px 0 rgba(255,255,255,.8)!important}
        `}</style>

        {/* 3D Interactive Globe — full background */}
        <Suspense fallback={null}>
          <LoginGlobe/>
        </Suspense>

        {/* Overlay content */}
        <div style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:mob?'column':'row',alignItems:'center',justifyContent:mob?'center':'flex-start',padding:mob?'2rem 1.2rem':'2.5rem 3rem',gap:mob?20:40}}>

          {/* Left — Frosted panel ile brand + features */}
          <div data-login-panel style={{maxWidth:mob?'100%':520,animation:'fadeInLeft .6s cubic-bezier(.16,1,.3,1)',textAlign:mob?'center':undefined,
            background:'rgba(255,255,255,.45)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',
            borderRadius:mob?20:28,padding:mob?'1.5rem':'2.2rem 2.5rem',border:'1px solid rgba(255,255,255,.55)',
            boxShadow:'0 8px 32px rgba(0,0,0,.04)'}}>
            {/* Logo — ilk gelen element */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:mob?14:22,justifyContent:mob?'center':undefined,animation:'fadeInLeft .7s cubic-bezier(.16,1,.3,1) .1s both'}}>
              <svg width="42" height="42" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 2px 8px rgba(99,102,241,.2))'}}>
                <defs>
                  <linearGradient id="tyro-lg2" x1="61.29" y1="116.53" x2="14.04" y2="47.15" gradientTransform="translate(0 150.55) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2dd4a0"/><stop offset="1" stopColor="#0d6e4f"/></linearGradient>
                  <linearGradient id="tyro-la2" x1="60" y1="10" x2="130" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3b82f6"/><stop offset=".5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient>
                </defs>
                <path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="url(#tyro-lg2)"/>
                <path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="#6366f1"/>
                <path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="url(#tyro-la2)"/>
                <path d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z" fill="#4338ca"/>
              </svg>
              <div style={{fontWeight:800,fontSize:22,letterSpacing:.3,lineHeight:1.1}}><span style={{color:'#1a2332'}}>tyro</span><span style={{background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>stock</span></div>
            </div>

            <h1 style={{fontSize:mob?26:42,fontWeight:800,color:'#1a2332',lineHeight:1.12,letterSpacing:-.7,margin:'0 0 10px',textShadow:'0 1px 3px rgba(0,0,0,.05)',animation:'titleReveal .8s cubic-bezier(.16,1,.3,1) .2s both'}}>Dijital Stok<br/><span style={{background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Yönetim Ajanı</span></h1>
            <p style={{fontSize:mob?12:14,color:'#5a6b7f',fontWeight:500,lineHeight:1.7,margin:'0 0 22px',maxWidth:mob?'100%':440,animation:'subtitleFade .8s ease .4s both'}}>Tiryaki Agro stok yaşlandırma verilerinizi gerçek zamanlı izleyin, AI destekli içgörülerle operasyonel verimliliği artırın.</p>

            {/* Feature kartları — 2×2 grid glassmorphism */}
            {!mob&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {features.map((f,i)=>(
                <div key={i} className="feat-pill" style={{padding:'14px 16px',borderRadius:14,background:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.65)',backdropFilter:'blur(12px)',transition:'all .25s',animation:`featureIn .5s ease ${.15+i*.1}s both`,cursor:'default'}}>
                  <div style={{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,rgba(13,110,79,.08),rgba(59,130,246,.06))',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <f.icon size={15} color="#0d6e4f"/>
                  </div>
                  <div style={{fontSize:12.5,fontWeight:700,color:'#1a2332',marginBottom:3}}>{f.t}</div>
                  <div style={{fontSize:10.5,color:'#6b7a8d',fontWeight:500,lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>}

            {!mob&&<div style={{borderTop:'1px solid rgba(0,0,0,.05)',paddingTop:14}}>
              <p style={{fontSize:9.5,fontWeight:700,letterSpacing:2.5,margin:0,color:'#94a3b8'}}>TTECH BUSINESS SOLUTIONS</p>
              <p style={{fontSize:8.5,margin:'3px 0 0',fontWeight:500,color:'#b8c4d0'}}>© 2026 Tiryaki Agro — Tüm hakları saklıdır.</p>
            </div>}
          </div>

          {/* Globe üzerinde yüzen portal buton — dünyanın içinden açılır */}
          <div id="tyroverse-portal" style={{position:'fixed',top:'50%',left:mob?'50%':'58%',transform:'translate(-50%,-50%)',zIndex:2,
            animation:'portalOpen 1.5s cubic-bezier(.16,1,.3,1) .8s both',textAlign:'center'}}>
            {/* Portal halkalar */}
            <div style={{position:'absolute',inset:-24,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,212,160,.05) 0%,transparent 70%)',animation:'portalRing 3s ease infinite',pointerEvents:'none'}}/>
            <div style={{position:'absolute',inset:-16,borderRadius:'50%',border:'1px dashed rgba(45,212,160,.12)',animation:'portalRing 4s ease .8s infinite',pointerEvents:'none'}}/>
            {/* Ana buton */}
            <button className="login-btn" onClick={()=>{
              const el=document.getElementById('tyroverse-btn');
              const portal=document.getElementById('tyroverse-portal');
              const leftPanel=document.querySelector('[data-login-panel]');
              const root=document.getElementById('root');
              // Globe warp başlat
              window._tyroLoginAnim=true;

              // ═══ Faz 1 (0-0.8s): Buton parlama + vignette karartma ═══
              if(el){el.style.boxShadow='0 0 50px rgba(45,212,160,.5),0 0 100px rgba(59,130,246,.25)';el.style.borderColor='rgba(45,212,160,.5)';}
              // Vignette overlay ekle
              const vig=document.createElement('div');
              vig.style.cssText='position:fixed;inset:0;z-index:10;pointer-events:none;background:radial-gradient(ellipse at 58% 50%,transparent 30%,rgba(0,0,0,.5) 100%);opacity:0;transition:opacity 1.5s ease';
              root.appendChild(vig);
              setTimeout(()=>{vig.style.opacity='1';},100);

              // ═══ Faz 2 (0.8s): Sol panel fade + buton büyüme ═══
              setTimeout(()=>{
                if(el){el.style.transform='scale(1.08)';el.style.background='rgba(255,255,255,.85)';}
                if(leftPanel){leftPanel.style.transition='all 1.2s ease';leftPanel.style.opacity='0';leftPanel.style.transform='translateX(-60px)';leftPanel.style.filter='blur(8px)';}
              },800);

              // ═══ Faz 2b (1.0s): Sinematik typewriter — harf harf TYROVERSE ═══
              setTimeout(()=>{
                const tw=document.createElement('div');
                tw.id='tyro-typewriter';
                tw.style.cssText='position:fixed;bottom:16%;left:50%;transform:translateX(-50%);z-index:11;text-align:center;pointer-events:none';
                // Üst satır: TYROVERSE harfleri
                const title=document.createElement('div');
                title.style.cssText='font-family:Plus Jakarta Sans,sans-serif;font-size:32px;font-weight:800;letter-spacing:10px;line-height:1.3;background:linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(45,212,160,.3)) drop-shadow(0 0 40px rgba(59,130,246,.2))';
                title.id='tyro-title-chars';
                tw.appendChild(title);
                // Alt satır: geçiş yapılıyor
                const sub=document.createElement('div');
                sub.style.cssText='font-family:Plus Jakarta Sans,sans-serif;font-size:11px;font-weight:500;color:rgba(255,255,255,.4);letter-spacing:4px;text-transform:uppercase;margin-top:8px;opacity:0;transition:opacity 0.6s ease';
                sub.textContent='geçiş yapılıyor...';
                sub.id='tyro-sub';
                tw.appendChild(sub);
                root.appendChild(tw);
                // Harf harf belirme
                const text='TYROVERSE';let ci=0;
                const charInterval=setInterval(()=>{
                  if(ci<text.length){title.textContent+=text[ci];ci++;}
                  else{clearInterval(charInterval);
                    // Cursor yanıp sönme
                    title.style.borderRight='2px solid rgba(45,212,160,.6)';
                    title.style.paddingRight='4px';
                    // Alt satır fade-in
                    setTimeout(()=>{const s2=document.getElementById('tyro-sub');if(s2)s2.style.opacity='1';},200);
                  }
                },80);
              },1000);

              // ═══ Faz 3 (1.8s): Buton çekilir + portal kapanır ═══
              setTimeout(()=>{
                if(el){el.style.transform='scale(0.4)';el.style.opacity='0';el.style.filter='blur(20px)';}
                if(portal){portal.style.transition='all 0.7s cubic-bezier(.4,0,.2,1)';portal.style.transform='translate(-50%,-50%) scale(0.15)';portal.style.opacity='0';}
              },1800);

              // ═══ Faz 4 (2.0s): DISSOLVE — blur artışı + grain overlay ═══
              setTimeout(()=>{
                const dissolve=document.createElement('div');
                dissolve.style.cssText='position:fixed;inset:0;z-index:11;pointer-events:none;backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);transition:backdrop-filter 0.8s ease,-webkit-backdrop-filter 0.8s ease';
                root.appendChild(dissolve);
                // Grain noise overlay
                const grain=document.createElement('div');
                grain.style.cssText='position:fixed;inset:0;z-index:11;pointer-events:none;opacity:0;transition:opacity 0.6s;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")';
                root.appendChild(grain);
                setTimeout(()=>{dissolve.style.backdropFilter='blur(12px)';dissolve.style.WebkitBackdropFilter='blur(12px)';grain.style.opacity='0.2';},50);
              },2000);

              // ═══ Faz 5 (2.5s): PİKSEL — kontrast + desatürasyon ═══
              setTimeout(()=>{
                const pixel=document.createElement('div');
                pixel.style.cssText='position:fixed;inset:0;z-index:11;pointer-events:none;backdrop-filter:blur(6px) contrast(1.8) saturate(0.2);-webkit-backdrop-filter:blur(6px) contrast(1.8) saturate(0.2);opacity:0;transition:opacity 0.3s';
                root.appendChild(pixel);
                setTimeout(()=>{pixel.style.opacity='1';},50);
                // Typewriter fade
                const tw2=document.getElementById('tyro-typewriter');
                if(tw2){tw2.style.transition='opacity .4s';tw2.style.opacity='0';}
              },2500);

              // ═══ Faz 6 (2.8s): FLASH — beyaz patlama ═══
              setTimeout(()=>{
                const flash=document.createElement('div');
                flash.style.cssText='position:fixed;inset:0;z-index:13;background:#fff;opacity:0;transition:opacity 0.3s ease';
                root.appendChild(flash);
                setTimeout(()=>{flash.style.opacity='1';},50);
              },2800);

              // ═══ Faz 7 (3.5s): Auth tetikle ═══
              setTimeout(handleLogin,3500);
            }} disabled={authLoading||!msalReady}
              id="tyroverse-btn"
              style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:0,
                padding:0,borderRadius:22,overflow:'hidden',
                border:'1.5px solid rgba(255,255,255,.45)',
                cursor:(authLoading||!msalReady)?'wait':'pointer',
                background:'rgba(255,255,255,.5)',backdropFilter:'blur(30px) saturate(200%)',WebkitBackdropFilter:'blur(30px) saturate(200%)',
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                transition:'all .5s cubic-bezier(.16,1,.3,1)',
                boxShadow:'0 16px 48px rgba(0,0,0,.08),0 0 40px rgba(45,212,160,.06),inset 0 1px 0 rgba(255,255,255,.9)',
                opacity:(authLoading||!msalReady)?0.5:1}}>
              {/* Tek bant — Logo + tyroverse + geçişini tamamla */}
              <div style={{width:'100%',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                <svg width="22" height="22" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0,filter:'drop-shadow(0 1px 4px rgba(99,102,241,.15))'}}>
                  <defs>
                    <linearGradient id="tyro-portal-g" x1="61" y1="117" x2="14" y2="47" gradientTransform="translate(0 150.55) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2dd4a0"/><stop offset="1" stopColor="#0d6e4f"/></linearGradient>
                    <linearGradient id="tyro-portal-a" x1="60" y1="10" x2="130" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3b82f6"/><stop offset=".5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient>
                  </defs>
                  <path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="url(#tyro-portal-g)"/>
                  <path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="#6366f1"/>
                  <path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="url(#tyro-portal-a)"/>
                  <path d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z" fill="#4338ca"/>
                </svg>
                <span style={{fontWeight:800,fontSize:16,letterSpacing:.2,lineHeight:1}}>
                  <span style={{color:'#1a2332'}}>tyro</span><span style={{background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>verse</span>
                </span>
                <span style={{fontSize:13,fontWeight:600,color:'#5a6b7f'}}>{authLoading?'bağlanıyor...':'geçişini tamamla'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:$.f,background:$.bg,color:$.t1,overflow:'hidden',WebkitFontSmoothing:'antialiased',fontSize:13}}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes sbIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}.ks{animation:slideIn .3s cubic-bezier(.16,1,.3,1)}.fu{animation:fadeUp .35s ease both}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#c8cdd5;border-radius:10px}.rh:hover{background:#f0f3f8!important}.kp{transition:all .2s}.kp:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);transform:translateY(-2px)}input.fi,select.fi{border:1px solid rgba(226,231,238,.5);border-radius:10px;padding:7px 10px;font-size:11px;font-family:inherit;outline:none;width:100%;background:rgba(255,255,255,.7);backdrop-filter:blur(8px);color:#1a1a1a;transition:all .2s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)}input.fi:focus,select.fi:focus{border-color:#0d6e4f;background:rgba(255,255,255,.95);box-shadow:0 0 0 3px rgba(13,110,79,.08),0 2px 6px rgba(0,0,0,.04)}input.fi:hover,select.fi:hover{border-color:rgba(13,110,79,.25);background:rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(0,0,0,.04)}select.fi{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%230d6e4f' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px;cursor:pointer}.tb-b{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid rgba(226,231,238,.5);background:rgba(255,255,255,.7);backdrop-filter:blur(6px);color:#5a6b7f;font-size:11.5px;font-family:inherit;font-weight:500;cursor:pointer;transition:all .15s}.tb-b:hover{background:rgba(255,255,255,.95);border-color:#d0d6df}.tb-b.pr{background:#0d6e4f;color:#fff;border-color:#0d6e4f}.tb-b.pr:hover{background:#0a5a40}.sg:hover{opacity:1!important}.sg:hover .sgt{opacity:1!important}.sbn:hover{background:rgba(13,110,79,.04)!important}.mob-ov{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;backdrop-filter:blur(2px)}.mob-sb{animation:sbIn .25s ease}@keyframes spin{to{transform:rotate(360deg)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes mobMenuUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0;cursor:pointer;border:none;background:none;font-family:inherit;font-size:10px;font-weight:500;color:#86868b;transition:color .2s}.bnav-btn.active{color:#0d6e4f;font-weight:600}`}</style>
      <input ref={fR} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{display:'none'}}/>

      {/* SIDEBAR — hidden on mobile, uses bottom nav instead */}
      {mob&&sbOpen&&<div className="mob-ov" onClick={()=>setSbOpen(false)}/>}
      <div className={mob?'mob-sb':''} onMouseEnter={()=>{if(!mob&&!sbPinned){clearTimeout(sbTimerRef.current);setSbHov(true);}}} onMouseLeave={()=>{if(!mob&&!sbPinned){sbTimerRef.current=setTimeout(()=>setSbHov(false),250);}}} style={{width:sbExpanded?250:60,minWidth:sbExpanded?250:60,background:'rgba(255,255,255,.95)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',display:mob?'none':'flex',flexDirection:'column',flexShrink:0,borderRadius:18,border:'1px solid rgba(226,231,238,.35)',margin:'10px 0 10px 10px',transition:'width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1)',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.04)'}}>
        <div style={{padding:sbExpanded?'10px 20px 16px':'10px 11px 16px',display:'flex',alignItems:'center',gap:12,position:'relative'}}>
          <svg width="32" height="32" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
            <defs>
              <linearGradient id="tyro-sg" x1="61.29" y1="116.53" x2="14.04" y2="47.15" gradientTransform="translate(0 150.55) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2dd4a0"/><stop offset="1" stopColor="#0d6e4f"/></linearGradient>
              <linearGradient id="tyro-au" x1="60" y1="10" x2="130" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3b82f6"/><stop offset=".5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient>
            </defs>
            <path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="url(#tyro-sg)"/>
            <path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="#6366f1"/>
            <path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="url(#tyro-au)"/>
            <path d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z" fill="#4338ca"/>
          </svg>
          {sbExpanded&&<div style={{minWidth:0}}>
            <div style={{fontWeight:800,fontSize:16,letterSpacing:.3,lineHeight:1.1}}><span style={{color:$.t1}}>tyro</span><span style={{background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>stock</span></div>
          </div>}
          {sbExpanded&&!mob&&<div onClick={()=>{setSbPinned(p=>!p);setSbHov(false);}} title={sbPinned?'Sidebar\'ı serbest bırak':'Sidebar\'ı sabitle'} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)'+(sbPinned?' rotate(0deg)':' rotate(45deg)'),cursor:'pointer',width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:sbPinned?'rgba(13,110,79,.08)':'rgba(0,0,0,.04)',transition:'all .2s',color:sbPinned?$.ac:'#86868b'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
          </div>}
        </div>
        <div style={{padding:sbExpanded?'0 12px':'0 8px',flex:1,overflowY:'auto'}}>
          {sbExpanded&&<div style={{padding:'10px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Genel'}</div>}
          {!sbExpanded&&<div style={{height:10}}/>}
          {[{id:'dash',icon:BarChart3,label:'Dashboard'},{id:'ana',icon:Activity,label:'Risk Radarı'},{id:'yon',icon:Briefcase,label:'AI | İçgörüler'}].map(p=>{const isA=pg===p.id;return(
            <div key={p.id} className="sbn" title={!sbExpanded?p.label:undefined} onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:sbExpanded?'8px 11px':'8px',margin:'1px 0',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease',justifyContent:sbExpanded?'flex-start':'center'}}>
              {isA&&sbExpanded&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <p.icon size={sbExpanded?16:18} strokeWidth={isA?2.2:1.8}/>{sbExpanded&&p.label}
            </div>);})}
          {sbExpanded&&<div style={{padding:'14px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Veri & Raporlama'}</div>}
          {!sbExpanded&&<div style={{margin:'10px 8px',borderTop:'1px solid rgba(226,231,238,.4)'}}/>}
          {[{id:'rep',icon:FileBarChart,label:'Kırılım Raporu'},{id:'sto',icon:Package,label:'Stok Raporu'},{id:'raw',icon:Database,label:'ERP Veriler'},{id:'erp',icon:Globe,label:'Ham Veriler'}].map(p=>{const isA=pg===p.id;return(
            <div key={p.id} className="sbn" title={!sbExpanded?p.label:undefined} onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:sbExpanded?'8px 11px':'8px',margin:'1px 0',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease',justifyContent:sbExpanded?'flex-start':'center'}}>
              {isA&&sbExpanded&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <p.icon size={sbExpanded?16:18} strokeWidth={isA?2.2:1.8}/>{sbExpanded&&p.label}
              {sbExpanded&&p.id==='raw'&&<span style={{marginLeft:'auto',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:6,background:$.blu,color:'#fff',minWidth:18,textAlign:'center'}}>{rows.length}</span>}
              {sbExpanded&&p.id==='erp'&&erpRaw.length>0&&<span style={{marginLeft:'auto',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:6,background:$.ac,color:'#fff',minWidth:18,textAlign:'center'}}>{erpRaw.length}</span>}
            </div>);})}
          {sbExpanded&&<div style={{padding:'14px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Tahminleme'}</div>}
          {!sbExpanded&&<div style={{margin:'10px 8px',borderTop:'1px solid rgba(226,231,238,.4)'}}/>}
          {[{id:'fcst',icon:TrendingUp,label:'Satış Tahmini'}].map(p=>{const isA=pg===p.id;return(
            <div key={p.id} className="sbn" title={!sbExpanded?p.label:undefined} onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:sbExpanded?'8px 11px':'8px',margin:'1px 0',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease',justifyContent:sbExpanded?'flex-start':'center'}}>
              {isA&&sbExpanded&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <p.icon size={sbExpanded?16:18} strokeWidth={isA?2.2:1.8}/>{sbExpanded&&p.label}
            </div>);})}
          {sbExpanded&&<div style={{padding:'14px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Sistem'}</div>}
          {!sbExpanded&&<div style={{margin:'10px 8px',borderTop:'1px solid rgba(226,231,238,.4)'}}/>}
          {(()=>{const isA=pg==='set';return(
            <div className="sbn" title={!sbExpanded?'Ayarlar':undefined} onClick={()=>{setPg('set');setSel(null);setYonDetail(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:sbExpanded?'8px 11px':'8px',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease',justifyContent:sbExpanded?'flex-start':'center'}}>
              {isA&&sbExpanded&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <Settings size={sbExpanded?16:18} strokeWidth={isA?2.2:1.8}/>{sbExpanded&&'Ayarlar'}
            </div>);})()}
        </div>
        {/* Profile */}
        {MSAL_ENABLED&&msalAccount&&(
          <div style={{padding:sbExpanded?'10px 12px':'10px 8px',borderTop:'1px solid rgba(226,231,238,.35)'}}>
            {sbExpanded?<div onClick={()=>setProfileOpen(p=>!p)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,cursor:'pointer',background:profileOpen?'rgba(13,110,79,.06)':'transparent',transition:'all .2s'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#2dd4a0,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,fontFamily:$.f,letterSpacing:.5,boxShadow:'0 2px 8px rgba(99,102,241,.3)',flexShrink:0}}>{(msalAccount.name||'').split(' ').map(n=>n?.[0]||'').join('').slice(0,2).toLocaleUpperCase('tr-TR')}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11.5,fontWeight:600,color:$.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2}}>{msalAccount.name||msalAccount.username}</div>
                <div style={{fontSize:9.5,color:$.t3,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{msalAccount.username}</div>
              </div>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{flexShrink:0,transition:'transform .2s',transform:profileOpen?'rotate(180deg)':'rotate(0)'}}><path d="M1 1L5 5L9 1" stroke={$.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>:<div style={{display:'flex',justifyContent:'center',padding:'4px 0'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#2dd4a0,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,fontFamily:$.f,letterSpacing:.5,boxShadow:'0 2px 8px rgba(99,102,241,.3)',cursor:'pointer'}} title={msalAccount.name||msalAccount.username}>{(msalAccount.name||'').split(' ').map(n=>n?.[0]||'').join('').slice(0,2).toLocaleUpperCase('tr-TR')}</div>
            </div>}
            {sbExpanded&&profileOpen&&<div style={{marginTop:6,padding:'4px 0'}}>
              <div onClick={()=>{handleLogout();setProfileOpen(false);}} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,cursor:'pointer',fontSize:11.5,fontWeight:500,color:'#e5484d',transition:'all .15s'}} className="sbn">
                <LogOut size={14} strokeWidth={2}/> Çıkış Yap
              </div>
            </div>}
          </div>
        )}
        {/* Copyright */}
        {sbExpanded&&<div style={{padding:'10px 16px 14px',borderTop:'1px solid rgba(226,231,238,.35)'}}>
          <div style={{fontSize:10.5,fontWeight:700,letterSpacing:2,textAlign:'center',marginBottom:4,background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',opacity:.6}}>TTECH BUSINESS SOLUTIONS</div>
          <div style={{fontSize:9.5,textAlign:'center',fontWeight:500,background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',opacity:.4}}>{'© '}{new Date().getFullYear()}{' Tiryaki Agro — Tüm hakları saklıdır.'}</div>
        </div>}
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Topbar */}
        <div style={{background:'transparent',flexShrink:0,padding:mob?'10px 14px 0':'8px 26px 0',...(mob?{}:{height:64,display:'flex',alignItems:'center',gap:10})}}>
          {mob?<>
            {/* Mobile: Row 1 — App name + ERP status */}
            <div style={{textAlign:'center',marginBottom:8}}>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:.3,lineHeight:1.1}}><span style={{color:$.t1}}>tyro</span><span style={{background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>stock</span></div>
              {(gSearch&&rows.length>0||erpStatus||erpError)&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:4}}>
                {gSearch&&rows.length>0&&<div style={{padding:'3px 9px',borderRadius:7,background:'rgba(13,110,79,.08)',fontSize:11,fontWeight:600,color:$.ac,whiteSpace:'nowrap'}}>{fN(gRows.length)}/{fN(calcRows.length)}</div>}
                {erpStatus&&<div style={{padding:'3px 7px',borderRadius:7,background:$.grnB,fontSize:10,fontWeight:600,color:'#0d6e4f',display:'flex',alignItems:'center',gap:4}}>{erpLoading&&<span style={{display:'inline-block',width:8,height:8,border:'2px solid #0d6e4f',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>}{erpStatus}</div>}
                {erpError&&<div style={{padding:'3px 7px',borderRadius:7,background:$.redB,fontSize:10,fontWeight:600,color:$.red,cursor:'pointer'}} onClick={()=>setErpError('')}>{erpError} x</div>}
              </div>}
            </div>
            {/* Mobile: Row 2 — Search + filter */}
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
            <div style={{position:'relative',flex:1}}>
              <Search size={16} strokeWidth={2.5} color={$.ac} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',zIndex:1}}/>
              <input value={gSearch} onChange={e=>{setGSearch(e.target.value);setGSearchFocus(true);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}} placeholder="Ürün, tesis, seviye ara..." style={{width:'100%',boxSizing:'border-box',padding:'9px 32px 9px 34px',borderRadius:12,border:'1px solid '+(gSearch?'rgba(13,110,79,.35)':'rgba(0,0,0,.1)'),background:gSearch?'rgba(13,110,79,.04)':'rgba(255,255,255,.85)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,color:'#1a1a1a',outline:'none',transition:'all .25s ease',boxShadow:gSearch?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 4px rgba(0,0,0,.06)'}} onFocus={e=>{setGSearchFocus(true);e.target.style.borderColor='rgba(13,110,79,.45)';e.target.style.boxShadow='0 0 0 3px rgba(13,110,79,.1)';e.target.style.background='rgba(255,255,255,.95)';}} onBlur={e=>{setTimeout(()=>setGSearchFocus(false),200);if(!gSearch){e.target.style.borderColor='rgba(0,0,0,.1)';e.target.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';e.target.style.background='rgba(255,255,255,.85)';}}}/>
              {gSearch&&<div onClick={()=>{setGSearch('');}} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',cursor:'pointer',width:20,height:20,borderRadius:10,background:'rgba(0,0,0,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={11} color="#636366"/></div>}
              {gSearchFocus&&gSearch.trim()&&gSuggestions.length>0&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,background:'#fff',borderRadius:14,border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 12px 40px rgba(0,0,0,.12)',zIndex:100,maxHeight:320,overflowY:'auto',padding:'8px 0'}}>
                  {gSuggestions.map(cat=>(
                    <div key={cat.id}>
                      <div style={{padding:'6px 14px 4px',fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5}}>{cat.l}</div>
                      {cat.matches.map(m=>(
                        <div key={m} onMouseDown={e=>{e.preventDefault();setGSearch(m);setGSearchFocus(false);}} style={{padding:'7px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'background .15s'}} className="rh">
                          <span style={{fontSize:9,fontWeight:700,color:'#fff',background:$.ac,padding:'1px 6px',borderRadius:4,flexShrink:0}}>{cat.l}</span>
                          <span style={{fontSize:12,fontWeight:500,color:$.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Mobile filter button */}
            <button className="tb-b" onClick={()=>setShowGFilter(v=>!v)} style={{gap:4,flexShrink:0,padding:'8px 10px',background:showGFilter||gFilterCount>0?$.acL:'',borderColor:showGFilter||gFilterCount>0?$.ac:'',color:showGFilter||gFilterCount>0?$.ac:'',position:'relative'}}>
              <SlidersHorizontal size={14}/>
              {gFilterCount>0&&<span style={{fontSize:9,fontWeight:700,color:'#fff',background:$.ac,padding:'1px 5px',borderRadius:7}}>{gFilterCount}</span>}
            </button>
            </div>
            {/* Mobile filter dropdown */}
            {showGFilter&&<div style={{marginBottom:8,background:'rgba(255,255,255,.96)',backdropFilter:'blur(20px)',borderRadius:14,border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 8px 24px rgba(0,0,0,.1)',padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{fontSize:13,fontWeight:700,color:$.t1}}>Gelişmiş Filtre</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {gFilterCount>0&&<div onClick={()=>setGFilter(GF_INIT)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:$.red,padding:'4px 8px',borderRadius:6,background:$.redB}} className="rh"><RotateCcw size={11}/>Temizle</div>}
                  <div onClick={()=>setShowGFilter(false)} style={{cursor:'pointer',width:24,height:24,borderRadius:6,background:'rgba(0,0,0,.05)',display:'flex',alignItems:'center',justifyContent:'center'}} className="rh"><X size={12} color={$.t2}/></div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 10px'}}>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Ana Trader</div><CustomSelect value={gFilter.mtrader} onChange={v=>setGFilter(p=>({...p,mtrader:v}))} options={gFilterOpts.mtraders}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Trader</div><CustomSelect value={gFilter.trader} onChange={v=>setGFilter(p=>({...p,trader:v}))} options={gFilterOpts.traders}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Şirket Grubu</div><CustomSelect value={gFilter.grp} onChange={v=>setGFilter(p=>({...p,grp:v}))} options={gFilterOpts.grps}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Şirket</div><CustomSelect value={gFilter.comp} onChange={v=>setGFilter(p=>({...p,comp:v}))} options={gFilterOpts.comps}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Ürün</div><CustomSelect value={gFilter.urun} onChange={v=>setGFilter(p=>({...p,urun:v}))} options={gFilterOpts.uruns}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Menşe</div><CustomSelect value={gFilter.mense} onChange={v=>setGFilter(p=>({...p,mense:v}))} options={gFilterOpts.menses}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Tesis</div><CustomSelect value={gFilter.tesis} onChange={v=>setGFilter(p=>({...p,tesis:v}))} options={gFilterOpts.tesisler}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Seviye 2</div><CustomSelect value={gFilter.l2} onChange={v=>setGFilter(p=>({...p,l2:v}))} options={gFilterOpts.l2s}/></div>
                <div style={{gridColumn:'span 2'}}><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Seviye 3</div><CustomSelect value={gFilter.l3} onChange={v=>setGFilter(p=>({...p,l3:v}))} options={gFilterOpts.l3s}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Transit Ambar</div>
                  <div onClick={()=>setIncTransit(v=>!v)} style={{padding:'7px 28px 7px 10px',borderRadius:10,fontSize:11,cursor:'pointer',background:incTransit?'rgba(13,110,79,.08)':'rgba(255,255,255,.7)',backdropFilter:'blur(8px)',border:'1px solid '+(incTransit?'rgba(13,110,79,.35)':'rgba(226,231,238,.5)'),boxShadow:incTransit?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)',color:incTransit?'#0d6e4f':'#8e9bb3',fontWeight:incTransit?700:500,transition:'all .2s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',position:'relative'}}>
                    {incTransit?'Dahil ediliyor':'Hariç tutuluyor'}
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>{incTransit?<path d="M2 6l3 3 5-6" stroke="#0d6e4f" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>:<circle cx="6" cy="6" r="4" stroke="#c7ced8" strokeWidth="1.4" fill="none"/>}</svg>
                  </div>
                </div>
                <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:3}}>Fark Ambar</div>
                  <div onClick={()=>setIncFark(v=>!v)} style={{padding:'7px 28px 7px 10px',borderRadius:10,fontSize:11,cursor:'pointer',background:incFark?'rgba(13,110,79,.08)':'rgba(255,255,255,.7)',backdropFilter:'blur(8px)',border:'1px solid '+(incFark?'rgba(13,110,79,.35)':'rgba(226,231,238,.5)'),boxShadow:incFark?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)',color:incFark?'#0d6e4f':'#8e9bb3',fontWeight:incFark?700:500,transition:'all .2s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',position:'relative'}}>
                    {incFark?'Dahil ediliyor':'Hariç tutuluyor'}
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>{incFark?<path d="M2 6l3 3 5-6" stroke="#0d6e4f" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>:<circle cx="6" cy="6" r="4" stroke="#c7ced8" strokeWidth="1.4" fill="none"/>}</svg>
                  </div>
                </div>
              </div>
              {gFilterCount>0&&<div style={{marginTop:10,padding:'5px 8px',borderRadius:6,background:'rgba(13,110,79,.05)',fontSize:11,fontWeight:600,color:$.ac,textAlign:'center'}}>{fN(gRows.length)} / {fN(calcRows.length)} kayıt</div>}
            </div>}
          </>:<>
            {/* Desktop: original single-row layout */}
            <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16,fontWeight:700,color:'#1a1a1a',lineHeight:1.2,letterSpacing:'-0.02em'}}>{{'dash':'Dashboard','ana':'Risk Radarı','yon':'AI | İçgörüler','raw':'ERP Veriler','rep':'Kırılım Raporu','sto':'Stok Raporu','fcst':'Satış Tahmini','erp':'Ham Veriler','set':'Ayarlar'}[pg]}</div>
                <div style={{fontSize:12,fontWeight:500,letterSpacing:'-0.01em',background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{{'dash':'Genel Bakış','ana':'Stok Analizi ve Risk Değerlendirmesi','yon':'AI Destekli Stok Yaşlandırma İçgörüleri','raw':'ERP İşlem Kayıtları','rep':'Stok Yaşlandırma Kırılım Analizleri','sto':'Şirket / Tesis / Ambar Bazlı Stok Dökümü','fcst':'Trader Bazlı Aylık Satış Tahminleme','erp':'D365 ERP Ham Veri Görüntüleme','set':'Uygulama Tercihleri'}[pg]}</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,flex:1,maxWidth:400,margin:'0 auto',position:'relative'}}>
              <div style={{position:'relative',flex:1}}>
                <Search size={16} strokeWidth={2.5} color={$.ac} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',zIndex:1}}/>
                <input value={gSearch} onChange={e=>{setGSearch(e.target.value);setGSearchFocus(true);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}} placeholder="Ürün, tesis, seviye ara..." style={{width:'100%',boxSizing:'border-box',padding:'7px 32px 7px 34px',borderRadius:11,border:'1px solid '+(gSearch?'rgba(13,110,79,.35)':'rgba(0,0,0,.1)'),background:gSearch?'rgba(13,110,79,.04)':'rgba(255,255,255,.85)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500,color:'#1a1a1a',outline:'none',transition:'all .25s ease',boxShadow:gSearch?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 4px rgba(0,0,0,.06)'}} onFocus={e=>{setGSearchFocus(true);e.target.style.borderColor='rgba(13,110,79,.45)';e.target.style.boxShadow='0 0 0 3px rgba(13,110,79,.1)';e.target.style.background='rgba(255,255,255,.95)';}} onBlur={e=>{setTimeout(()=>setGSearchFocus(false),200);if(!gSearch){e.target.style.borderColor='rgba(0,0,0,.1)';e.target.style.boxShadow='0 1px 4px rgba(0,0,0,.06)';e.target.style.background='rgba(255,255,255,.85)';}}}/>
                {gSearch&&<div onClick={()=>{setGSearch('');}} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',cursor:'pointer',width:18,height:18,borderRadius:9,background:'rgba(0,0,0,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={10} color="#636366"/></div>}
                {gSearchFocus&&gSearch.trim()&&gSuggestions.length>0&&(
                  <div style={{position:'absolute',top:'100%',left:0,right:'calc(-40px)',marginTop:6,background:'#fff',borderRadius:14,border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 12px 40px rgba(0,0,0,.12)',zIndex:100,maxHeight:360,overflowY:'auto',padding:'8px 0'}}>
                    {gSuggestions.map(cat=>(
                      <div key={cat.id}>
                        <div style={{padding:'6px 14px 4px',fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5}}>{cat.l}</div>
                        {cat.matches.map(m=>(
                          <div key={m} onMouseDown={e=>{e.preventDefault();setGSearch(m);setGSearchFocus(false);}} style={{padding:'7px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'background .15s'}} className="rh">
                            <span style={{fontSize:9,fontWeight:700,color:'#fff',background:$.ac,padding:'1px 6px',borderRadius:4,flexShrink:0}}>{cat.l}</span>
                            <span style={{fontSize:12,fontWeight:500,color:$.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Filtre butonu — arama inputuna bitişik */}
              <div style={{position:'relative'}}>
              <button className="tb-b" onClick={()=>setShowGFilter(v=>!v)} style={{gap:5,background:showGFilter||gFilterCount>0?$.acL:'',borderColor:showGFilter||gFilterCount>0?$.ac:'',color:showGFilter||gFilterCount>0?$.ac:'',position:'relative'}}>
                <SlidersHorizontal size={14}/>
                {gFilterCount>0&&<span style={{fontSize:9,fontWeight:700,color:'#fff',background:$.ac,padding:'1px 6px',borderRadius:8,minWidth:14,textAlign:'center'}}>{gFilterCount}</span>}
              </button>
              {showGFilter&&<><div onClick={()=>setShowGFilter(false)} style={{position:'fixed',inset:0,zIndex:199}}/><div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',right:0,marginTop:8,width:380,background:'rgba(255,255,255,.96)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',borderRadius:16,border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 12px 40px rgba(0,0,0,.12)',zIndex:200,padding:'16px 18px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                  <span style={{fontSize:14,fontWeight:700,color:$.t1}}>Gelişmiş Filtre</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {gFilterCount>0&&<div onClick={()=>setGFilter(GF_INIT)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:$.red,padding:'4px 10px',borderRadius:6,background:$.redB,transition:'background .15s'}} className="rh"><RotateCcw size={11}/>Temizle</div>}
                    <div onClick={()=>setShowGFilter(false)} style={{cursor:'pointer',width:24,height:24,borderRadius:6,background:'rgba(0,0,0,.05)',display:'flex',alignItems:'center',justifyContent:'center'}} className="rh"><X size={12} color={$.t2}/></div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 12px'}}>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Ana Trader</div><CustomSelect value={gFilter.mtrader} onChange={v=>setGFilter(p=>({...p,mtrader:v}))} options={gFilterOpts.mtraders}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Trader</div><CustomSelect value={gFilter.trader} onChange={v=>setGFilter(p=>({...p,trader:v}))} options={gFilterOpts.traders}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Şirket Grubu</div><CustomSelect value={gFilter.grp} onChange={v=>setGFilter(p=>({...p,grp:v}))} options={gFilterOpts.grps}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Şirket</div><CustomSelect value={gFilter.comp} onChange={v=>setGFilter(p=>({...p,comp:v}))} options={gFilterOpts.comps}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Ürün</div><CustomSelect value={gFilter.urun} onChange={v=>setGFilter(p=>({...p,urun:v}))} options={gFilterOpts.uruns}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Menşe</div><CustomSelect value={gFilter.mense} onChange={v=>setGFilter(p=>({...p,mense:v}))} options={gFilterOpts.menses}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Tesis</div><CustomSelect value={gFilter.tesis} onChange={v=>setGFilter(p=>({...p,tesis:v}))} options={gFilterOpts.tesisler}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Seviye 2</div><CustomSelect value={gFilter.l2} onChange={v=>setGFilter(p=>({...p,l2:v}))} options={gFilterOpts.l2s}/></div>
                  <div style={{gridColumn:'span 2'}}><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Seviye 3</div><CustomSelect value={gFilter.l3} onChange={v=>setGFilter(p=>({...p,l3:v}))} options={gFilterOpts.l3s}/></div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Transit Ambar</div>
                    <div onClick={()=>setIncTransit(v=>!v)} style={{padding:'7px 28px 7px 10px',borderRadius:10,fontSize:11,cursor:'pointer',background:incTransit?'rgba(13,110,79,.08)':'rgba(255,255,255,.7)',backdropFilter:'blur(8px)',border:'1px solid '+(incTransit?'rgba(13,110,79,.35)':'rgba(226,231,238,.5)'),boxShadow:incTransit?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)',color:incTransit?'#0d6e4f':'#8e9bb3',fontWeight:incTransit?700:500,transition:'all .2s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',position:'relative'}}>
                      {incTransit?'Dahil ediliyor':'Hariç tutuluyor'}
                      <svg width="12" height="12" viewBox="0 0 12 12" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>{incTransit?<path d="M2 6l3 3 5-6" stroke="#0d6e4f" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>:<circle cx="6" cy="6" r="4" stroke="#c7ced8" strokeWidth="1.4" fill="none"/>}</svg>
                    </div>
                  </div>
                  <div><div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Fark Ambar</div>
                    <div onClick={()=>setIncFark(v=>!v)} style={{padding:'7px 28px 7px 10px',borderRadius:10,fontSize:11,cursor:'pointer',background:incFark?'rgba(13,110,79,.08)':'rgba(255,255,255,.7)',backdropFilter:'blur(8px)',border:'1px solid '+(incFark?'rgba(13,110,79,.35)':'rgba(226,231,238,.5)'),boxShadow:incFark?'0 0 0 3px rgba(13,110,79,.08)':'0 1px 3px rgba(0,0,0,.03),inset 0 1px 0 rgba(255,255,255,.8)',color:incFark?'#0d6e4f':'#8e9bb3',fontWeight:incFark?700:500,transition:'all .2s',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',position:'relative'}}>
                      {incFark?'Dahil ediliyor':'Hariç tutuluyor'}
                      <svg width="12" height="12" viewBox="0 0 12 12" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>{incFark?<path d="M2 6l3 3 5-6" stroke="#0d6e4f" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>:<circle cx="6" cy="6" r="4" stroke="#c7ced8" strokeWidth="1.4" fill="none"/>}</svg>
                    </div>
                  </div>
                </div>
                {gFilterCount>0&&<div style={{marginTop:12,padding:'6px 10px',borderRadius:8,background:'rgba(13,110,79,.05)',fontSize:11,fontWeight:600,color:$.ac,textAlign:'center'}}>{fN(gRows.length)} / {fN(calcRows.length)} kayıt filtrelendi</div>}
              </div></>}
            </div></div>
            {(gSearch||gFilterCount>0)&&rows.length>0&&<div style={{padding:'3px 9px',borderRadius:7,background:'rgba(13,110,79,.08)',fontSize:12,fontWeight:600,color:$.ac,whiteSpace:'nowrap'}}>{fN(gRows.length)}/{fN(calcRows.length)}</div>}
            {erpStatus&&<div style={{padding:'3px 9px',borderRadius:7,background:$.grnB,fontSize:11,fontWeight:600,color:'#0d6e4f',display:'flex',alignItems:'center',gap:5}}>{erpLoading&&<span style={{display:'inline-block',width:10,height:10,border:'2px solid #0d6e4f',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>}{erpStatus}</div>}
            {erpError&&<div style={{padding:'3px 9px',borderRadius:7,background:$.redB,fontSize:11,fontWeight:600,color:$.red,cursor:'pointer'}} onClick={()=>setErpError('')}>{erpError} x</div>}
            <div style={{fontSize:11,fontFamily:$.mo,fontWeight:500,color:'#6e6e73'}}>{new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'})}</div>
            {MSAL_ENABLED&&msalAccount&&(
              <button className="tb-b pr" onClick={handleErpFetch} disabled={erpLoading} style={{gap:5,fontSize:11,padding:'6px 12px',borderRadius:8}}>
                {erpLoading?<span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>:<Database size={13}/>}
                {erpLoading?'Güncelleniyor...':'Verileri Güncelle'}
              </button>
            )}
            <button className="tb-b" onClick={()=>setChatOpen(true)} style={{gap:5,fontSize:11,padding:'6px 12px',borderRadius:8,background:'linear-gradient(135deg,#2dd4a0,#3b82f6)',color:'#fff',border:'none'}}>
              <svg width="13" height="13" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"><path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="rgba(255,255,255,.8)"/><path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="rgba(255,255,255,.6)"/><path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="#fff"/></svg>
              TYRO'ya Sor
            </button>
          </>}
        </div>
        <div style={{flex:1,overflow:'auto',display:'flex'}}>
          <div style={{flex:1,overflow:'auto',padding:mob?'12px 12px 80px':22}}>

            {/* ===== DASHBOARD ===== */}
            {pg==='dash'&&(
              <div>
                {/* KPI Cards */}
                {(()=>{const critQty=gRows.filter(r=>r[27]>=180).reduce((s,r)=>s+r[8],0);const critPct=D.s.totalQty>0?((critQty/D.s.totalQty)*100).toFixed(1):'0';
                const tips=[
                  'Tüm tesislerdeki toplam envanter miktarı (kg). Formül: Σ Miktar (tüm satırlar)',
                  'Envanterin USD cinsinden toplam değeri. Formül: Σ (Miktar × Birim Fiyat $)',
                  'Aktif tesis ve depo sayısı. Benzersiz Tesis Kodu ve Depo Kodu sayımı',
                  'Stokta bulunan benzersiz ürün (Ürün Adı) sayısı. Ürün çeşitliliği göstergesi',
                  'Miktar ağırlıklı ortalama yaşlanma. Formül: Σ(Miktar × PurchFIFO) / Σ Miktar',
                  '180 gün ve üzeri PurchFIFO değerine sahip stoklar. Fire ve değer kaybı riski taşır. Oran: Kritik Miktar / Toplam Miktar × 100',
                ];
                return(
                <div style={{display:'grid',gridTemplateColumns:mob?'repeat(2,1fr)':'repeat(6,1fr)',gap:mob?8:10,marginBottom:mob?14:20}}>
                  {/* Son ayın değişim %'si — cache'ten oku (panel kapansa bile kalır) */}
                  {(()=>{
                  const lastPct=(metric)=>{
                    const cached=trendPctCache.current[metric];
                    return cached!==undefined?cached:null;
                  };
                  return[
                    {metric:'qty',l:'Toplam Stok',v:fmtTon(D.s.totalQty),cls:'blu',ic:<Package size={18}/>,pct:lastPct('qty')},
                    {metric:'value',l:'Toplam Değer',v:'$'+fmt(D.s.totalVal),cls:'grn',ic:<TrendingUp size={18}/>,pct:lastPct('value')},
                    {metric:'facilities',l:'Tesis / Depo',v:D.s.facilityCount+' / '+D.s.whCount,cls:'pur',ic:<Building2 size={18}/>,pct:lastPct('facilities')},
                    {metric:'products',l:'Aktif Ürün',v:String(D.s.prodCount),cls:'tel',ic:<Layers size={18}/>,pct:lastPct('products')},
                    {metric:'avgAge',l:'Ort. Yaşlanma (FIFO)',v:String(D.s.avgAge)+' gün',cls:'org',ic:<Clock size={18}/>,pct:lastPct('avgAge')},
                    {metric:'criticalStock',l:'Kritik Stok (180+ gün)',v:fmtTon(critQty),cls:'red',ic:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,sub:critPct+'% toplam stokun',pct:lastPct('criticalStock')},
                  ].map((k,i)=>{const cc=clr(k.cls);const clickable=!!k.metric;return(
                    <div key={i} className="kp fu" onClick={clickable?()=>setTrendKPI(k.metric):undefined}
                      onMouseEnter={e=>{
                        const card=e.currentTarget;
                        const icon=card.querySelector('[data-kpi-icon]');
                        const bar=card.querySelector('[data-kpi-bar]');
                        const hint=card.querySelector('[data-kpi-hint]');
                        if(icon){icon.style.transform='scale(1.15)';icon.style.boxShadow='0 0 12px '+cc.c+'33';}
                        if(bar){bar.style.opacity='1';bar.style.background='linear-gradient(90deg,'+cc.c+','+cc.c+'66)';}
                        if(hint){hint.style.opacity='1';hint.style.transform='translateY(0)';}
                      }}
                      onMouseLeave={e=>{
                        const card=e.currentTarget;
                        const icon=card.querySelector('[data-kpi-icon]');
                        const bar=card.querySelector('[data-kpi-bar]');
                        const hint=card.querySelector('[data-kpi-hint]');
                        if(icon){icon.style.transform='scale(1)';icon.style.boxShadow='none';}
                        if(bar){bar.style.opacity='.6';bar.style.background='linear-gradient(90deg,'+cc.c+',transparent)';}
                        if(hint){hint.style.opacity='0';hint.style.transform='translateY(4px)';}
                      }}
                      style={{animationDelay:i*70+'ms',background:'rgba(255,255,255,.7)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.6)',borderRadius:$.rM,padding:'13px 14px',position:'relative',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.8)',cursor:clickable?'pointer':'default'}}>
                      <div data-kpi-bar style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,'+cc.c+',transparent)',opacity:.6,borderRadius:'12px 12px 0 0',transition:'all .3s ease'}}/>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:7}}>
                        <div data-kpi-icon style={{transition:'all .3s cubic-bezier(.4,0,.2,1)',borderRadius:8,overflow:'hidden'}}><KI bg={cc.bg} color={cc.c}>{k.ic}</KI></div>
                        <div onMouseEnter={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setHovTip({i,x:r.left+r.width/2,y:r.bottom+8});}} onMouseLeave={e=>{e.stopPropagation();setHovTip(null);}} style={{width:21,height:21,borderRadius:'50%',border:'1.5px solid '+$.bd,background:$.bg2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'help',fontSize:10,fontWeight:800,color:hovTip?.i===i?cc.c:$.t3,transition:'all .15s',flexShrink:0}}>
                          i
                        </div>
                      </div>
                      <div ref={el=>{
                        // Sayı sayma animasyonu — mount'ta 0'dan hedefe say
                        if(!el||el.dataset.counted)return;el.dataset.counted='1';
                        const target=k.v;const numMatch=target.match(/[\d,.]+/);
                        if(!numMatch){el.textContent=target;return;}
                        const numStr=numMatch[0];const numVal=parseFloat(numStr.replace(/,/g,''));
                        if(isNaN(numVal)||numVal===0){el.textContent=target;return;}
                        const prefix=target.slice(0,target.indexOf(numStr));
                        const suffix=target.slice(target.indexOf(numStr)+numStr.length);
                        const hasDecimal=numStr.includes('.');const decimals=hasDecimal?numStr.split('.')[1].length:0;
                        let start=0;const duration=800;const startTime=performance.now()+(i*80);
                        const step=(now)=>{
                          const elapsed=now-startTime;
                          if(elapsed<0){el.textContent=prefix+'0'+suffix;requestAnimationFrame(step);return;}
                          const progress=Math.min(elapsed/duration,1);
                          const eased=1-Math.pow(1-progress,3); // easeOutCubic
                          const current=numVal*eased;
                          const formatted=hasDecimal?current.toFixed(decimals):Math.round(current).toLocaleString('tr-TR');
                          el.textContent=prefix+formatted+suffix;
                          if(progress<1)requestAnimationFrame(step);else el.textContent=target;
                        };
                        requestAnimationFrame(step);
                      }} style={{fontSize:i<2?22:19,fontWeight:700,marginBottom:1,fontFamily:$.mo,fontVariantNumeric:'tabular-nums',color:k.cls==='red'?$.red:$.t1}}>{k.v}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{fontSize:12,color:$.t2,fontWeight:500}}>{k.sub||k.l}</div>
                        {k.pct!=null&&<div style={{display:'flex',alignItems:'center',gap:2,padding:'1px 6px',borderRadius:6,fontSize:10,fontWeight:700,
                          background:k.pct>=0?'rgba(13,110,79,.08)':'rgba(229,72,77,.08)',
                          color:k.pct>=0?'#0d6e4f':'#e5484d'}}>
                          {k.pct>=0?'▲':'▼'}{Math.abs(k.pct).toFixed(1)}%
                        </div>}
                      </div>
                      {/* Hover hint */}
                      {clickable&&<div data-kpi-hint style={{fontSize:10,fontWeight:600,color:cc.c,marginTop:4,opacity:0,transform:'translateY(4px)',transition:'all .25s ease'}}>Trend'i gör →</div>}
                    </div>);})})()}
                </div>);})()}

                {/* MAP — Türkiye / Dünya (harita içi öğelerle geçiş) */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:18,overflow:'hidden'}}>
                  <div style={{padding:'15px 18px 13px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid '+$.bdL}}>
                    <div style={{fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:7,background:dashMapMode==='turkey'?$.bluB:$.purB,color:dashMapMode==='turkey'?$.blu:$.pur,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{dashMapMode==='turkey'?<MapPin size={14}/>:<Globe size={14}/>}</div>
                      {dashMapMode==='turkey'?'Tiryaki Haritası':'Dünya Haritası'}
                      <span style={{fontSize:9,fontWeight:600,color:$.ac,background:$.acL,padding:'2px 8px',borderRadius:6,marginLeft:4}}>3D</span>
                    </div>
                  </div>
                  <Suspense fallback={<div style={{height:450,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#f0f4f8,#f5f7fa)',borderRadius:'0 0 16px 16px'}}><span style={{fontSize:12,color:'#5a6b7f'}}>Harita yükleniyor...</span></div>}>
                    {dashMapMode==='turkey'?<TurkeyMap3D
                      cities={D.ct.filter(c=>c.n!=='Yurtdışı')}
                      maxQty={mQ}
                      sel={sel}
                      hov={hov}
                      onSelect={(name)=>{setSel(sel===name?null:name);setDrillFac(null);setDrillWh(null);}}
                      onHover={setHov}
                      onHoverEnd={()=>setHov(null)}
                      acFn={ac} fmt={fmt} fmtTon={fmtTon} fN={fN}
                      yurtdisi={D.ct.find(c=>c.n==='Yurtdışı')||null}
                      onSwitchToWorld={()=>{setDashMapMode('world');setSel(null);setDrillFac(null);setDrillWh(null);}}
                    />:<WorldMap3D
                      countries={DW.countries}
                      maxQty={mQW}
                      sel={emSel}
                      hov={emHov}
                      onSelect={(name)=>{setEmSel(name===null?null:(emSel===name?null:name));setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setEmTab('f');}}
                      onHover={n=>setEmHov(n)}
                      onHoverEnd={()=>setEmHov(null)}
                      acFn={ac} fmt={fmt} fmtTon={fmtTon} fN={fN}
                      onGlobalClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setEmTab('f');}}
                      globalActive={emSel==='__global__'}
                      onSwitchToTurkey={()=>{setDashMapMode('turkey');setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}
                    />}
                  </Suspense>
                </div>

                {/* Charts below map */}
                <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:13,marginTop:18}}>
                  {/* Aging Bar Chart (from Analiz) */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.bluB,color:$.blu,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><BarChart3 size={14}/></div>
                      {'Yaşlanma Dağılımı (FIFO)'}
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      {(()=>{const mx=Math.max(...BK.map(b=>D.ag[b.k]||0),1);const tq=D.s.totalQty||1;return(
                        <div style={{display:'flex',gap:4,alignItems:'flex-end',height:140}}>
                          {BK.map(b=>{const v=D.ag[b.k]||0;const pct=((v/tq)*100).toFixed(1);const h=Math.max(4,(v/mx)*110);return(
                            <div key={b.k} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:0,overflow:'hidden'}}>
                              <span style={{fontSize:9,fontFamily:$.mo,fontWeight:700,color:$.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{fmtTon(v)}</span>
                              <span style={{fontSize:8.5,fontFamily:$.mo,color:b.c,fontWeight:600}}>{pct}%</span>
                              <div style={{width:'100%',borderRadius:6,background:b.c,opacity:.75,height:h,transition:'height .5s ease'}}/>
                              <span style={{fontSize:9,color:$.t3,fontWeight:500,whiteSpace:'nowrap'}}>{b.k}</span>
                            </div>);})}
                        </div>)})()}
                    </div>
                  </div>
                  {/* Facility Type */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.purB,color:$.pur,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Layers size={14}/></div>
                      {'Tesis Tipi Dağılımı'}
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      {(()=>{const tq=D.s.totalQty||1;const types=Object.entries(TI).map(([k,v])=>({k,c:v.color,l:v.label,q:D.f.filter(f=>f.type===k).reduce((s,f)=>s+f.q,0)})).filter(t=>t.q>0);const mx=Math.max(...types.map(t=>t.q),1);return(
                        <div style={{display:'flex',flexDirection:'column',gap:10}}>
                          {types.map(t=>{const pct=((t.q/tq)*100).toFixed(1);return(
                            <div key={t.k}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:10,height:10,borderRadius:3,background:t.c}}/>
                                  <span style={{fontSize:12,color:$.t2,fontWeight:600}}>{t.l}</span>
                                </div>
                                <span style={{fontSize:12,fontFamily:$.mo,fontWeight:700,color:t.c}}>{pct}%</span>
                              </div>
                              <div style={{height:10,borderRadius:5,background:$.bdL,overflow:'hidden'}}>
                                <div style={{height:'100%',width:(t.q/mx)*100+'%',borderRadius:5,background:t.c,opacity:.65,transition:'width .5s ease'}}/>
                              </div>
                            </div>);})}
                        </div>)})()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== KPI TREND PANELİ (dinamik metric) ===== */}
            {(()=>{const M=trendKPI?KPI_METRICS[trendKPI]:null;const MIcon=M?.icon||TrendingUp;return(<>
            {trendKPI&&<div onClick={()=>setTrendKPI(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',zIndex:998}}/>}
            <div style={{position:'fixed',top:0,right:0,width:mob?'95vw':520,height:'100vh',background:$.bg2,borderLeft:'1px solid '+$.bdL,boxShadow:'-12px 0 40px rgba(0,0,0,.15)',zIndex:999,transform:trendKPI?'translateX(0)':'translateX(100%)',transition:'transform .3s cubic-bezier(.4,0,.2,1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:M?.bg||$.bluB,color:M?.c||$.blu,display:'flex',alignItems:'center',justifyContent:'center'}}><MIcon size={17}/></div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:$.t1}}>{M?.label||'Trend'} Trend Analizi</div>
                    <div style={{fontSize:10.5,color:$.t3,fontWeight:500}}>{M?.subtitle||''} · Her ayın ilk haftası · Son ay için en güncel · Ocak 2025'ten itibaren</div>
                  </div>
                </div>
                <div onClick={()=>setTrendKPI(null)} className="rh" style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={15} color={$.t2}/></div>
              </div>

              <div style={{padding:'14px 20px 10px',display:'flex',gap:6,borderBottom:'1px solid '+$.bdL,flexShrink:0}}>
                {[{k:'year',l:'Yıllık'},{k:'quarter',l:'Çeyreklik'},{k:'month',l:'Aylık'}].map(m=>{const sel=trendMode===m.k;return(
                  <button key={m.k} onClick={()=>setTrendMode(m.k)} style={{padding:'6px 14px',borderRadius:8,background:sel?$.ac:'transparent',color:sel?'#fff':$.t2,border:'1px solid '+(sel?$.ac:$.bdL),fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:$.f}}>{m.l}</button>
                );})}
              </div>

              {trendMode!=='year'&&(
                <div style={{padding:'10px 20px',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',borderBottom:'1px solid '+$.bdL,flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4}}>Yıl</span>
                    <select className="fi" value={trendYear} onChange={e=>setTrendYear(Number(e.target.value))} style={{width:90,fontSize:11}}>
                      {trendYearOpts.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {trendMode==='month'&&(
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4}}>Ay</span>
                      <select className="fi" value={trendMonth===null?'':trendMonth} onChange={e=>setTrendMonth(e.target.value===''?null:Number(e.target.value))} style={{width:110,fontSize:11}}>
                        <option value="">Tümü</option>
                        {MONTHS_TR.map((m,i)=><option key={i} value={i}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  {gFilterCount>0&&<span style={{fontSize:10,fontWeight:600,color:$.ac,background:$.acL,padding:'3px 8px',borderRadius:6}}>{gFilterCount} filtre aktif</span>}
                </div>
              )}

              <div style={{flex:1,overflowY:'auto',padding:'16px 20px 20px'}}>
                {trendLoading&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',gap:12}}>
                    <div style={{width:28,height:28,border:'3px solid '+$.bdL,borderTopColor:$.ac,borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
                    <div style={{fontSize:12,color:$.t2,fontWeight:500}}>Trend verisi yükleniyor...</div>
                  </div>
                )}
                {trendErr&&!trendLoading&&(
                  <div style={{padding:'20px',background:$.redB,border:'1px solid '+$.red,borderRadius:10,color:$.red,fontSize:12,fontWeight:500}}>
                    <div style={{fontWeight:700,marginBottom:4}}>Veri alınamadı</div>
                    <div>{trendErr}</div>
                  </div>
                )}
                {!trendLoading&&!trendErr&&trendRaw.length===0&&(
                  <div style={{padding:'60px 20px',textAlign:'center',color:$.t3,fontSize:12}}>Kayıt bulunamadı</div>
                )}
                {!trendLoading&&!trendErr&&trendRaw.length>0&&trendPoints.length>0&&M&&(()=>{
                  const validPts=trendPoints.filter(p=>p.value!=null);
                  const mx=Math.max(...validPts.map(p=>p.value),1);
                  const totalSum=validPts.reduce((s,p)=>s+p.value,0);
                  const avg=validPts.length>0?totalSum/validPts.length:0;
                  const pctChange=(cur,prev)=>{if(prev==null||cur==null||prev===0)return null;return((cur-prev)/prev)*100;};
                  let prevVal=null;
                  const ptsWithPct=trendPoints.map(p=>{let pct=null;if(p.value!=null&&prevVal!=null){pct=pctChange(p.value,prevVal);}if(p.value!=null)prevVal=p.value;return{...p,pct};});
                  const overallPct=validPts.length>=2?pctChange(validPts[validPts.length-1].value,validPts[0].value):null;
                  return(<>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
                      <div style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                        <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>Ortalama</div>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:$.mo,color:M.c}}>{M.fmt(avg)}</div>
                      </div>
                      <div style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                        <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>Dönem Değişimi</div>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:$.mo,color:overallPct==null?$.t3:overallPct>=0?'#0d6e4f':$.red}}>
                          {overallPct==null?'—':(overallPct>=0?'▲ ':'▼ ')+Math.abs(overallPct).toFixed(1)+'%'}
                        </div>
                      </div>
                      <div style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                        <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>Veri Noktası</div>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:$.mo,color:$.t1}}>{validPts.length} / {trendPoints.length}</div>
                      </div>
                    </div>

                    <div style={{padding:'8px 4px 14px',display:'flex',alignItems:'flex-end',gap:6,height:220,borderBottom:'1px solid '+$.bdL,marginBottom:14}}>
                      {ptsWithPct.map((p,i)=>{const h=p.value!=null?(p.value/mx)*160:0;const pctColor=p.pct==null?$.t3:p.pct>=0?'#0d6e4f':$.red;return(
                        <div key={i} title={p.date?`${p.label} · ${p.date} · ${M.fmt(p.value)}${p.pct!=null?` · ${p.pct>=0?'+':''}${p.pct.toFixed(1)}%`:''}`:p.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:0}}>
                          {p.pct!=null&&<div style={{fontSize:8.5,fontFamily:$.mo,color:pctColor,fontWeight:700,whiteSpace:'nowrap'}}>{(p.pct>=0?'▲':'▼')+Math.abs(p.pct).toFixed(0)+'%'}</div>}
                          {p.pct==null&&p.value!=null&&<div style={{fontSize:8.5,height:11}}/>}
                          <div style={{fontSize:9.5,fontFamily:$.mo,color:$.t1,fontWeight:700,whiteSpace:'nowrap'}}>{p.value!=null?M.fmtShort(p.value):'—'}</div>
                          <div style={{width:'100%',height:h,background:p.value!=null?M.c:$.bdL,borderRadius:'4px 4px 0 0',minHeight:p.value!=null?2:0,transition:'height .3s'}}/>
                          <div style={{fontSize:9,color:$.t3,fontWeight:600,whiteSpace:'nowrap',transform:trendPoints.length>6?'rotate(-35deg)':'none',transformOrigin:'center top',marginTop:trendPoints.length>6?4:0}}>{p.label}</div>
                        </div>
                      );})}
                    </div>

                    <div style={{fontSize:11,fontWeight:700,color:$.t1,marginBottom:8,textTransform:'uppercase',letterSpacing:.4}}>Veri Tablosu</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid '+$.bdL}}>
                          <th style={{padding:'7px 8px',textAlign:'left',color:$.t3,fontWeight:700,fontSize:9.5,textTransform:'uppercase',letterSpacing:.4}}>Dönem</th>
                          <th style={{padding:'7px 8px',textAlign:'left',color:$.t3,fontWeight:700,fontSize:9.5,textTransform:'uppercase',letterSpacing:.4}}>Rapor Tarihi</th>
                          <th style={{padding:'7px 8px',textAlign:'right',color:$.t3,fontWeight:700,fontSize:9.5,textTransform:'uppercase',letterSpacing:.4}}>{M.label}</th>
                          <th style={{padding:'7px 8px',textAlign:'right',color:$.t3,fontWeight:700,fontSize:9.5,textTransform:'uppercase',letterSpacing:.4}}>Kayıt</th>
                          <th style={{padding:'7px 8px',textAlign:'right',color:$.t3,fontWeight:700,fontSize:9.5,textTransform:'uppercase',letterSpacing:.4}}>% Değişim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ptsWithPct.map((p,i)=>{const pc=p.pct==null?$.t3:p.pct>=0?'#0d6e4f':$.red;return(
                          <tr key={i} style={{borderBottom:'1px solid '+$.bdL,background:i%2?'#fafbfc':'transparent'}}>
                            <td style={{padding:'7px 8px',fontWeight:600,color:$.t1}}>{p.label}</td>
                            <td style={{padding:'7px 8px',fontFamily:$.mo,color:$.t2,fontSize:10.5}}>{p.date||'—'}</td>
                            <td style={{padding:'7px 8px',textAlign:'right',fontFamily:$.mo,fontWeight:700,color:p.value!=null?M.c:$.t3}}>{p.value!=null?M.fmt(p.value):'—'}</td>
                            <td style={{padding:'7px 8px',textAlign:'right',fontFamily:$.mo,fontWeight:600,color:p.recordCount!=null?$.t2:$.t3,fontSize:10.5}}>{p.recordCount!=null?fN(p.recordCount):'—'}</td>
                            <td style={{padding:'7px 8px',textAlign:'right',fontFamily:$.mo,fontWeight:700,color:pc}}>{p.pct==null?'—':(p.pct>=0?'▲ +':'▼ ')+Math.abs(p.pct).toFixed(1)+'%'}</td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </>);
                })()}
              </div>
            </div>
            </>);})()}

            {/* ===== ANALİZ & RİSK ===== */}
            {pg==='ana'&&(()=>{
              const{tq,tVal,oldest10,youngest10,top10,bot10,mxP,rCounts,donutSegs}=anaData;
              const prodRow=(p,i,mode,last)=>(
                <div key={p.n+mode} onClick={()=>setAnaDetail({type:'product',name:p.n,data:p})} style={{padding:'8px 12px',borderRadius:8,marginBottom:i<last?6:0,cursor:'pointer',transition:'background .15s',background:'transparent'}} className="rh">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:$.t1,maxWidth:mob?120:190,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      {mode==='age'&&<span style={{fontFamily:$.mo,fontSize:12,fontWeight:800,color:ac(p.a),padding:'2px 8px',borderRadius:5,background:acBg(p.a)}}>{p.a}g</span>}
                      {mode==='qty'&&<span style={{fontFamily:$.mo,fontSize:12,fontWeight:700,color:$.t1}}>{fmtTon(p.q)}</span>}
                      <ChevronRight size={13} color={$.t2}/>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:6,borderRadius:3,background:$.bdL,overflow:'hidden'}}>
                      <div style={{height:'100%',width:mode==='age'?Math.min(100,(p.a/500)*100)+'%':(p.q/mxP)*100+'%',borderRadius:3,background:ac(p.a),opacity:.5,transition:'width .5s'}}/>
                    </div>
                    {mode==='age'&&<span style={{fontFamily:$.mo,fontSize:11,color:$.t2,fontWeight:600,minWidth:50,textAlign:'right'}}>{fmtTon(p.q)}</span>}
                    {mode==='qty'&&<span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(p.a),padding:'2px 6px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>}
                  </div>
                </div>);
              return(
                <div>
                  {/* Slide-in right panel */}
                  {anaDetail&&<div onClick={()=>setAnaDetail(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.2)',zIndex:998,transition:'opacity .3s'}}/>}
                  <div style={{position:'fixed',top:0,right:0,width:mob?'92vw':440,height:'100vh',background:$.bg2,borderLeft:'1px solid '+$.bdL,boxShadow:'-8px 0 30px rgba(0,0,0,.08)',zIndex:999,transform:anaDetail?'translateX(0)':'translateX(100%)',transition:'transform .3s cubic-bezier(.4,0,.2,1)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
                    <div style={{padding:'16px 20px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:15,fontWeight:700,color:$.t1}}>{anaDetail?.name}</span>
                        {anaDetail?.type==='product'&&<span style={{fontSize:12,color:$.t2,fontWeight:500}}>{anaDetail.data.sc} tesis</span>}
                        {anaDetail?.type==='risk'&&<span style={{fontSize:12,color:anaDetail.data.c,fontWeight:600}}>{anaDetail.data.r}</span>}
                        {anaDetail?.type==='value'&&<span style={{fontSize:12,color:anaDetail.data.c,fontWeight:600}}>{anaDetail.data.k} gün</span>}
                      </div>
                      <div onClick={()=>setAnaDetail(null)} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh"><X size={15} color={$.t2}/></div>
                    </div>
                    <div style={{padding:'16px 20px',flex:1,overflowY:'auto'}}>
                      {anaDetail?.type==='product'&&(()=>{
                        const p=anaDetail.data;
                        const pRows=gRows.filter(r=>r[3]===p.n);
                        const bySite={};pRows.forEach(r=>{const s=r[10]||r[9];if(!bySite[s])bySite[s]={n:s,q:0,v:0,td:0,tq:0};bySite[s].q+=r[8];bySite[s].v+=r[8]*r[25];bySite[s].td+=r[8]*r[27];bySite[s].tq+=r[8];});
                        const sites=Object.values(bySite).map(s=>({...s,a:s.tq>0?Math.round(s.td/s.tq):0})).sort((a,b)=>b.q-a.q);
                        return(<div>
                          <div style={{display:'grid',gridTemplateColumns:mob?'1fr 1fr':'repeat(4,1fr)',gap:8,marginBottom:14}}>
                            {[{l:'Toplam Stok',v:fmtTon(p.q),c:$.blu},{l:'Toplam Değer',v:'$'+fmt(p.v),c:'#0d6e4f'},{l:'Ort. Yaş',v:p.a+' gün',c:ac(p.a)},{l:'Tesis Sayısı',v:p.sc,c:$.pur}].map((k,i)=>(
                              <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                                <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                                <div style={{fontSize:16,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                              </div>))}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>Tesis Dağılımı</div>
                          {sites.map((s,i)=>(
                            <div key={s.n} style={{padding:'8px 0',borderBottom:i<sites.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(s.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(s.a),padding:'2px 7px',borderRadius:4,background:acBg(s.a)}}>{s.a}g</span>
                            </div>))}
                        </div>);
                      })()}
                      {anaDetail?.type==='risk'&&(()=>{
                        const facs=anaDetail.data.facs||[];
                        const df=anaDetail.drillFac;const dt=anaDetail.drillTab||'l3';
                        if(df){
                          // Drill into a specific facility
                          const facRows=gRows.filter(r=>r[9]===df.id||r[10]===df.n);
                          const tabs=[{id:'l3',l:'Seviye 3',idx:19},{id:'l2',l:'Seviye 2',idx:17},{id:'prod',l:'Ürünler',idx:3}];
                          const cur=tabs.find(t=>t.id===dt)||tabs[0];
                          const grp={};facRows.forEach(r=>{const k=r[cur.idx]||'Diğer';const q=r[8];const v=r[8]*r[25];const d=r[27];if(!grp[k])grp[k]={n:k,q:0,v:0,td:0,tq:0};grp[k].q+=q;grp[k].v+=v;grp[k].td+=q*d;grp[k].tq+=q;});
                          const items=Object.values(grp).map(x=>({...x,a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.q-a.q);
                          return(<div>
                            <div onClick={()=>setAnaDetail(p=>({...p,drillFac:null}))} style={{display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 14px',borderRadius:10,background:$.grnB,border:'1px solid rgba(13,110,79,.15)',marginBottom:14,transition:'all .15s'}} className="rh">
                              <ChevronLeft size={15} color={$.ac}/><span style={{fontSize:12,fontWeight:700,color:$.ac}}>Tesislere Dön</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                              <div style={{width:8,height:8,borderRadius:4,background:anaDetail.data.c}}/>
                              <span style={{fontSize:13,fontWeight:700,color:$.t1}}>{df.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(df.a),padding:'2px 7px',borderRadius:4,background:acBg(df.a)}}>{df.a}g</span>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:14}}>
                              {[{l:'Stok',v:fmtTon(df.q),c:$.blu},{l:'Değer',v:'$'+fmt(df.v),c:'#0d6e4f'},{l:'Yaş',v:df.a+' gün',c:ac(df.a)}].map((k,i)=>(
                                <div key={i} style={{background:$.bg,borderRadius:8,padding:'8px 10px',border:'1px solid '+$.bdL,textAlign:'center'}}>
                                  <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:2}}>{k.l}</div>
                                  <div style={{fontSize:14,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                                </div>))}
                            </div>
                            {/* Tabs */}
                            <div style={{display:'flex',gap:4,marginBottom:12,background:$.bg,borderRadius:8,padding:3}}>
                              {tabs.map(t=>(
                                <div key={t.id} onClick={()=>setAnaDetail(p=>({...p,drillTab:t.id}))} style={{flex:1,textAlign:'center',padding:'7px 0',borderRadius:6,fontSize:12,fontWeight:dt===t.id?700:500,cursor:'pointer',background:dt===t.id?'#fff':'transparent',color:dt===t.id?$.t1:$.t2,boxShadow:dt===t.id?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .2s'}}>{t.l}</div>
                              ))}
                            </div>
                            {/* Items */}
                            {items.map((it,i)=>(
                              <div key={it.n} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}}>
                                <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.n}</span>
                                <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(it.q)}</span>
                                <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>${fmt(it.v)}</span>
                                <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(it.a),padding:'2px 7px',borderRadius:4,background:acBg(it.a)}}>{it.a}g</span>
                              </div>))}
                            {items.length===0&&<div style={{fontSize:12,color:$.t2,padding:12,textAlign:'center'}}>Bu tesiste veri yok</div>}
                          </div>);
                        }
                        // Facility list
                        return(<div>
                          <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>{facs.length} tesis — {fmtTon(anaDetail.data.qty)}</div>
                          {facs.sort((a,b)=>b.q-a.q).map((f,i)=>(
                            <div key={f.id} onClick={()=>setAnaDetail(p=>({...p,drillFac:f,drillTab:'l3'}))} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}} className="rh">
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(f.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a)}}>{f.a}g</span>
                              <ChevronRight size={13} color={$.t2}/>
                            </div>))}
                        </div>);
                      })()}
                      {anaDetail?.type==='value'&&(()=>{
                        const bk=anaDetail.data;
                        const range=bk.k;const ranges={'0-30':[0,30],'31-60':[31,60],'61-90':[61,90],'91-120':[91,120],'121-180':[121,180],'181-365':[181,365],'365+':[365,9999]};
                        const [lo,hi]=ranges[range]||[0,9999];
                        const bRows=gRows.filter(r=>r[27]>=lo&&r[27]<=hi);
                        const byProd={};bRows.forEach(r=>{const n=r[3];if(!byProd[n])byProd[n]={n,q:0,v:0};byProd[n].q+=r[8];byProd[n].v+=r[8]*r[25];});
                        const prods=Object.values(byProd).sort((a,b)=>b.v-a.v).slice(0,15);
                        return(<div>
                          <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'repeat(3,1fr)',gap:8,marginBottom:14}}>
                            {[{l:'Toplam Değer',v:'$'+fmt(bk.v),c:bk.c},{l:'Satır Sayısı',v:fN(bRows.length),c:$.blu},{l:'Oran',v:(bk.pct*100).toFixed(1)+'%',c:$.t1}].map((k,i)=>(
                              <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                                <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                                <div style={{fontSize:16,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                              </div>))}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>En Yüksek Değerli Ürünler</div>
                          {prods.map((p,i)=>(
                            <div key={p.n} style={{padding:'8px 0',borderBottom:i<prods.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:11,fontWeight:700,color:$.t2,width:18,textAlign:'right'}}>{i+1}</span>
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(p.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:bk.c}}>${fmt(p.v)}</span>
                            </div>))}
                        </div>);
                      })()}
                    </div>
                  </div>

                  {/* Top row: Risk Özeti + Stok Değer Dağılımı */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:16,marginBottom:16}}>
                    {/* Risk Summary — clickable */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.redB,color:$.red,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Activity size={14}/></div>
                        {'Risk Özeti'}
                      </div>
                      <div style={{padding:'14px 18px'}}>
                        {rCounts.map((r,i)=>(
                          <div key={r.k} onClick={()=>setAnaDetail({type:'risk',name:r.l+' Tesisler',data:r})} style={{padding:'10px 12px',borderRadius:$.rM,background:r.bg,marginBottom:i<3?8:0,cursor:'pointer',transition:'background .15s'}} className="rh">
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                              <div>
                                <span style={{fontSize:12.5,fontWeight:700,color:r.c}}>{r.l}</span>
                                <span style={{fontSize:11,color:$.t2,marginLeft:8}}>{r.r}</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontFamily:$.mo,fontSize:13,fontWeight:800,color:r.c}}>{r.count} tesis</span>
                                <ChevronRight size={13} color={$.t2}/>
                              </div>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{flex:1,height:8,borderRadius:4,background:'rgba(0,0,0,.04)',overflow:'hidden'}}>
                                <div style={{height:'100%',width:D.f.length>0?(r.count/D.f.length)*100+'%':'0%',borderRadius:4,background:r.c,opacity:.6,transition:'width .5s'}}/>
                              </div>
                              <span style={{fontFamily:$.mo,fontSize:11,color:$.t2,fontWeight:600,minWidth:55,textAlign:'right'}}>{fmtTon(r.qty)}</span>
                            </div>
                          </div>))}
                      </div>
                    </div>
                    {/* Donut Chart — clickable segments */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><TrendingUp size={14}/></div>
                        {'Stok Değer Dağılımı ($)'}
                      </div>
                      <div style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:16}}>
                        <svg width={mob?100:140} height={mob?100:140} viewBox="0 0 140 140" style={{cursor:'pointer',flexShrink:0}}>
                          {donutSegs.map(s=><path key={s.k} d={arcFn(70,70,55,s.start-90,s.end-90)} fill="none" stroke={s.c} strokeWidth="18" strokeLinecap="round" opacity=".8" style={{cursor:'pointer'}} onClick={()=>setAnaDetail({type:'value',name:s.k+' Gün — Değer Detayı',data:s})}/>)}
                          <text x="70" y="65" textAnchor="middle" fontSize="12" fontWeight="800" fill={$.t1} fontFamily="Plus Jakarta Sans">${fmt(tVal)}</text>
                          <text x="70" y="82" textAnchor="middle" fontSize="10" fill={$.t2} fontWeight="500">{'Toplam Değer'}</text>
                        </svg>
                        <div style={{display:'flex',flexDirection:'column',gap:4,flex:1}}>
                          {donutSegs.map(s=>(
                            <div key={s.k} onClick={()=>setAnaDetail({type:'value',name:s.k+' Gün — Değer Detayı',data:s})} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',borderRadius:6,cursor:'pointer',transition:'background .15s'}} className="rh">
                              <div style={{width:8,height:8,borderRadius:3,background:s.c,flexShrink:0}}/>
                              <span style={{fontSize:12,color:$.t1,fontWeight:500,flex:1}}>{s.k} Gün</span>
                              <span style={{fontSize:12,fontFamily:$.mo,fontWeight:700,color:$.t1}}>${fmt(s.v)}</span>
                              <ChevronRight size={11} color={$.t2}/>
                            </div>))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom row: Stok Yaşlanma + Stok Miktarı */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:16}}>
                    {/* Yaşlanma: En Yaşlı + En Genç */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.redB,color:$.red,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Clock size={14}/></div>
                        <span style={{fontSize:13,fontWeight:700}}>Stok Yaşlanma (1+ Ton)</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',minHeight:0}}>
                        <div style={{padding:'12px 14px',borderRight:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,fontWeight:700,color:$.red,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>En Yaşlı 10</div>
                          {oldest10.map((p,i)=>prodRow(p,i,'age',9))}
                          {oldest10.length===0&&<div style={{fontSize:11,color:$.t3,padding:12}}>Veri yok</div>}
                        </div>
                        <div style={{padding:'12px 14px'}}>
                          <div style={{fontSize:10,fontWeight:700,color:'#0d6e4f',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>En Genç 10</div>
                          {youngest10.map((p,i)=>prodRow(p,i,'age',9))}
                          {youngest10.length===0&&<div style={{fontSize:11,color:$.t3,padding:12}}>Veri yok</div>}
                        </div>
                      </div>
                    </div>
                    {/* Stok Miktarı: En Yüksek + En Düşük */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Package size={14}/></div>
                        <span style={{fontSize:13,fontWeight:700}}>Stok Miktarı (Ürün)</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',minHeight:0}}>
                        <div style={{padding:'12px 14px',borderRight:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,fontWeight:700,color:$.org,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>En Yüksek 10</div>
                          {top10.map((p,i)=>prodRow(p,i,'qty',9))}
                          {top10.length===0&&<div style={{fontSize:11,color:$.t3,padding:12}}>Veri yok</div>}
                        </div>
                        <div style={{padding:'12px 14px'}}>
                          <div style={{fontSize:10,fontWeight:700,color:$.blu,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>En Düşük 10</div>
                          {bot10.map((p,i)=>prodRow(p,i,'qty',9))}
                          {bot10.length===0&&<div style={{fontSize:11,color:$.t3,padding:12}}>Veri yok</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );})()}

            {/* ===== YÖNETİM ===== */}
            {pg==='yon'&&(()=>{
              const{comps,heatData,facPerf,maxFV,l2s,maxL2V,critQty,critVal,c180Qty,critProds,typeStats,avgAge,critPct,c180Pct,insights,actions}=yonData;

              return(
                <div>
                  {/* ── BENTO GRID ── */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'repeat(4,1fr)',gap:mob?10:14}}>

                    {/* AI Insights (span 1) + Aksiyon Önerileri (span 2) + Risk Radarı (span 1) */}
                    <BCard span={1}>
                      <BHead icon={Eye} color={'#6366f1'} bg={'rgba(99,102,241,.06)'} title="AI Insights"/>
                      <div style={{padding:'12px 16px'}}>
                        {insights.map((ins,i)=>(
                          <div key={i} style={{padding:'10px 12px',borderRadius:$.rM,background:ins.bg,marginBottom:i<insights.length-1?8:0,border:'1px solid '+ins.c+'18'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                              <ins.icon size={13} color={ins.c}/>
                              <span style={{fontSize:11,fontWeight:700,color:ins.c}}>{ins.t}</span>
                            </div>
                            <div style={{fontSize:10.5,color:$.t2,lineHeight:1.5,fontWeight:500}}>{ins.d}</div>
                          </div>))}
                      </div>
                    </BCard>

                    <BCard span={mob?1:2}>
                      <BHead icon={Zap} color={'#e5484d'} bg={'rgba(229,72,77,.06)'} title="Aksiyon Önerileri"/>
                      <div style={{padding:'12px 16px',display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:8}}>
                        {actions.map((a,i)=>(
                          <div key={i} style={{padding:'10px 12px',borderRadius:$.rM,background:a.bg,border:'1px solid '+a.c+'18'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                              <span style={{fontSize:9,fontWeight:800,color:'#fff',background:a.c,padding:'2px 7px',borderRadius:5,textTransform:'uppercase',letterSpacing:.5}}>{a.pri}</span>
                            </div>
                            <div style={{fontSize:11,fontWeight:700,color:$.t1,marginBottom:3,lineHeight:1.4}}>{a.t}</div>
                            <div style={{fontSize:12,color:$.t2,fontWeight:500,lineHeight:1.4}}>{a.sub}</div>
                          </div>))}
                      </div>
                    </BCard>

                    <BCard span={1}>
                      <BHead icon={ShieldAlert} color={'#e5484d'} bg={'rgba(229,72,77,.06)'} title="Risk Radarı"/>
                      <div style={{padding:'12px 16px'}}>
                        <div onClick={()=>setYonDetail({type:'critical',name:'Kritik Stok Detayı (365+ Gün)',badge:critProds.length+' ürün',badgeC:'#e5484d',badgeBg:'rgba(229,72,77,.08)'})} style={{padding:'10px 12px',borderRadius:$.rM,background:'rgba(229,72,77,.05)',marginBottom:8,cursor:'pointer',border:'1px solid rgba(229,72,77,.12)'}} className="rh">
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:700,color:'#e5484d'}}>365+ Gün</span>
                            <ChevronRight size={13} color={$.t2}/>
                          </div>
                          <div style={{fontFamily:$.mo,fontSize:16,fontWeight:800,color:'#e5484d',marginBottom:2}}>{fmtTon(critQty)}</div>
                          <div style={{fontFamily:$.mo,fontSize:11,color:$.t2}}>${fmt(critVal)} · %{critPct.toFixed(1)}</div>
                        </div>
                        <div style={{padding:'10px 12px',borderRadius:$.rM,background:'rgba(234,88,12,.04)',marginBottom:8,border:'1px solid rgba(234,88,12,.1)'}}>
                          <div style={{fontSize:12,fontWeight:700,color:'#ea580c',marginBottom:2}}>180+ Gün</div>
                          <div style={{fontFamily:$.mo,fontSize:14,fontWeight:800,color:'#ea580c'}}>{fmtTon(c180Qty)}</div>
                          <div style={{fontFamily:$.mo,fontSize:11,color:$.t2}}>%{c180Pct.toFixed(1)} oran</div>
                        </div>
                        <div style={{marginTop:8}}>
                          <div style={{fontSize:11,fontWeight:700,color:$.t2,marginBottom:6}}>Tesis Tipi Dağılımı</div>
                          {typeStats.map(t=>(
                            <div key={t.k} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                              <div style={{width:7,height:7,borderRadius:3,background:t.c,flexShrink:0}}/>
                              <span style={{fontSize:11,color:$.t2,flex:1}}>{t.l}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:t.c}}>{t.count}</span>
                            </div>))}
                        </div>
                      </div>
                    </BCard>

                    {/* ROW 3: Heatmap (span 4) */}
                    <BCard span={mob?1:4}>
                      <BHead icon={Layers} color={$.org} bg={$.orgB} title="Şirket × Yaş Grubu Isı Haritası"/>
                      <div style={{padding:'12px 16px',overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,fontSize:10.5}}>
                          <thead><tr>
                            <th style={{textAlign:'left',padding:'6px 8px',fontWeight:700,color:$.t2,borderBottom:'1px solid '+$.bdL,position:'sticky',left:0,background:$.bg2,minWidth:100}}>Şirket</th>
                            {BK.map(b=><th key={b.k} style={{textAlign:'center',padding:'6px 4px',fontWeight:700,color:b.c,borderBottom:'1px solid '+$.bdL,minWidth:55}}>{b.k}</th>)}
                            <th style={{textAlign:'right',padding:'6px 8px',fontWeight:700,color:$.t1,borderBottom:'1px solid '+$.bdL}}>Toplam</th>
                          </tr></thead>
                          <tbody>
                            {heatData.map((h,i)=>{const mx=Math.max(...Object.values(h.ag));return(
                              <tr key={h.n} onClick={()=>setYonDetail({type:'company',name:h.n,data:comps.find(c=>c.n===h.n),badge:fmtTon(h.total),badgeC:$.blu,badgeBg:$.bluB})} style={{cursor:'pointer'}} className="rh">
                                <td style={{padding:'7px 8px',fontWeight:600,color:$.t1,borderBottom:i<heatData.length-1?'1px solid '+$.bdL:'none',position:'sticky',left:0,background:$.bg2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:130}}>{h.n}</td>
                                {BK.map(b=>{const v=h.ag[b.k]||0;const intensity=mx>0?v/mx:0;return(
                                  <td key={b.k} style={{textAlign:'center',padding:'7px 4px',borderBottom:i<heatData.length-1?'1px solid '+$.bdL:'none'}}>
                                    <div style={{display:'inline-block',padding:'3px 6px',borderRadius:5,fontFamily:$.mo,fontWeight:700,fontSize:10.5,background:v>0?b.c+'18':'transparent',color:v>0?b.c:$.t2,opacity:v>0?(.4+intensity*.6):0.35}}>{v>0?fmtTon(v):'-'}</div>
                                  </td>);})}
                                <td style={{textAlign:'right',padding:'7px 8px',fontFamily:$.mo,fontWeight:800,color:$.t1,borderBottom:i<heatData.length-1?'1px solid '+$.bdL:'none',fontSize:12}}>{fmtTon(h.total)}<ChevronRight size={11} color={$.t2} style={{marginLeft:4,verticalAlign:'middle'}}/></td>
                              </tr>);})}
                          </tbody>
                        </table>
                      </div>
                    </BCard>

                    {/* ROW 4: Tesis Performance (span 2) + L2 Portfolio (span 2) */}
                    <BCard span={mob?1:2}>
                      <BHead icon={Building2} color={$.pur} bg={$.purB} title="Tesis Performansı (Değer)"/>
                      <div style={{padding:'12px 16px'}}>
                        {facPerf.map((f,i)=>(
                          <div key={f.id} onClick={()=>setYonDetail({type:'facility',name:f.n||f.id,data:f,badge:TI[f.type]?.label,badgeC:TI[f.type]?.color,badgeBg:TI[f.type]?.color+'14'})} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:i<facPerf.length-1?'1px solid '+$.bdL:'none',cursor:'pointer'}} className="rh">
                            <div style={{width:7,height:7,borderRadius:3,background:TI[f.type]?.color||$.t3,flexShrink:0}}/>
                            <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.n||f.id}</span>
                            <div style={{flex:1.5,height:6,borderRadius:3,background:$.bdL,overflow:'hidden'}}>
                              <div style={{height:'100%',width:(f.v/maxFV)*100+'%',borderRadius:3,background:TI[f.type]?.color||$.ac,opacity:.5,transition:'width .5s'}}/>
                            </div>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f',minWidth:60,textAlign:'right'}}>${fmt(f.v)}</span>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a)}}>{f.a}g</span>
                            <ChevronRight size={13} color={$.t2}/>
                          </div>))}
                      </div>
                    </BCard>

                    <BCard span={mob?1:2}>
                      <BHead icon={Layers} color={$.org} bg={$.orgB} title="Ürün Portföyü (L2)"/>
                      <div style={{padding:'12px 16px'}}>
                        {l2s.map((l,i)=>(
                          <div key={l.n} onClick={()=>setYonDetail({type:'l2',name:l.n+' Kategorisi',data:l,badge:'$'+fmt(l.v),badgeC:'#0d6e4f',badgeBg:$.grnB})} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:i<l2s.length-1?'1px solid '+$.bdL:'none',cursor:'pointer'}} className="rh">
                            <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.n}</span>
                            <div style={{flex:1,height:6,borderRadius:3,background:$.bdL,overflow:'hidden'}}>
                              <div style={{height:'100%',width:(l.v/maxL2V)*100+'%',borderRadius:3,background:$.org,opacity:.45,transition:'width .5s'}}/>
                            </div>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f',minWidth:55,textAlign:'right'}}>${fmt(l.v)}</span>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2,minWidth:45,textAlign:'right'}}>{fmtTon(l.q)}</span>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(l.a),padding:'2px 7px',borderRadius:4,background:acBg(l.a)}}>{l.a}g</span>
                            <ChevronRight size={13} color={$.t2}/>
                          </div>))}
                      </div>
                    </BCard>

                  </div>
                </div>
              );})()}

            {/* ===== EMERGING MARKETS (Harita sayfası kaldırıldı — dashboard'a taşındı) ===== */}
            {false&&pg==='em'&&(
              <div style={{display:'flex',gap:16,flexDirection:mob?'column':'row',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0}}>
                  {/* KPI Cards */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'repeat(2,1fr)':'repeat(6,1fr)',gap:10,marginBottom:16}}>
                    {[
                      {l:'Toplam Stok',v:fmtTon(DW.s.totalQty),sub:'Küresel stok',c:$.blu,bg:$.bluB,icon:Package},
                      {l:'Stok Değeri',v:'$'+fmt(DW.s.totalVal),sub:'Toplam değer',c:'#0d6e4f',bg:$.grnB,icon:TrendingUp},
                      {l:'Ülke / Tesis',v:DW.s.countryCount+' / '+DW.s.facilityCount,sub:'Aktif lokasyon',c:$.pur,bg:$.purB,icon:Globe},
                      {l:'Depo',v:DW.s.whCount,sub:'Toplam depo',c:$.org,bg:$.orgB,icon:Building2},
                      {l:'Ort. Yaşlanma',v:DW.s.avgAge+' gün',sub:'FIFO bazlı',c:ac(DW.s.avgAge),bg:acBg(DW.s.avgAge),icon:Clock},
                      {l:'Ürün Çeşidi',v:DW.s.prodCount,sub:'Aktif ürün',c:$.tel,bg:$.telB,icon:Layers}
                    ].map((k,i)=>(
                      <div key={i} style={{background:$.bg2,borderRadius:$.rL,padding:'14px 16px',border:'1px solid '+$.bdL,boxShadow:$.sh,position:'relative',overflow:'hidden'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                          <div style={{width:26,height:26,borderRadius:7,background:k.bg,display:'flex',alignItems:'center',justifyContent:'center'}}><k.icon size={13} color={k.c}/></div>
                          <span style={{fontSize:11,fontWeight:600,color:$.t2}}>{k.l}</span>
                        </div>
                        <div style={{fontSize:20,fontWeight:700,fontFamily:$.mo,color:k.c,letterSpacing:'-0.02em'}}>{k.v}</div>
                        <div style={{fontSize:12,color:$.t2,marginTop:2}}>{k.sub}</div>
                      </div>))}
                  </div>

                  {/* World Map */}
                  <div style={{background:$.bg2,borderRadius:$.rL,border:'1px solid '+$.bdL,boxShadow:$.sh,overflow:'hidden',marginBottom:16}}>
                    <Suspense fallback={<div style={{height:450,display:'flex',alignItems:'center',justifyContent:'center',color:$.t3}}>Dünya haritası yükleniyor...</div>}>
                      <WorldMap3D
                        countries={DW.countries}
                        maxQty={mQW}
                        sel={emSel}
                        hov={emHov}
                        onSelect={(name)=>{setEmSel(name===null?null:(emSel===name?null:name));setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setEmTab('f');}}
                        onHover={n=>setEmHov(n)}
                        onHoverEnd={()=>setEmHov(null)}
                        acFn={ac} fmt={fmt} fmtTon={fmtTon} fN={fN}
                        onGlobalClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setEmTab('f');}}
                        globalActive={emSel==='__global__'}
                      />
                    </Suspense>
                  </div>

                  {/* Aging + Type Distribution */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:16}}>
                    <div style={{background:$.bg2,borderRadius:$.rL,border:'1px solid '+$.bdL,boxShadow:$.sh,overflow:'hidden'}}>
                      <div style={{padding:'12px 16px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><BarChart3 size={14}/></div>
                        {'Yaşlanma Dağılımı'}
                      </div>
                      <div style={{padding:'16px 18px'}}>
                        <SegBar ag={DW.ag} total={DW.s.totalQty} h={14} rd={7}/>
                        <div style={{display:'flex',justifyContent:'space-between',marginTop:10}}>
                          {BK.map(b=>{const v=DW.ag[b.k]||0;const pct=DW.s.totalQty>0?((v/DW.s.totalQty)*100):0;return pct>0?(
                            <div key={b.k} style={{textAlign:'center'}}>
                              <div style={{fontSize:11,fontFamily:$.mo,fontWeight:700,color:b.c}}>{pct.toFixed(1)}%</div>
                              <div style={{fontSize:10,color:$.t2,marginTop:1}}>{b.k}</div>
                            </div>):null;})}
                        </div>
                      </div>
                    </div>
                    <div style={{background:$.bg2,borderRadius:$.rL,border:'1px solid '+$.bdL,boxShadow:$.sh,overflow:'hidden'}}>
                      <div style={{padding:'12px 16px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.purB,color:$.pur,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Layers size={14}/></div>
                        {'Tesis Tipi Dağılımı'}
                      </div>
                      <div style={{padding:'16px 18px'}}>
                        {(()=>{const tq=DW.s.totalQty||1;const types=Object.entries(TI).map(([k,v])=>({k,c:v.color,l:v.label,q:DW.f.filter(f=>f.type===k).reduce((s,f)=>s+f.q,0)})).filter(t=>t.q>0);const mx=Math.max(...types.map(t=>t.q),1);return(
                          <div style={{display:'flex',flexDirection:'column',gap:10}}>
                            {types.map(t=>{const pct=((t.q/tq)*100).toFixed(1);return(
                              <div key={t.k}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                                    <div style={{width:10,height:10,borderRadius:3,background:t.c}}/>
                                    <span style={{fontSize:12,color:$.t2,fontWeight:600}}>{t.l}</span>
                                  </div>
                                  <span style={{fontSize:12,fontFamily:$.mo,fontWeight:700,color:t.c}}>{pct}%</span>
                                </div>
                                <div style={{height:10,borderRadius:5,background:$.bdL,overflow:'hidden'}}>
                                  <div style={{height:'100%',width:(t.q/mx)*100+'%',borderRadius:5,background:t.c,opacity:.65,transition:'width .5s ease'}}/>
                                </div>
                              </div>);})}
                          </div>)})()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EM Right Panel → scroll dışında, aşağıda render edilir */}
                {false&&(
                  <div>
                    <div style={{padding:'16px 20px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:17,color:$.t1,lineHeight:1.2}}>{emSel}</div>
                        <div style={{fontSize:13,color:$.t2,fontWeight:500,marginTop:2}}>{emSD.facs.length} tesis · {emSD.tWh} depo</div>
                      </div>
                      <div onClick={()=>{setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh"><X size={15} color={$.t2}/></div>
                    </div>

                    <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
                      {/* Drill-down: Products level */}
                      {emProdData?(
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:16,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.85)',boxShadow:'0 2px 16px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)',borderRadius:12,overflow:'hidden'}}>
                            <div onClick={()=>setEmDrillL2(null)} className="rh" style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',cursor:'pointer',borderRight:'1px solid rgba(0,0,0,0.06)',flexShrink:0,transition:'background .15s'}}>
                              <ChevronLeft size={14} color={$.blu}/><span style={{fontSize:12,fontWeight:700,color:$.blu}}>Geri</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',fontSize:12,color:$.t2,fontWeight:500,overflow:'hidden'}}>
                              <span className="rh" style={{cursor:'pointer',color:$.blu}} onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}>{emSel}</span>
                              <ChevronRight size={10}/>
                              <span className="rh" style={{cursor:'pointer',color:$.blu}} onClick={()=>setEmDrillL2(null)}>{DW.f.find(f=>f.id===(emDrillFac||emDrillWh))?.n||emDrillFac}</span>
                              <ChevronRight size={10}/>
                              <span style={{cursor:'pointer',color:$.blu}} onClick={()=>setEmDrillL2(null)}>{emDrillL2}</span>
                              <ChevronRight size={10}/>
                              <span style={{color:$.t1,fontWeight:600}}>Ürünler</span>
                            </div>
                          </div>
                          <div style={{fontSize:12,color:$.t2,fontWeight:600,marginBottom:8}}>{emProdData.length} ürün</div>
                          {emProdData.map((p,i)=>(
                            <div key={p.n} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}}>
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(p.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(p.v)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(p.a),padding:'2px 7px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>
                            </div>))}
                        </div>
                      ):emL2Data?(
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:16,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.85)',boxShadow:'0 2px 16px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)',borderRadius:12,overflow:'hidden'}}>
                            <div onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);}} className="rh" style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',cursor:'pointer',borderRight:'1px solid rgba(0,0,0,0.06)',flexShrink:0,transition:'background .15s'}}>
                              <ChevronLeft size={14} color={$.blu}/><span style={{fontSize:12,fontWeight:700,color:$.blu}}>Geri</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',fontSize:12,color:$.t2,fontWeight:500}}>
                              <span className="rh" style={{cursor:'pointer',color:$.blu}} onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);}}>{emSel}</span>
                              <ChevronRight size={10}/>
                              <span style={{color:$.t1,fontWeight:600}}>{DW.f.find(f=>f.id===(emDrillFac||emDrillWh))?.n||emDrillFac}</span>
                              <ChevronRight size={10}/>
                              <span style={{color:$.t1,fontWeight:600}}>Seviye 2</span>
                            </div>
                          </div>
                          <div style={{fontSize:12,color:$.t2,fontWeight:600,marginBottom:8}}>{emL2Data.length} kategori</div>
                          {emL2Data.map((l,i)=>(
                            <div key={l.n} onClick={()=>setEmDrillL2(l.n)} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}} className="rh">
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(l.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(l.v)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(l.a),padding:'2px 7px',borderRadius:4,background:acBg(l.a)}}>{l.a}g</span>
                              <ChevronRight size={13} color={$.t2}/>
                            </div>))}
                        </div>
                      ):(
                        <div>
                          {/* Mini KPIs */}
                          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                            {[{l:'Stok',v:fmtTon(emSD.tQ),c:$.blu},{l:'Değer',v:'$'+fmt(emSD.tV),c:'#0d6e4f'},{l:'Depo',v:emSD.tWh,c:$.pur},{l:'Ürün',v:emSD.tPc,c:$.org}].map((k,i)=>(
                              <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                                <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                                <div style={{fontSize:16,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                              </div>))}
                          </div>
                          {/* Aging bar */}
                          <div style={{marginBottom:14}}>
                            <SegBar ag={emSD.countryAg} total={emSD.tQ} h={10} rd={5}/>
                            <div style={{textAlign:'center',marginTop:4,fontSize:11,fontFamily:$.mo,fontWeight:700,color:ac(emSD.avgA)}}>{emSD.avgA} gün ort.</div>
                          </div>
                          {/* Tabs */}
                          <div style={{display:'flex',gap:4,marginBottom:12,background:$.bg,borderRadius:8,padding:3}}>
                            {[{id:'f',l:'Tesisler'},{id:'w',l:'Depolar'}].map(t=>(
                              <div key={t.id} onClick={()=>setEmTab(t.id)} style={{flex:1,textAlign:'center',padding:'7px 0',borderRadius:6,fontSize:12,fontWeight:emTab===t.id?700:500,cursor:'pointer',background:emTab===t.id?'#fff':'transparent',color:emTab===t.id?$.t1:$.t2,boxShadow:emTab===t.id?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .2s'}}>{t.l}</div>
                            ))}
                          </div>
                          {/* Facility list */}
                          {emTab==='f'&&emSD.facs.sort((a,b)=>b.q-a.q).map((f,i)=>(
                            <div key={f.id} onClick={()=>{setEmDrillFac(f.id);setEmDrillWh(null);setEmDrillL2(null);}} style={{padding:'9px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'flex-start',gap:8,border:'1px solid '+$.bdL,borderLeft:'3px solid '+(TI[f.type]?.color||$.t3)}} className="rh">
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,wordBreak:'break-word',lineHeight:1.4}}>{f.n||f.id}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2,whiteSpace:'nowrap',flexShrink:0}}>{fmtTon(f.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f',whiteSpace:'nowrap',flexShrink:0}}>${fmt(f.v)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a),whiteSpace:'nowrap',flexShrink:0}}>{f.a}g</span>
                              <ChevronRight size={13} color={$.t2} style={{flexShrink:0,marginTop:2}}/>
                            </div>))}
                          {/* Warehouse list */}
                          {emTab==='w'&&emSD.whs.sort((a,b)=>b.q-a.q).map((w,i)=>(
                            <div key={w.id} onClick={()=>{setEmDrillWh(w.id);setEmDrillFac(null);setEmDrillL2(null);}} style={{padding:'9px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'flex-start',gap:8,border:'1px solid '+$.bdL}} className="rh">
                              <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,wordBreak:'break-word',lineHeight:1.4}}>{w.n||w.id}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2,whiteSpace:'nowrap',flexShrink:0}}>{fmtTon(w.q)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(w.a),padding:'2px 7px',borderRadius:4,background:acBg(w.a),whiteSpace:'nowrap',flexShrink:0}}>{w.a}g</span>
                              <ChevronRight size={13} color={$.t2} style={{flexShrink:0,marginTop:2}}/>
                            </div>))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== RAW DATA ===== */}
            {pg==='raw'&&(
              <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,overflow:'hidden',boxShadow:$.sh}}>
                <div style={{padding:'12px 16px',borderBottom:showRawFilter?'none':'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
                    <Database size={16} color={$.blu}/>
                    <span style={{fontSize:13,fontWeight:700,color:$.t1}}>Rapor Satırları</span>
                    {rows.length>0&&<span style={{fontSize:11,color:$.t3,fontWeight:500}}>{filtered.length}/{rawRows.length} kayıt</span>}
                    {activeFilterCount>0&&<span style={{fontSize:10,fontWeight:700,color:'#fff',background:$.ac,padding:'1px 7px',borderRadius:10}}>{activeFilterCount} filtre</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{position:'relative'}}>
                      <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:$.t3}}/>
                      <input className="fi" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara..." style={{paddingLeft:28,width:160}}/>
                    </div>
                    <button className="tb-b" onClick={()=>setShowRawFilter(v=>!v)} style={{gap:5,background:showRawFilter||activeFilterCount>0?$.acL:'',borderColor:showRawFilter||activeFilterCount>0?$.ac:'',color:showRawFilter||activeFilterCount>0?$.ac:''}}>
                      <SlidersHorizontal size={13}/>Filtrele{activeFilterCount>0?` (${activeFilterCount})`:''}
                    </button>
                    <button className="tb-b" onClick={()=>fR.current?.click()} style={{gap:6}}><Upload size={13}/>İçeri Aktar</button>
                    {rows.length>0&&<button className="tb-b" onClick={()=>{
                      const doIt=()=>{const ws=window.XLSX.utils.aoa_to_sheet([HDR,...rows]);const wb=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(wb,ws,'Rapor');window.XLSX.writeFile(wb,'TYRO_RaporSatirlari_'+new Date().toISOString().slice(0,10)+'.xlsx');};
                      if(window.XLSX)doIt();else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);}
                    }} style={{gap:6}}><Download size={13}/>Dışarı Aktar</button>}
                    {selRows.size>0&&<button className="tb-b" onClick={handleDelete} style={{color:$.red,borderColor:$.red,gap:6}}><Trash2 size={13}/>Sil ({selRows.size})</button>}
                  </div>
                </div>
                {/* Advanced Filter Panel */}
                {showRawFilter&&(
                  <div style={{padding:'14px 16px',borderBottom:'1px solid '+$.bdL,background:'rgba(248,250,252,0.8)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:12,fontWeight:700,color:$.t1,display:'flex',alignItems:'center',gap:6}}><SlidersHorizontal size={13} color={$.ac}/>Gelişmiş Filtre</span>
                      {activeFilterCount>0&&<button className="tb-b" onClick={()=>setRawFilter(RAWF_INIT)} style={{gap:5,fontSize:11,padding:'4px 10px',color:$.red,borderColor:$.red}}><RotateCcw size={11}/>Sıfırla</button>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px 12px'}}>
                      {/* Ana Trader */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Ana Trader</div>
                        <select className="fi" value={rawFilter.mtrader} onChange={e=>setRawFilter(p=>({...p,mtrader:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.mtraders.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      {/* Trader */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Trader</div>
                        <select className="fi" value={rawFilter.trader} onChange={e=>setRawFilter(p=>({...p,trader:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.traders.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {/* Şirket Grubu */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Şirket Grubu</div>
                        <select className="fi" value={rawFilter.grp} onChange={e=>setRawFilter(p=>({...p,grp:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.grps.map(g=><option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      {/* Şirket */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Şirket</div>
                        <select className="fi" value={rawFilter.comp} onChange={e=>setRawFilter(p=>({...p,comp:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.comps.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {/* Madde Kodu */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Madde Kodu</div>
                        <input className="fi" value={rawFilter.madde} onChange={e=>setRawFilter(p=>({...p,madde:e.target.value}))} placeholder="Kod içerir..." style={{width:'100%',fontSize:11,boxSizing:'border-box'}}/>
                      </div>
                      {/* Ürün Adı */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Ürün Adı</div>
                        <input className="fi" value={rawFilter.urun} onChange={e=>setRawFilter(p=>({...p,urun:e.target.value}))} placeholder="Ürün içerir..." style={{width:'100%',fontSize:11,boxSizing:'border-box'}}/>
                      </div>
                      {/* Menşe */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Menşe</div>
                        <select className="fi" value={rawFilter.mense} onChange={e=>setRawFilter(p=>({...p,mense:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.menses.map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      {/* Tesis */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Tesis</div>
                        <select className="fi" value={rawFilter.tesis} onChange={e=>setRawFilter(p=>({...p,tesis:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.tesisler.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {/* L2 Adı */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Seviye 2</div>
                        <select className="fi" value={rawFilter.l2} onChange={e=>setRawFilter(p=>({...p,l2:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.l2s.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      {/* L3 Adı */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Seviye 3</div>
                        <select className="fi" value={rawFilter.l3} onChange={e=>setRawFilter(p=>({...p,l3:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          {rawFilterOpts.l3s.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      {/* Miktar Aralığı */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Miktar (min – maks)</div>
                        <div style={{display:'flex',gap:6}}>
                          <input className="fi" type="number" value={rawFilter.miktarMin} onChange={e=>setRawFilter(p=>({...p,miktarMin:e.target.value}))} placeholder="Min" style={{width:'50%',fontSize:11}}/>
                          <input className="fi" type="number" value={rawFilter.miktarMax} onChange={e=>setRawFilter(p=>({...p,miktarMax:e.target.value}))} placeholder="Maks" style={{width:'50%',fontSize:11}}/>
                        </div>
                      </div>
                      {/* Gün Aralığı */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Yaş / Gün (min – maks)</div>
                        <div style={{display:'flex',gap:6}}>
                          <input className="fi" type="number" value={rawFilter.gunMin} onChange={e=>setRawFilter(p=>({...p,gunMin:e.target.value}))} placeholder="Min" style={{width:'50%',fontSize:11}}/>
                          <input className="fi" type="number" value={rawFilter.gunMax} onChange={e=>setRawFilter(p=>({...p,gunMax:e.target.value}))} placeholder="Maks" style={{width:'50%',fontSize:11}}/>
                        </div>
                      </div>
                      {/* Risk Kategorisi */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>Risk Kategorisi</div>
                        <select className="fi" value={rawFilter.risk} onChange={e=>setRawFilter(p=>({...p,risk:e.target.value}))} style={{width:'100%',fontSize:11}}>
                          <option value="">Tümü</option>
                          <option value="fresh">Taze (0–60 gün)</option>
                          <option value="normal">Normal (60–180 gün)</option>
                          <option value="risky">Riskli (180–365 gün)</option>
                          <option value="critical">Kritik (365+ gün)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {addMode&&newRow&&(
                  <div style={{padding:'10px 18px',background:$.acL,borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    {HDR.slice(0,9).map((h,ci)=><input key={ci} className="fi" placeholder={h} value={newRow[ci]} onChange={e=>{const nr=[...newRow];nr[ci]=NC.has(ci)?Number(e.target.value)||0:e.target.value;setNewRow(nr);}} style={{width:ci===3?120:80,fontSize:10}}/>)}
                    <button className="tb-b pr" onClick={()=>{setRows(p=>[...p,newRow]);setAddMode(false);}}><CheckCircle2 size={12}/>Kaydet</button>
                    <button className="tb-b" onClick={()=>setAddMode(false)}><X size={12}/></button>
                  </div>)}
                {editIdx!==null&&editRow&&(
                  <div style={{padding:'10px 18px',background:$.bluB,borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    {HDR.slice(0,9).map((h,ci)=><input key={ci} className="fi" placeholder={h} value={editRow[ci]} onChange={e=>{const nr=[...editRow];nr[ci]=NC.has(ci)?Number(e.target.value)||0:e.target.value;setEditRow(nr);}} style={{width:ci===3?120:80,fontSize:10}}/>)}
                    <button className="tb-b pr" onClick={()=>{setRows(p=>p.map((r,i)=>i===editIdx?editRow:r));setEditIdx(null);}}><CheckCircle2 size={12}/>Kaydet</button>
                    <button className="tb-b" onClick={()=>setEditIdx(null)}><X size={12}/></button>
                  </div>)}
                <div style={{overflowX:'auto',maxHeight:'calc(100vh - 220px)'}}>
                  <table style={{width:'max-content',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr style={{position:'sticky',top:0,zIndex:2,background:$.bg}}>
                      <th style={{padding:'9px 10px',borderBottom:'2px solid '+$.bd,background:$.bg,width:40}}><input type="checkbox" checked={selRows.size===filtered.length&&filtered.length>0} onChange={e=>{if(e.target.checked){const a=new Set();filtered.forEach(r=>{const i=rows.indexOf(r);if(i>=0)a.add(i);});setSelRows(a);}else setSelRows(new Set());}}/></th>
                      {HDR.map((h,ci)=>{
                        const th=<th key={`h${ci}`} onClick={()=>{if(rC===ci)setRD(d=>d*-1);else{setRC(ci);setRD(-1);}}} style={{padding:'9px 10px',textAlign:NC.has(ci)?'right':'left',color:$.t3,fontWeight:700,fontSize:9,textTransform:'uppercase',borderBottom:'2px solid '+$.bd,cursor:'pointer',whiteSpace:'nowrap',background:$.bg,minWidth:ci===1||ci===3||ci===10||ci===12?130:60,letterSpacing:.5}}>{h}{rC===ci?<ArrowUpDown size={8} style={{marginLeft:2,verticalAlign:'middle'}} color={$.blu}/>:null}</th>;
                        if(ci===25)return[th,
                          <th key="htl" style={{padding:'9px 10px',textAlign:'right',color:$.t3,fontWeight:700,fontSize:9,textTransform:'uppercase',borderBottom:'2px solid '+$.bd,whiteSpace:'nowrap',background:$.bg,minWidth:80,letterSpacing:.5}}>Toplam Fiyat (Yerel)</th>,
                          <th key="husd" style={{padding:'9px 10px',textAlign:'right',color:$.t3,fontWeight:700,fontSize:9,textTransform:'uppercase',borderBottom:'2px solid '+$.bd,whiteSpace:'nowrap',background:$.bg,minWidth:80,letterSpacing:.5}}>Toplam Fiyat (Raporlama)</th>];
                        return th;
                      })}
                      <th style={{padding:'9px 6px',borderBottom:'2px solid '+$.bd,background:$.bg,width:36}}/>
                    </tr></thead>
                    <tbody>{sorted.slice(rawPage*pageSize,(rawPage+1)*pageSize).map((r,i)=>{const oi=rows.indexOf(r);return(
                      <tr key={i} className="rh" style={{borderBottom:'1px solid '+$.bdL,background:selRows.has(oi)?$.acL:i%2?'#fafbfc':'#fff'}}>
                        <td style={{padding:'7px 10px'}}><input type="checkbox" checked={selRows.has(oi)} onChange={e=>{const n=new Set(selRows);e.target.checked?n.add(oi):n.delete(oi);setSelRows(n);}}/></td>
                        {r.map((v,ci)=>{
                          const td=<td key={`c${ci}`} style={{padding:'7px 10px',textAlign:NC.has(ci)?'right':'left',fontFamily:NC.has(ci)?$.mo:'inherit',fontSize:10.5,whiteSpace:'nowrap',maxWidth:ci===1||ci===3||ci===10||ci===12?150:200,overflow:'hidden',textOverflow:'ellipsis',color:ci===8?$.t1:$.t2,fontWeight:ci===8?600:400}}>
                            {ci===27?<span style={{padding:'2px 7px',borderRadius:5,background:acBg(v),color:ac(v),fontWeight:600,fontFamily:$.mo}}>{v}</span>:ci===24?('₺'+v):ci===25?('$'+v):typeof v==='number'?fN(v):v}
                          </td>;
                          if(ci===25)return[td,
                            <td key="ctl" style={{padding:'7px 10px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,whiteSpace:'nowrap',color:$.t1,fontWeight:600}}>{'₺'+fN(r[8]*r[24])}</td>,
                            <td key="cusd" style={{padding:'7px 10px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,whiteSpace:'nowrap',color:'#0d6e4f',fontWeight:600}}>{'$'+fN(r[8]*r[25])}</td>];
                          return td;
                        })}
                        <td style={{padding:'7px 6px'}}><Pencil size={12} color={$.t3} style={{cursor:'pointer'}} onClick={()=>{setEditIdx(oi);setEditRow([...r]);}}/></td>
                      </tr>);})}</tbody>
                    <tfoot><tr style={{position:'sticky',bottom:0,zIndex:2,background:'rgba(240,247,243,.97)',borderTop:'2px solid rgba(13,110,79,.2)'}}>
                      <td style={{padding:'8px 10px'}}/>
                      {HDR.map((_,ci)=>{
                        const td=<td key={`f${ci}`} style={{padding:'8px 10px',textAlign:NC.has(ci)?'right':'left',fontFamily:$.mo,fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>
                          {ci===8?<span style={{color:'#0d6e4f'}}>{fN(filtered.reduce((s,r)=>s+r[8],0))}</span>:ci===0?<span style={{fontSize:10,fontWeight:700,color:'#0d6e4f',letterSpacing:.3}}>TOPLAM</span>:''}
                        </td>;
                        if(ci===25)return[td,
                          <td key="ftl" style={{padding:'8px 10px',textAlign:'right',fontFamily:$.mo,fontSize:11,fontWeight:800,whiteSpace:'nowrap',color:$.t1}}>{'₺'+fN(filtered.reduce((s,r)=>s+r[8]*r[24],0))}</td>,
                          <td key="fusd" style={{padding:'8px 10px',textAlign:'right',fontFamily:$.mo,fontSize:11,fontWeight:800,whiteSpace:'nowrap',color:'#0d6e4f'}}>{'$'+fN(filtered.reduce((s,r)=>s+r[8]*r[25],0))}</td>];
                        return td;
                      })}
                      <td style={{padding:'8px 6px'}}/>
                    </tr></tfoot>
                  </table>
                </div>
                {(()=>{const total=sorted.length;const tp=Math.ceil(total/pageSize);if(tp<=1)return null;return(
                  <div style={{padding:'10px 18px',borderTop:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                    <div style={{fontSize:11,color:$.t3,fontWeight:500}}>{rawPage*pageSize+1}–{Math.min((rawPage+1)*pageSize,total)} / {total} kayıt</div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <button className="tb-b" onClick={()=>setRawPage(p=>Math.max(0,p-1))} disabled={rawPage===0} style={{padding:'5px 12px',fontSize:11,opacity:rawPage===0?.4:1}}><ChevronLeft size={13}/>Önceki</button>
                      <span style={{fontSize:11,fontFamily:$.mo,fontWeight:700,color:$.t1,padding:'0 8px'}}>{rawPage+1} / {tp}</span>
                      <button className="tb-b" onClick={()=>setRawPage(p=>Math.min(tp-1,p+1))} disabled={rawPage>=tp-1} style={{padding:'5px 12px',fontSize:11,opacity:rawPage>=tp-1?.4:1}}>Sonraki<ChevronRight size={13}/></button>
                    </div>
                  </div>
                );})()}
              </div>
            )}

            {/* ===== RAPORLAR ===== */}
            {pg==='rep'&&(()=>{
              const tabs=[{id:'grp',l:'Grup',idx:-1,lbl:-1},{id:'mtra',l:'Ana Trader',idx:35,lbl:35},{id:'tra',l:'Trader',idx:34,lbl:34},{id:'comp',l:'Şirket',idx:0,lbl:1},{id:'fac',l:'Tesis',idx:9,lbl:10},{id:'l2',l:'Seviye 2',idx:16,lbl:17},{id:'l3',l:'Seviye 3',idx:18,lbl:19},{id:'origin',l:'Menşe',idx:4,lbl:4},{id:'prod',l:'Ürünler',idx:3,lbl:3}];
              const cur=tabs.find(t=>t.id===repTab)||tabs[0];
              const pivotForTab=()=>{
                if(cur.id==='grp')return buildGroupPivot(gRows,r=>gGrp(r[0]));
                if(cur.id==='tra'||cur.id==='mtra'){
                  const codeIdx=cur.id==='tra'?34:35;
                  const nameIdx=cur.id==='tra'?36:37;
                  // Display = isim varsa isim, yoksa kod, hiçbiri yoksa "Atanmamış"
                  const codeByDisplay={};
                  gRows.forEach(r=>{
                    const code=String(r[codeIdx]||'').trim();
                    const name=String(r[nameIdx]||'').trim();
                    const display=name||code||'(Atanmamış)';
                    if(!(display in codeByDisplay))codeByDisplay[display]={code,name};
                  });
                  const pivot=buildGroupPivot(gRows,r=>{
                    const code=String(r[codeIdx]||'').trim();
                    const name=String(r[nameIdx]||'').trim();
                    return name||code||'(Atanmamış)';
                  });
                  return pivot.map(row=>({...row,code:codeByDisplay[row.n]?.code||'',name:codeByDisplay[row.n]?.name||''}));
                }
                return buildPivot(gRows,cur.idx,cur.lbl);
              };
              const pv=pivotForTab().sort((a,b)=>{
                let va,vb;
                if(repSC==='n'){va=a.n;vb=b.n;return va.localeCompare(vb)*repSD;}
                else if(repSC==='total'){va=a.total;vb=b.total;}
                else if(repSC==='totalVal'){va=a.totalVal;vb=b.totalVal;}
                else if(repSC==='avg'){va=a.avg;vb=b.avg;}
                else{va=a.ag[repSC]||0;vb=b.ag[repSC]||0;}
                return(va-vb)*repSD;
              });
              const mxT=Math.max(...pv.map(r=>r.total),1);
              const gt=pv.reduce((s,r)=>s+r.total,0);
              const gtVal=pv.reduce((s,r)=>s+r.totalVal,0);
              return(
                <div>
                  {/* Tab selector — macOS segmented control */}
                  <div style={{display:'flex',gap:12,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{display:'inline-flex',background:'#f0f1f3',borderRadius:10,padding:3,gap:2}}>
                      {tabs.map(t=>(
                        <div key={t.id} onClick={()=>{setRepTab(t.id);setRepSearch('');setRepSC('total');setRepSD(-1);}} style={{padding:'7px 16px',borderRadius:8,fontSize:11.5,fontWeight:repTab===t.id?700:500,cursor:'pointer',background:repTab===t.id?'#fff':'transparent',color:repTab===t.id?$.t1:$.t3,boxShadow:repTab===t.id?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .2s',userSelect:'none'}}>{t.l}</div>
                      ))}
                    </div>
                  </div>

                  {/* Pivot Table + Chart Card */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,overflow:'hidden'}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><FileBarChart size={14}/></div>
                      <span style={{fontSize:13,fontWeight:700}}>{cur.l} Bazlı Yaşlandırma Raporu</span>
                      <span style={{fontSize:11,color:$.t3,fontFamily:$.mo}}>{pv.length} kayıt</span>
                      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                        <button className="tb-b" onClick={()=>{
                          // Düzgün XLSX export — bold header, sayısal format, freeze, alt toplam
                          const doIt=()=>{
                            const X=window.XLSX;
                            const headers=[cur.l,'Toplam Miktar (kg)','Toplam Değer ($)','Ort.Yaş (gün)',...BK.map(b=>b.k+' gün'),'% Pay'];
                            const rowsX=pv.map(r=>[r.n,Math.round(r.total),Math.round(r.totalVal),r.avg,...BK.map(b=>Math.round(r.ag[b.k]||0)),gt>0?+(r.total/gt*100).toFixed(2):0]);
                            const totalAg=BK.map(b=>Math.round(pv.reduce((s,r)=>s+(r.ag[b.k]||0),0)));
                            const totalRow=['ALT TOPLAM',Math.round(gt),Math.round(gtVal),D.s.avgAge,...totalAg,100];
                            const data=[headers,...rowsX,totalRow];
                            const ws=X.utils.aoa_to_sheet(data);
                            ws['!cols']=[{wch:32},{wch:18},{wch:18},{wch:12},...BK.map(()=>({wch:14})),{wch:10}];
                            ws['!freeze']={ySplit:1};
                            const lastCol=headers.length-1;
                            for(let r=1;r<data.length;r++){
                              for(let c=1;c<headers.length;c++){
                                const ref=X.utils.encode_cell({r,c});
                                if(!ws[ref])continue;
                                ws[ref].t='n';
                                if(c===2)ws[ref].z='"$"#,##0';
                                else if(c===3)ws[ref].z='0" gün"';
                                else if(c===lastCol)ws[ref].z='0.00"%"';
                                else ws[ref].z='#,##0';
                              }
                            }
                            for(let c=0;c<headers.length;c++){const ref=X.utils.encode_cell({r:0,c});if(ws[ref])ws[ref].s={font:{bold:true}};}
                            const wb=X.utils.book_new();
                            X.utils.book_append_sheet(wb,ws,cur.l+' Raporu');
                            X.writeFile(wb,'TYRO_'+cur.l.replace(/\s+/g,'')+'_Rapor_'+new Date().toISOString().slice(0,10)+'.xlsx');
                          };
                          if(window.XLSX)doIt();
                          else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);}
                          return; // eski CSV path'i devre dışı (alttaki ölü kod no-op'a düşer)
                          const hd=[cur.l,'Toplam Miktar (kg)','Toplam Değer ($)','Ort.Yaş (gün)',...BK.map(b=>b.k)];
                          const csvRows=pv.map(r=>['"'+r.n+'"',Math.round(r.total),Math.round(r.totalVal),r.avg,...BK.map(b=>Math.round(r.ag[b.k]||0))].join(','));
                          const csv=hd.join(',')+'\n'+csvRows.join('\n');
                          const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download='TYRO_'+cur.l+'_Rapor_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
                        }} style={{fontSize:11}}><Download size={13}/>Excel</button>
                        <button className="tb-b pr" onClick={()=>{
                          const w=window.open('','_blank');
                          const bkH=BK.map(b=>'<th style="padding:11px 7px;text-align:right;font-size:10.5px;color:'+b.c+';white-space:nowrap;font-weight:800">'+b.k+' g</th>').join('');
                          const trs=pv.map((r,i)=>{
                            const bkC=BK.map(b=>{const v=r.ag[b.k]||0;const p=r.total>0?((v/r.total)*100).toFixed(0):'0';return '<td style="padding:9px 7px;text-align:right;font-family:Consolas,monospace;font-size:11px;color:'+(v>0?'#333':'#ccc')+';white-space:nowrap;border-bottom:1px solid #eef1f6">'+(v>0?Math.round(v).toLocaleString('tr-TR')+' <small style="color:#aaa;font-size:9px">'+p+'%</small>':'—')+'</td>';}).join('');
                            const sharePct=gt>0?(r.total/gt*100).toFixed(1):'0';
                            const ageColor=r.avg<60?'#0d6e4f':r.avg<180?'#f5a623':'#e5484d';
                            const ageBg=r.avg<60?'rgba(45,212,160,.12)':r.avg<180?'rgba(245,166,35,.1)':'rgba(229,72,77,.1)';
                            return '<tr style="background:'+(i%2?'#fafbfc':'#fff')+'"><td style="padding:9px 11px;font-weight:600;font-size:12.5px;border-bottom:1px solid #eef1f6">'+r.n+'</td><td style="padding:9px 11px;text-align:right;font-family:Consolas,monospace;font-weight:700;font-size:12.5px;border-bottom:1px solid #eef1f6">'+Math.round(r.total).toLocaleString('tr-TR')+'</td><td style="padding:9px 11px;text-align:right;font-family:Consolas,monospace;font-weight:700;font-size:11.5px;color:#3b82f6;border-bottom:1px solid #eef1f6">$'+Math.round(r.totalVal).toLocaleString('tr-TR')+'</td><td style="padding:9px 11px;text-align:right;border-bottom:1px solid #eef1f6"><span style="font-family:Consolas,monospace;font-size:11px;font-weight:700;color:'+ageColor+';padding:3px 8px;border-radius:5px;background:'+ageBg+'">'+r.avg+' g</span></td>'+bkC+'<td style="padding:9px 11px;text-align:right;font-family:Consolas,monospace;font-size:12px;font-weight:700;color:#0d6e4f;border-bottom:1px solid #eef1f6">'+sharePct+'%</td></tr>';
                          }).join('');
                          const gBk=BK.map(b=>{const v=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);return '<td style="padding:11px 7px;text-align:right;font-family:Consolas,monospace;font-size:11.5px;font-weight:800;color:'+b.c+'">'+Math.round(v).toLocaleString('tr-TR')+'</td>';}).join('');
                          const avgColor=D.s.avgAge<60?'#0d6e4f':D.s.avgAge<180?'#f5a623':'#e5484d';
                          // Sidebar'la birebir aynı logo (tyro-sg yeşil + tyro-au mavi/mor gradient'lı, mor & laci aksanlar)
                          const tyroLogoSvg='<svg width="44" height="44" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><defs><linearGradient id="pdf-tyro-sg" x1="61.29" y1="116.53" x2="14.04" y2="47.15" gradientTransform="translate(0 150.55) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2dd4a0"/><stop offset="1" stop-color="#0d6e4f"/></linearGradient><linearGradient id="pdf-tyro-au" x1="60" y1="10" x2="130" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3b82f6"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="url(#pdf-tyro-sg)"/><path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="#6366f1"/><path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="url(#pdf-tyro-au)"/><path d="M84.52,91.98s5.52-3.31,13.25-7.87v-8.28c-9.11,5.25-16.43,9.66-16.43,9.66,0,0-20.29,10.35-22.92,45.14v1.1c7.32-30.23,26.09-39.76,26.09-39.76Z" fill="#4338ca"/></svg>';
                          // Sidebar'la birebir "tyrostock" wordmark — "tyro" koyu, "stock" gradient, birleşik (tek <text>+<tspan>)
                          const tyroWordmark='<svg width="180" height="32" viewBox="0 0 180 32" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><defs><linearGradient id="pdf-stk-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2dd4a0"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><text y="24" font-family="-apple-system,Segoe UI,Arial,sans-serif" font-size="26" font-weight="800" letter-spacing=".3"><tspan x="0" fill="#1a2332">tyro</tspan><tspan fill="url(#pdf-stk-grad)">stock</tspan></text></svg>';
                          w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>TYRO STOCK — '+cur.l+' Yaşlandırma Raporu</title><style>@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:0;padding:20px;color:#1a2332;font-size:12.5px}table{width:100%;border-collapse:collapse;table-layout:auto}thead th{text-align:left;padding:11px 11px;font-size:11px;color:#334155;text-transform:uppercase;letter-spacing:.6px;border-bottom:2.5px solid #0d6e4f;background:#f4f9f7;font-weight:800}td{font-size:12px}.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:16px;border-bottom:3px solid #0d6e4f}.brand{display:flex;align-items:center;gap:12px}.brand-text{display:flex;flex-direction:column;gap:4px}.meta{text-align:right;font-size:12px;color:#475569;line-height:1.5}.sub{font-size:10.5px;color:#64748b;font-weight:600;letter-spacing:.3px}.kpis{display:flex;gap:12px;margin-bottom:18px}.kpi{flex:1;background:#f4f9f7;border:1px solid #d4e8df;border-radius:10px;padding:12px 14px}.kpi-l{font-size:10.5px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}.kpi-v{font-size:18px;font-weight:800;color:#0d6e4f;font-family:Consolas,monospace}.ftr{margin-top:24px;padding-top:14px;border-top:2px solid #0d6e4f;display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.ftr-l{display:flex;flex-direction:column;gap:3px}.ftr-r{text-align:right;display:flex;flex-direction:column;gap:3px}.ftr-brand{font-size:12px;font-weight:800;color:#0d6e4f;letter-spacing:.4px}.ftr-sub{font-size:10px;color:#64748b;font-weight:600;letter-spacing:.2px}.ftr-ts{font-size:10.5px;font-weight:700;color:#475569;font-family:Consolas,monospace}.ftr-cr{font-size:9.5px;color:#94a3b8;font-weight:500}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>');
                          w.document.write('<div class="hdr"><div class="brand">'+tyroLogoSvg+'<div class="brand-text">'+tyroWordmark+'<div class="sub">TTECH Business Solutions · Stok Yaşlandırma Raporu</div></div></div><div class="meta"><div style="font-size:14.5px;font-weight:700;color:#1a2332">'+cur.l+' Bazlı Yaşlandırma</div><div>'+new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'})+'</div></div></div>');
                          w.document.write('<div class="kpis"><div class="kpi"><div class="kpi-l">Kayıt</div><div class="kpi-v">'+pv.length+'</div></div><div class="kpi"><div class="kpi-l">Toplam Miktar</div><div class="kpi-v">'+Math.round(gt).toLocaleString('tr-TR')+' kg</div></div><div class="kpi"><div class="kpi-l">Toplam Değer</div><div class="kpi-v" style="color:#3b82f6">$'+Math.round(gtVal).toLocaleString('tr-TR')+'</div></div><div class="kpi"><div class="kpi-l">Ortalama Yaş</div><div class="kpi-v" style="color:'+avgColor+'">'+D.s.avgAge+' gün</div></div></div>');
                          w.document.write('<table><thead><tr><th>'+cur.l+'</th><th style="text-align:right">Toplam Miktar</th><th style="text-align:right">Toplam Değer</th><th style="text-align:right">Ort.Yaş</th>'+bkH+'<th style="text-align:right;min-width:60px">% Pay</th></tr></thead><tbody>'+trs+'<tr style="background:linear-gradient(90deg,#e4f5ee,#f4f9f7);border-top:2.5px solid #0d6e4f"><td style="padding:12px 11px;font-weight:900;color:#0d6e4f;font-size:13.5px;letter-spacing:.5px">ALT TOPLAM</td><td style="padding:12px 11px;text-align:right;font-family:Consolas,monospace;font-weight:900;font-size:13px;color:#0d6e4f">'+Math.round(gt).toLocaleString('tr-TR')+'</td><td style="padding:12px 11px;text-align:right;font-family:Consolas,monospace;font-weight:900;font-size:12.5px;color:#3b82f6">$'+Math.round(gtVal).toLocaleString('tr-TR')+'</td><td style="padding:12px 11px;text-align:right;font-family:Consolas,monospace;font-weight:900;font-size:12.5px;color:'+avgColor+'">'+D.s.avgAge+'g</td>'+gBk+'<td style="padding:12px 11px;text-align:right;font-family:Consolas,monospace;font-weight:900;font-size:12.5px;color:#0d6e4f">100%</td></tr></tbody></table>');
                          w.document.write('<div class="ftr"><div class="ftr-l"><div class="ftr-brand">TTECH Business Solutions</div><div class="ftr-sub">TYRO Stock Management Agent · Stok Yaşlandırma Modülü</div></div><div class="ftr-r"><div class="ftr-ts">Rapor: '+new Date().toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})+'</div><div class="ftr-cr">© '+new Date().getFullYear()+' Tiryaki Agro · Tüm hakları saklıdır</div></div></div>');
                          w.document.write('</body></html>');
                          w.document.close();
                          setTimeout(()=>{try{w.focus();w.print();}catch(_){/**/}},400);
                        }} style={{fontSize:11}}><Download size={13}/>PDF</button>
                      </div>
                    </div>

                    <div style={{overflowX:'auto',maxHeight:'calc(100vh - 230px)'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11.5}}>
                        <thead>
                          <tr style={{position:'sticky',top:0,zIndex:2,background:$.bg}}>
                            {(()=>{const sH=(col)=>({onClick:()=>{if(repSC===col)setRepSD(d=>d*-1);else{setRepSC(col);setRepSD(-1);}},style:{cursor:'pointer',userSelect:'none'}});const sI=(col)=>repSC===col?<ArrowUpDown size={9} style={{marginLeft:3,verticalAlign:'middle'}} color={$.blu}/>:null;return(<>
                            <th {...sH('n')} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,fontSize:10,color:repSC==='n'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:160,cursor:'pointer'}}>{cur.l}{sI('n')}</th>
                            <th {...sH('total')} style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:repSC==='total'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:90,cursor:'pointer'}}>Toplam Miktar{sI('total')}</th>
                            <th {...sH('totalVal')} style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:repSC==='totalVal'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:100,cursor:'pointer'}}>Toplam Değer{sI('totalVal')}</th>
                            <th {...sH('avg')} style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:repSC==='avg'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:60,cursor:'pointer'}}>Ort.Yaş{sI('avg')}</th>
                            {BK.map(b=><th key={b.k} {...sH(b.k)} style={{padding:'10px 8px',textAlign:'right',fontWeight:700,fontSize:9,color:repSC===b.k?$.blu:b.c,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:62,cursor:'pointer'}}>{b.k}{sI(b.k)}</th>)}
                            </>);})()}
                            <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:200}}>Dağılım</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pv.map((r,ri)=>{
                            const isTraderTab=cur.id==='tra'||cur.id==='mtra';
                            const traderTip=isTraderTab&&r.code?(`Kod: ${r.code}`+(r.name?` · Ad: ${r.name}`:'')):undefined;
                            return(
                            <tr key={r.n} className="rh" style={{borderBottom:'1px solid '+$.bdL,background:ri%2?'#fafbfc':'#fff'}}>
                              <td title={traderTip} style={{padding:'9px 14px',fontWeight:600,fontSize:12,color:$.t1,cursor:traderTip?'help':'default'}}>{r.n}</td>
                              <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:700,fontSize:12,color:$.t1}}>{fN(r.total)}</td>
                              <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:700,fontSize:11,color:$.blu}}>${fN(r.totalVal)}</td>
                              <td style={{padding:'9px 14px',textAlign:'right'}}>
                                <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(r.avg),padding:'2px 8px',borderRadius:5,background:acBg(r.avg)}}>{r.avg}g</span>
                              </td>
                              {BK.map(b=>{const v=r.ag[b.k]||0;const p=r.total>0?((v/r.total)*100).toFixed(0):'0';return(
                                <td key={b.k} style={{padding:'9px 8px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,color:v>0?$.t2:$.bdL,fontWeight:v>0?600:400}}>{v>0?fN(v)+' ('+p+'%)':'-'}</td>
                              );})}
                              <td style={{padding:'9px 14px'}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <SegBar ag={r.ag} total={r.total}/>
                                  <span style={{fontSize:10,fontFamily:$.mo,color:$.t3,fontWeight:600,minWidth:35,textAlign:'right'}}>{gt>0?((r.total/gt)*100).toFixed(0)+'%':'0%'}</span>
                                </div>
                              </td>
                            </tr>);
                          })}
                          {/* Grand total row */}
                          <tr style={{background:$.acL,borderTop:'2px solid '+$.bd}}>
                            <td style={{padding:'10px 14px',fontWeight:800,fontSize:12,color:$.ac}}>TOPLAM</td>
                            <td style={{padding:'10px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:800,fontSize:12,color:$.ac}}>{fN(gt)}</td>
                            <td style={{padding:'10px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:800,fontSize:11,color:$.blu}}>${fN(gtVal)}</td>
                            <td style={{padding:'10px 14px',textAlign:'right'}}>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(D.s.avgAge),padding:'2px 8px',borderRadius:5,background:acBg(D.s.avgAge)}}>{D.s.avgAge}g</span>
                            </td>
                            {BK.map(b=>{const v=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);return(
                              <td key={b.k} style={{padding:'10px 8px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,fontWeight:700,color:b.c}}>{fN(v)}</td>
                            );})}
                            <td style={{padding:'10px 14px'}}>
                              {(()=>{const tag={};BK.forEach(b=>{tag[b.k]=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);});return <SegBar ag={tag} total={gt}/>;})()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top 10 — Stabil grid layout, hizalı kolonlar */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginTop:16,overflow:'hidden'}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><BarChart3 size={14}/></div>
                      <span style={{fontSize:13,fontWeight:700}}>Top {Math.min(10,pv.length)} — Stok & Yaşlanma Dağılımı</span>
                      <span style={{fontSize:10.5,color:$.t3,fontWeight:500,marginLeft:'auto',fontFamily:$.mo}}>Toplam stok payına göre</span>
                    </div>
                    <div style={{padding:'14px 18px 18px'}}>
                      {(()=>{const top=pv.slice(0,10);const mxQ=Math.max(...top.map(r=>r.total),1);return top.map((r,i)=>{
                        const pct=gt>0?(r.total/gt)*100:0;
                        const fillPct=(r.total/mxQ)*100;
                        return(
                          <div key={r.n} className="fu" style={{animationDelay:i*30+'ms',display:'grid',gridTemplateColumns:'24px minmax(140px,1.2fr) 1.5fr auto auto',gap:10,alignItems:'center',padding:'9px 0',borderBottom:i<top.length-1?'1px dashed '+$.bdL:'none'}}>
                            <div style={{fontSize:10,fontWeight:800,color:$.t3,fontFamily:$.mo,textAlign:'center',background:i<3?$.acL:'transparent',color:i<3?$.ac:$.t3,borderRadius:5,padding:'2px 0'}}>#{i+1}</div>
                            <div style={{minWidth:0,overflow:'hidden'}}>
                              <div style={{fontSize:12,fontWeight:600,color:$.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:1}} title={r.n}>{r.n}</div>
                              <div style={{fontSize:10,color:$.t3,fontFamily:$.mo,fontWeight:500}}>{fN(r.total)} kg · ${fN(r.totalVal)}</div>
                            </div>
                            <div style={{position:'relative',height:18,minWidth:0}}>
                              <div style={{position:'absolute',inset:0,borderRadius:9,background:'rgba(13,110,79,.04)'}}/>
                              <div style={{position:'absolute',top:0,left:0,height:'100%',width:fillPct+'%',borderRadius:9,overflow:'hidden',display:'flex',transition:'width .5s cubic-bezier(.4,0,.2,1)'}}>
                                {BK.map(b=>{const v=r.ag[b.k]||0;const p=r.total>0?(v/r.total)*100:0;return p>0?<div key={b.k} title={b.k+' gün: '+fN(v)+' kg ('+p.toFixed(0)+'%)'} style={{width:p+'%',background:b.c,opacity:.92}}/>:null;})}
                              </div>
                            </div>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(r.avg),padding:'3px 8px',borderRadius:5,background:acBg(r.avg),whiteSpace:'nowrap',justifySelf:'end'}}>{r.avg}g</span>
                            <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:$.t1,minWidth:48,textAlign:'right',justifySelf:'end'}}>{pct.toFixed(1)}%</span>
                          </div>
                        );
                      });})()}
                      {/* Yaşlandırma legend — bar renklerinin anlamı */}
                      <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:14,paddingTop:12,borderTop:'1px solid '+$.bdL}}>
                        {BK.map(b=>(
                          <div key={b.k} style={{display:'flex',alignItems:'center',gap:5}}>
                            <div style={{width:9,height:9,borderRadius:2.5,background:b.c}}/>
                            <span style={{fontSize:10,color:$.t3,fontWeight:600,fontFamily:$.mo}}>{b.k} gün</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );})()}

            {/* ===== STOK RAPORU ===== */}
            {pg==='sto'&&(()=>{
              // Şirket Kodu, Şirket Adı, Tesis Kodu, Tesis Adı, Ambar Kodu, Ambar Adı bazında grupla
              const groups={};
              gRows.forEach(r=>{
                const sk=String(r[0]||''),sn=String(r[1]||r[0]||''),tk=String(r[9]||''),tn=String(r[10]||''),ak=String(r[11]||''),an=String(r[12]||'');
                const key=sk+'|'+sn+'|'+tk+'|'+tn+'|'+ak+'|'+an;
                if(!groups[key])groups[key]={sk,sn,tk,tn,ak,an,q:0,v:0};
                groups[key].q+=Number(r[8])||0;
                groups[key].v+=(Number(r[8])||0)*(Number(r[25])||0);
              });
              let arr=Object.values(groups);
              if(stoSearch.trim()){
                const t=stoSearch.toLowerCase();
                arr=arr.filter(g=>[g.sk,g.sn,g.tk,g.tn,g.ak,g.an].some(s=>String(s).toLowerCase().includes(t)));
              }
              arr.sort((a,b)=>{
                if(stoSC==='q'||stoSC==='v')return((a[stoSC]||0)-(b[stoSC]||0))*stoSD;
                return String(a[stoSC]||'').localeCompare(String(b[stoSC]||''),'tr')*stoSD;
              });
              const totalQ=arr.reduce((s,g)=>s+g.q,0);
              const totalV=arr.reduce((s,g)=>s+g.v,0);
              const sH=(col)=>({onClick:()=>{if(stoSC===col)setStoSD(d=>d*-1);else{setStoSC(col);setStoSD(col==='q'||col==='v'?-1:1);}},title:'Sırala',style:{cursor:'pointer',userSelect:'none'}});
              const sI=(col)=>{
                if(stoSC!==col)return <ArrowUpDown size={10} style={{marginLeft:4,verticalAlign:'middle',opacity:.35}} color={$.t3}/>;
                return stoSD===-1
                  ? <svg width="10" height="10" viewBox="0 0 10 10" style={{marginLeft:4,verticalAlign:'middle'}}><path d="M5 7.5L1.5 3h7L5 7.5z" fill={$.blu}/></svg>
                  : <svg width="10" height="10" viewBox="0 0 10 10" style={{marginLeft:4,verticalAlign:'middle'}}><path d="M5 2.5L8.5 7h-7L5 2.5z" fill={$.blu}/></svg>;
              };
              const cols=[
                {k:'sk',l:'Şirket Kodu',a:'left',w:110},
                {k:'sn',l:'Şirket Adı',a:'left',w:220},
                {k:'tk',l:'Tesis Kodu',a:'left',w:100},
                {k:'tn',l:'Tesis Adı',a:'left',w:240},
                {k:'ak',l:'Ambar Kodu',a:'left',w:100},
                {k:'an',l:'Ambar Adı',a:'left',w:220},
                {k:'q',l:'Toplam Miktar (kg)',a:'right',w:150},
                {k:'v',l:'Toplam Değer ($)',a:'right',w:140}
              ];
              const exportXLSX=()=>{
                const doIt=()=>{
                  const X=window.XLSX;
                  const headers=['Şirket Kodu','Şirket Adı','Tesis Kodu','Tesis Adı','Ambar Kodu','Ambar Adı','Toplam Miktar (kg)','Toplam Değer ($)'];
                  const rowsX=arr.map(g=>[g.sk,g.sn,g.tk,g.tn,g.ak,g.an,Math.round(g.q),Math.round(g.v)]);
                  const totalRow=['ALT TOPLAM','','','','','',Math.round(totalQ),Math.round(totalV)];
                  const data=[headers,...rowsX,totalRow];
                  const ws=X.utils.aoa_to_sheet(data);
                  ws['!cols']=[{wch:14},{wch:34},{wch:12},{wch:36},{wch:12},{wch:32},{wch:20},{wch:20}];
                  ws['!freeze']={ySplit:1};
                  // Sayısal hücrelere format uygula
                  for(let r=1;r<data.length;r++){
                    const refQ=X.utils.encode_cell({r,c:6});
                    if(ws[refQ]){ws[refQ].t='n';ws[refQ].z='#,##0';}
                    const refV=X.utils.encode_cell({r,c:7});
                    if(ws[refV]){ws[refV].t='n';ws[refV].z='"$"#,##0';}
                  }
                  // Header bold (community sheetjs sınırlı destek)
                  for(let c=0;c<headers.length;c++){
                    const ref=X.utils.encode_cell({r:0,c});
                    if(ws[ref])ws[ref].s={font:{bold:true}};
                  }
                  const wb=X.utils.book_new();
                  X.utils.book_append_sheet(wb,ws,'Stok Raporu');
                  X.writeFile(wb,'TYRO_StokRaporu_'+new Date().toISOString().slice(0,10)+'.xlsx');
                };
                if(window.XLSX)doIt();
                else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);}
              };
              return(
                <div>
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,overflow:'hidden'}}>
                    <div style={{padding:'14px 18px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <div style={{width:28,height:28,borderRadius:8,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Package size={15}/></div>
                      <div style={{display:'flex',flexDirection:'column'}}>
                        <span style={{fontSize:13.5,fontWeight:700,color:$.t1}}>Stok Dökümü</span>
                        <span style={{fontSize:10.5,color:$.t3,fontFamily:$.mo,fontWeight:500}}>{arr.length} satır · {fmtTon(totalQ)} · ${fmt(totalV)}</span>
                      </div>
                      <div style={{position:'relative',marginLeft:'auto',minWidth:220,maxWidth:280,flex:1}}>
                        <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:$.t3,pointerEvents:'none'}}/>
                        <input value={stoSearch} onChange={e=>setStoSearch(e.target.value)} placeholder="Şirket / Tesis / Ambar ara..." className="fi" style={{paddingLeft:32,paddingRight:stoSearch?28:10,fontSize:12,width:'100%',boxSizing:'border-box'}}/>
                        {stoSearch&&<div onClick={()=>setStoSearch('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',cursor:'pointer',width:18,height:18,borderRadius:9,background:'rgba(0,0,0,.08)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={10} color={$.t2}/></div>}
                      </div>
                      <button className="tb-b pr" onClick={exportXLSX} disabled={arr.length===0} style={{fontSize:11,opacity:arr.length===0?.5:1}}><Download size={13}/>Excel'e Aktar</button>
                    </div>
                    <div style={{maxHeight:'calc(100vh - 260px)',overflow:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11.5}}>
                        <thead>
                          <tr>
                            {cols.map(c=>(
                              <th key={c.k} {...sH(c.k)} style={{padding:'10px 12px',textAlign:c.a,fontWeight:700,fontSize:10,color:stoSC===c.k?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:c.w,whiteSpace:'nowrap',position:'sticky',top:0,zIndex:5}}>{c.l}{sI(c.k)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {arr.map((g,i)=>(
                            <tr key={i} style={{background:i%2?$.bg:$.bg2,borderBottom:'1px solid '+$.bdL}}>
                              <td style={{padding:'8px 12px',fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t1,whiteSpace:'nowrap'}}>{g.sk}</td>
                              <td style={{padding:'8px 12px',fontWeight:500,color:$.t1}}>{g.sn}</td>
                              <td style={{padding:'8px 12px',fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t1,whiteSpace:'nowrap'}}>{g.tk}</td>
                              <td style={{padding:'8px 12px',fontWeight:500,color:$.t1}}>{g.tn}</td>
                              <td style={{padding:'8px 12px',fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t1,whiteSpace:'nowrap'}}>{g.ak}</td>
                              <td style={{padding:'8px 12px',fontWeight:500,color:$.t1}}>{g.an}</td>
                              <td style={{padding:'8px 12px',fontFamily:$.mo,fontSize:11,fontWeight:700,color:$.t1,textAlign:'right',whiteSpace:'nowrap'}}>{fmtTon(g.q)}</td>
                              <td style={{padding:'8px 12px',fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f',textAlign:'right',whiteSpace:'nowrap'}}>${fmt(g.v)}</td>
                            </tr>
                          ))}
                          {arr.length===0&&(
                            <tr><td colSpan={cols.length} style={{padding:'48px 16px',textAlign:'center',color:$.t3,fontSize:12}}>{gRows.length===0?'Önce ERP verilerini yükleyin':'Filtreye uyan kayıt bulunamadı'}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* ALT TOPLAM banner — scroll alanının dışında, her zaman altta sabit */}
                    {arr.length>0&&(
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,padding:'12px 18px',background:'linear-gradient(90deg,rgba(13,110,79,.08),rgba(13,110,79,.04))',borderTop:'2px solid '+$.ac,fontFamily:$.mo}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{padding:'3px 9px',borderRadius:6,background:$.ac,color:'#fff',fontSize:10,fontWeight:800,letterSpacing:.6}}>ALT TOPLAM</span>
                          <span style={{fontSize:11.5,fontWeight:600,color:$.t2}}>{arr.length} satır</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:18}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                            <span style={{fontSize:9.5,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5}}>Miktar</span>
                            <span style={{fontSize:13.5,fontWeight:800,color:$.t1}}>{fmtTon(totalQ)}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                            <span style={{fontSize:9.5,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5}}>Değer</span>
                            <span style={{fontSize:13.5,fontWeight:800,color:'#0d6e4f'}}>${fmt(totalV)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ===== SATIŞ TAHMİNİ (fcst) ===== */}
            {pg==='fcst'&&(()=>{
              // Aktif modelin forecast sonucu (best fit veya kullanıcı seçimi)
              const fit=fcstMetric==='value'?fcstResult?.fitValue:fcstResult?.fitQty;
              const activeModelId=fcstActiveModel||fit?.bestId||null;
              const activeResult=fit?.results?.find(r=>r.id===activeModelId);
              const series=fcstResult?.series;
              const histArr=series?(fcstMetric==='value'?series.value:series.qty):null;
              const histKeys=series?series.keys:[];
              const horizon=fcstResult?.horizon||fcstHorizon;
              // Tahmin aylarının anahtarlarını üret (son tarih + 1, +2, ...)
              const forecastKeys=[];
              if(histKeys.length>0){
                let cur=histKeys[histKeys.length-1];
                for(let i=0;i<horizon;i++){
                  const d=new Date(Date.UTC(+cur.split('-')[0],+cur.split('-')[1]-1,1));
                  d.setUTCMonth(d.getUTCMonth()+1);
                  cur=`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
                  forecastKeys.push(cur);
                }
              }
              const forecastPts=activeResult?.forecast?.point||[];
              const forecastLow=activeResult?.forecast?.lower||[];
              const forecastUp=activeResult?.forecast?.upper||[];
              // Format helpers
              const fmtMetric=v=>fcstMetric==='value'?`$${fmt(v)}`:fmtTon(v);
              const fmtMetricShort=v=>fcstMetric==='value'?`$${fmt(v)}`:fN(Math.round(v))+' kg';
              const monthLabel=key=>{const[y,m]=key.split('-');return MONTHS_TR[+m-1].slice(0,3)+' '+y.slice(2);};
              // Geçen yıl aynı ay (YoY) için lookup
              const yoyOf=(targetKey,allKeys,allVals)=>{
                const[y,m]=targetKey.split('-');
                const lastY=`${+y-1}-${m}`;
                const idx=allKeys.indexOf(lastY);
                return idx>=0?allVals[idx]:null;
              };
              const allValsCombined=[...(histArr||[]),...forecastPts];
              const allKeysCombined=[...histKeys,...forecastKeys];
              // Excel export
              const exportXLSX=()=>{
                if(!fcstResult||!fit)return;
                const doIt=()=>{
                  const X=window.XLSX;
                  const codesArr=fcstResult.traderCodes||[fcstResult.traderCode];
                  const tName=codesArr.length===1?(fcstTraderList.find(t=>t.code===codesArr[0])?.name||codesArr[0]):`${codesArr.length} trader birleşik`;
                  const metricLbl=fcstMetric==='value'?'Tutar (USD)':'Miktar (kg)';
                  // Sheet 1 — Özet
                  const summary=[
                    ['Satış Tahmini Raporu'],
                    ['Trader',codesArr.length===1?`${codesArr[0]} : ${tName}`:`${codesArr.length} trader: ${codesArr.join(', ')}`],
                    ['Grup Şirketi',fcstResult.profile?.mainGroup||'-'],
                    ['Karakter',fcstResult.profile?.character||'-'],
                    ['Metrik',metricLbl],
                    ['Horizon',`${horizon} ay`],
                    ['Hesaplanma',new Date(fcstResult.fetchedAt).toLocaleString('tr-TR')],
                    ['Aktif Model',FORECAST_MODELS.find(m=>m.id===activeModelId)?.label||activeModelId||'-'],
                    [],
                    ['Model Karşılaştırma (Backtest MAPE)'],
                    ['Model','MAPE %','Durum'],
                    ...fit.results.map(r=>[FORECAST_MODELS.find(m=>m.id===r.id)?.label||r.id,r.mape!=null?+r.mape.toFixed(2):null,r.skipped?(r.reason||'Atlandı'):(r.id===fit.bestId?'⭐ Best Fit':'OK')]),
                  ];
                  const ws1=X.utils.aoa_to_sheet(summary);
                  ws1['!cols']=[{wch:28},{wch:32},{wch:18}];
                  // Sheet 2 — Aylık Detay
                  const det=[['Ay','Geçmiş Gerçek',`Tahmin (${metricLbl})`,'Alt Sınır','Üst Sınır','Geçen Yıl','YoY %','Tip']];
                  histKeys.forEach((k,i)=>{
                    const v=histArr[i];
                    const ly=yoyOf(k,histKeys,histArr);
                    const yoy=ly!=null&&ly>0?((v-ly)/ly*100):null;
                    det.push([k,Math.round(v),null,null,null,ly!=null?Math.round(ly):null,yoy!=null?+yoy.toFixed(2):null,'Geçmiş']);
                  });
                  forecastKeys.forEach((k,i)=>{
                    const v=forecastPts[i];
                    const ly=yoyOf(k,allKeysCombined,allValsCombined);
                    const yoy=ly!=null&&ly>0?((v-ly)/ly*100):null;
                    det.push([k,null,Math.round(v),Math.round(forecastLow[i]||0),Math.round(forecastUp[i]||0),ly!=null?Math.round(ly):null,yoy!=null?+yoy.toFixed(2):null,'Tahmin']);
                  });
                  const ws2=X.utils.aoa_to_sheet(det);
                  ws2['!cols']=[{wch:10},{wch:14},{wch:18},{wch:14},{wch:14},{wch:14},{wch:10},{wch:10}];
                  ws2['!freeze']={ySplit:1};
                  for(let r=1;r<det.length;r++){for(let c=1;c<=6;c++){const ref=X.utils.encode_cell({r,c});if(ws2[ref]&&typeof ws2[ref].v==='number'){ws2[ref].t='n';ws2[ref].z=c===6?'0.00"%"':'#,##0';}}}
                  const wb=X.utils.book_new();
                  X.utils.book_append_sheet(wb,ws1,'Özet');
                  X.utils.book_append_sheet(wb,ws2,'Aylık Detay');
                  X.writeFile(wb,`TYRO_SatisTahmini_${codesArr.length===1?codesArr[0]:codesArr.length+'trader'}_${new Date().toISOString().slice(0,10)}.xlsx`);
                };
                if(window.XLSX)doIt();
                else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);}
              };
              return(
                <div>
                  {/* ─── Filtre Paneli ─── */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:14}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <div style={{width:28,height:28,borderRadius:8,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><TrendingUp size={15}/></div>
                      <span style={{fontSize:13.5,fontWeight:700}}>Satış Tahmini Hesaplama</span>
                      {fcstStatus&&<span style={{fontSize:11,color:$.t3,fontFamily:$.mo,fontWeight:500}}>{fcstStatus}</span>}
                      {fcstError&&<span style={{fontSize:11,color:$.red,fontFamily:$.mo,fontWeight:500,padding:'3px 9px',borderRadius:6,background:$.redB,cursor:'pointer'}} onClick={()=>setFcstError('')}>{fcstError} ✕</span>}
                    </div>
                    <div style={{padding:'14px 18px',display:'flex',alignItems:'flex-end',gap:12,flexWrap:'wrap'}}>
                      {/* Trader dropdown — multi-select, kod & isim bazlı arama */}
                      <div style={{minWidth:280,flex:'1 1 280px'}}>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:5}}>Trader (zorunlu — çoklu seçim)</div>
                        <SearchableSelect
                          multi
                          value={fcstTrader}
                          onChange={setFcstTrader}
                          items={fcstTraderList.map(t=>({value:t.code,label:t.label,sub:t.code}))}
                          placeholder={fcstTraderListLoading?'Yükleniyor...':'Bir veya birden fazla trader seçin (TRD- / DNM-)...'}
                          disabled={fcstTraderListLoading}
                          emptyText="Bu aramaya uyan trader yok"
                        />
                      </div>
                      {/* Horizon */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:5}}>Horizon</div>
                        <div style={{display:'flex',gap:0,background:$.bg,borderRadius:8,padding:3,border:'1px solid '+$.bdL}}>
                          {[3,6,12].map(h=>(
                            <div key={h} onClick={()=>setFcstHorizon(h)} style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:fcstHorizon===h?700:500,cursor:'pointer',background:fcstHorizon===h?'#fff':'transparent',color:fcstHorizon===h?$.t1:$.t3,boxShadow:fcstHorizon===h?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .15s',userSelect:'none'}}>{h} ay</div>
                          ))}
                        </div>
                      </div>
                      {/* Metrik toggle */}
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.4,marginBottom:5}}>Metrik</div>
                        <div style={{display:'flex',gap:0,background:$.bg,borderRadius:8,padding:3,border:'1px solid '+$.bdL}}>
                          {[{id:'qty',l:'Miktar'},{id:'value',l:'Tutar'}].map(m=>{
                            const disabled=m.id==='value'&&fcstResult&&!fcstResult.valueAvailable;
                            return(
                              <div key={m.id} onClick={()=>{if(!disabled)setFcstMetric(m.id);}} title={disabled?'Tutar alanı bu trader için bulunamadı':undefined} style={{padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:fcstMetric===m.id?700:500,cursor:disabled?'not-allowed':'pointer',background:fcstMetric===m.id?'#fff':'transparent',color:disabled?$.bdL:fcstMetric===m.id?$.t1:$.t3,boxShadow:fcstMetric===m.id?'0 1px 3px rgba(0,0,0,.08)':'none',opacity:disabled?.5:1,transition:'all .15s',userSelect:'none'}}>{m.l}</div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{flex:'0 0 auto',display:'flex',gap:8}}>
                        <button className="tb-b pr" onClick={runForecast} disabled={(!Array.isArray(fcstTrader)||fcstTrader.length===0)||fcstLoading} style={{padding:'9px 18px',fontSize:12,opacity:((!Array.isArray(fcstTrader)||fcstTrader.length===0)||fcstLoading)?.5:1}}>
                          {fcstLoading?<span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>:<TrendingUp size={13}/>}
                          {fcstLoading?'Hesaplanıyor...':'Hesapla'}
                        </button>
                        {fcstResult&&<button className="tb-b" onClick={exportXLSX} style={{padding:'9px 16px',fontSize:12}}><Download size={13}/>Excel</button>}
                      </div>
                    </div>
                  </div>

                  {/* ─── Empty state ─── */}
                  {!fcstResult&&!fcstLoading&&(
                    <div style={{background:$.bg2,border:'1px dashed '+$.bdL,borderRadius:$.rL,padding:'50px 20px',textAlign:'center'}}>
                      <div style={{width:60,height:60,borderRadius:16,background:'linear-gradient(135deg,rgba(45,212,160,.1),rgba(59,130,246,.1))',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
                        <TrendingUp size={28} color={$.ac}/>
                      </div>
                      <div style={{fontSize:15,fontWeight:700,color:$.t1,marginBottom:6}}>Bir trader seçip Hesapla'ya tıklayın</div>
                      <div style={{fontSize:12,color:$.t3,lineHeight:1.6,maxWidth:560,margin:'0 auto'}}>
                        Tarayıcıda 5 farklı tahmin modeli (Holt-Winters, STL+ETS, Seasonal Naive, Croston, Moving Avg) paralel çalıştırılır.<br/>
                        En düşük MAPE'li model otomatik <strong>Best Fit</strong> olarak işaretlenir, sekmelerle diğerlerini kıyaslayabilirsiniz.
                      </div>
                    </div>
                  )}

                  {/* ─── AI Thinking Loader ─── */}
                  {fcstLoading&&(()=>{
                    const sd=fcstStepData;
                    const selectedTraders=Array.isArray(fcstTrader)?fcstTrader:[fcstTrader].filter(Boolean);
                    const traderInfo=selectedTraders.length===1?fcstTraderList.find(t=>t.code===selectedTraders[0]):null;
                    const fetchModeLabel=sd.fetched?.mode==='aggregate'?'Aggregate':sd.fetched?.mode==='raw'?'Raw fallback':'';
                    const steps=[
                      {n:1,l:'Satış Geçmişi Çekiliyor',d:sd.fetched?(sd.fetched.fromCache?`Cache'den ${sd.fetched.count?.toLocaleString('tr-TR')||0} kayıt yüklendi (${fetchModeLabel.toLowerCase()||'agg'})`:sd.fetched.mode==='aggregate'?`UAT aggregate (yıl-bazlı): ${sd.fetched.loaded||0} / ${sd.fetched.total||16} query`:`UAT raw fallback${sd.fetched.aggError?' ('+sd.fetched.aggError.slice(0,40)+'...)':''}: ${sd.fetched.loaded?.toLocaleString('tr-TR')||0}${sd.fetched.total?' / '+sd.fetched.total.toLocaleString('tr-TR'):''} satır`):'Dataverse historical sales sorgulanıyor'},
                      {n:2,l:'Aylık Aggregate',d:sd.aggregate?`${sd.aggregate.records?.toLocaleString('tr-TR')||0} satır → ${sd.aggregate.months} aylık seriye dönüştürüldü`:'Satırlar yıl-ay bazında toplanıyor'},
                      {n:3,l:'Tahmin Modelleri',d:sd.modelsRunning?`${sd.modelsRunning} koşturuluyor...`:'8 model paralel hazırlanıyor (HW, Theta, Holt\'s Linear, STL+ETS, Outlier STL+ETS, Seasonal Naive, Croston, MA-3)'},
                      {n:4,l:'Backtest MAPE',d:sd.backtest?`${sd.backtest.models} model ile holdout testi tamamlandı`:'Son 6 ay tutulup geri kalanla tahmin doğrulanıyor'},
                      {n:5,l:'Best Fit Seçimi',d:sd.bestFit?`${FORECAST_MODELS.find(m=>m.id===sd.bestFit.id)?.label} kazandı (MAPE ${sd.bestFit.mape?.toFixed(1)}%)`:'En düşük hata oranlı model seçiliyor'},
                    ];
                    return(
                      <div style={{background:'linear-gradient(135deg,rgba(45,212,160,.04),rgba(59,130,246,.04),rgba(139,92,246,.04))',border:'1px solid '+$.bdL,borderRadius:$.rL,padding:'30px 28px',position:'relative',overflow:'hidden'}}>
                        {/* Background pulse */}
                        <div style={{position:'absolute',top:-100,right:-100,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,212,160,.08),transparent 70%)',animation:'aiPulse 3s ease-in-out infinite'}}/>
                        <div style={{position:'absolute',bottom:-100,left:-100,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,.08),transparent 70%)',animation:'aiPulse 3s ease-in-out 1.5s infinite'}}/>
                        <style>{`
                          @keyframes aiPulse{0%,100%{transform:scale(.85);opacity:.4}50%{transform:scale(1.15);opacity:.8}}
                          @keyframes aiBrain{0%,100%{transform:scale(1);filter:drop-shadow(0 0 8px rgba(45,212,160,.4))}50%{transform:scale(1.08);filter:drop-shadow(0 0 18px rgba(59,130,246,.6))}}
                          @keyframes aiDot{0%,80%,100%{opacity:.2;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
                          @keyframes stepFade{0%{opacity:0;transform:translateX(-10px)}100%{opacity:1;transform:translateX(0)}}
                          .ai-step{animation:stepFade .3s ease-out both}
                        `}</style>
                        <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',marginBottom:20}}>
                          <div style={{width:84,height:84,borderRadius:24,background:'linear-gradient(135deg,#2dd4a0,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(13,110,79,.25)',animation:'aiBrain 2s ease-in-out infinite',marginBottom:14}}>
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                            </svg>
                          </div>
                          <div style={{fontSize:17,fontWeight:800,color:$.t1,letterSpacing:-.3,marginBottom:4}}>
                            TYRO AI Tahmin Motoru
                            <span style={{display:'inline-block',marginLeft:5}}>
                              <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:$.ac,margin:'0 1px',animation:'aiDot 1.4s ease-in-out infinite'}}/>
                              <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:$.blu,margin:'0 1px',animation:'aiDot 1.4s ease-in-out .2s infinite'}}/>
                              <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:$.pur,margin:'0 1px',animation:'aiDot 1.4s ease-in-out .4s infinite'}}/>
                            </span>
                          </div>
                          <div style={{fontSize:12,color:$.t3,fontWeight:500}}>
                            <strong style={{color:$.t2}}>{traderInfo?.name||(selectedTraders.length>1?`${selectedTraders.length} trader birleşik`:selectedTraders[0]||'-')}</strong> için <strong style={{color:$.t2}}>{fcstHorizon} ay</strong> ileri tahmin oluşturuluyor
                          </div>
                        </div>
                        {/* Steps */}
                        <div style={{position:'relative',maxWidth:600,margin:'0 auto',display:'flex',flexDirection:'column',gap:10}}>
                          {steps.map((s,i)=>{
                            const done=fcstStep>s.n;
                            const active=fcstStep===s.n;
                            const pending=fcstStep<s.n;
                            return(
                              <div key={s.n} className={!pending?'ai-step':''} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:active?'rgba(255,255,255,.85)':done?'rgba(45,212,160,.06)':'rgba(0,0,0,.02)',border:'1px solid '+(active?'rgba(13,110,79,.25)':done?'rgba(45,212,160,.15)':$.bdL),boxShadow:active?'0 2px 8px rgba(13,110,79,.08)':'none',transition:'all .3s',opacity:pending?.45:1}}>
                                <div style={{width:28,height:28,borderRadius:'50%',background:done?'linear-gradient(135deg,#0d6e4f,#2dd4a0)':active?'linear-gradient(135deg,#3b82f6,#8b5cf6)':$.bdL,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:active?'0 0 0 4px rgba(59,130,246,.15)':'none',transition:'all .2s'}}>
                                  {done?(
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  ):active?(
                                    <span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                                  ):(
                                    <span style={{fontSize:11,fontWeight:700,color:$.t3}}>{s.n}</span>
                                  )}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:active||done?700:600,color:active?$.t1:done?'#0d6e4f':$.t2}}>{s.l}</div>
                                  <div style={{fontSize:11,color:$.t3,fontWeight:500,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.d}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ─── Result ─── */}
                  {fcstResult&&(()=>{
                    const profile=fcstResult.profile;
                    const resultTraderCodes=fcstResult.traderCodes||[fcstResult.traderCode];
                    const isMulti=resultTraderCodes.length>1;
                    const traderInfo=!isMulti?fcstTraderList.find(t=>t.code===resultTraderCodes[0]):null;
                    const headerName=isMulti?`${resultTraderCodes.length} Trader Birleşik`:(traderInfo?.name||resultTraderCodes[0]);
                    const headerSub=isMulti?resultTraderCodes.map(c=>fcstTraderList.find(t=>t.code===c)?.label||c).join(' · '):`${resultTraderCodes[0]} · ${profile.mainGroup}`;
                    const headerInitials=isMulti?String(resultTraderCodes.length):(traderInfo?.name||resultTraderCodes[0]).split(' ').map(s=>s[0]).slice(0,2).join('').toLocaleUpperCase('tr-TR');
                    return(<>
                      {/* ─── Trader Profili ─── */}
                      <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:14,overflow:'hidden'}}>
                        <div style={{padding:'14px 18px',background:'linear-gradient(135deg,rgba(13,110,79,.04),rgba(59,130,246,.04))',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                          <div style={{width:42,height:42,borderRadius:11,background:'linear-gradient(135deg,#2dd4a0,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:isMulti?16:14,letterSpacing:.5,boxShadow:'0 3px 8px rgba(13,110,79,.2)'}}>{headerInitials}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:15,fontWeight:800,color:$.t1,letterSpacing:-.2}}>{headerName}</div>
                            <div style={{fontSize:11,color:$.t3,fontFamily:$.mo,fontWeight:600,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={headerSub}>{headerSub}</div>
                          </div>
                          <div style={{padding:'5px 11px',borderRadius:8,background:profile.intermittenceIndex>=.85?$.grnB:profile.intermittenceIndex>=.6?$.orgB:$.redB,fontSize:11,fontWeight:700,color:profile.intermittenceIndex>=.85?'#0d6e4f':profile.intermittenceIndex>=.6?'#92400e':$.red}}>
                            {profile.character}
                          </div>
                        </div>
                        <div style={{padding:'14px 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                              Son 12 Ay Toplam
                              <InfoTip title="Son 12 Ay Toplam" desc="Trader'ın geçmiş 12 aylık tüm satışlarının toplamı (kg). Bugünkü durumu gösterir." detail="Tahmin değildir — fiili gerçekleşen değerlerdir. Forecast, bu rakamın trendine göre projeksiyon yapar." iconSize={10}><span/></InfoTip>
                            </div>
                            <div style={{fontSize:18,fontWeight:800,color:$.t1,fontFamily:$.mo}}>{fmtTon(profile.lastYearTotals.qty)}</div>
                            {profile.lastYearTotals.value>0&&<div style={{fontSize:11,color:'#0d6e4f',fontWeight:700,fontFamily:$.mo,marginTop:2}}>${fmt(profile.lastYearTotals.value)}</div>}
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                              YoY Değişim
                              <InfoTip title="Year-over-Year (YoY)" desc="Yıldan yıla büyüme/daralma. Önceki 12 ayın toplamına göre son 12 ayın yüzde değişimi." detail="Trader'ın momentum'unu gösterir. Pozitif → büyüme, negatif → daralma. Mevsimselliği dengelemek için 12 ay penceresi kullanılır." formula="(son12 - önceki12) / önceki12 × 100" iconSize={10}><span/></InfoTip>
                            </div>
                            <div style={{fontSize:18,fontWeight:800,color:profile.yoy==null?$.t3:profile.yoy>=0?'#0d6e4f':$.red,fontFamily:$.mo}}>{profile.yoy==null?'—':(profile.yoy>=0?'+':'')+profile.yoy.toFixed(1)+'%'}</div>
                            <div style={{fontSize:10,color:$.t3,fontWeight:600,marginTop:2}}>Önceki 12 ay vs son 12 ay</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                              Aktivite
                              <InfoTip title="Aktivite (Intermittence Index)" desc="Geçmiş veride satış yapılan ayların yüzdesi. 100% her ay satış var demek; düşük değerler fasılalı/sezonluk akış." detail="≥85% Stabil aylık akış · 60-85% Düzensiz · <60% Lumpy/opportunistic. Düşük değerlerde Croston modeli otomatik tercih edilir." iconSize={10}><span/></InfoTip>
                            </div>
                            <div style={{fontSize:18,fontWeight:800,color:$.t1,fontFamily:$.mo}}>{(profile.intermittenceIndex*100).toFixed(0)}%</div>
                            <div style={{fontSize:10,color:$.t3,fontWeight:600,marginTop:2}}>aylarda satış var</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Top Şirketler</div>
                            <div style={{fontSize:11,color:$.t2,fontWeight:600,lineHeight:1.5}}>
                              {profile.topCompanies.slice(0,3).map(c=>`${c.name} (${c.pct.toFixed(0)}%)`).join(' · ')||'—'}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Top Ürünler</div>
                            <div style={{fontSize:11,color:$.t2,fontWeight:600,lineHeight:1.5}}>
                              {profile.topProducts.slice(0,3).map(p=>`${p.name} (${p.pct.toFixed(0)}%)`).join(' · ')||'—'}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Top Müşteriler</div>
                            <div style={{fontSize:11,color:$.t2,fontWeight:600,lineHeight:1.5}}>
                              {profile.topDestinations.slice(0,3).map(d=>`${d.name} (${d.pct.toFixed(0)}%)`).join(' · ')||'—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── Model Sekmeleri (skipped gizli, MAPE düşükten yükseğe sıralı) ─── */}
                      <div style={{position:'relative',marginBottom:14}}>
                        <div style={{display:'flex',gap:0,padding:4,background:'#f0f1f3',borderRadius:11,overflowX:'auto',flexWrap:'nowrap'}}>
                          {FORECAST_MODELS.filter(m=>{const r=fit?.results?.find(x=>x.id===m.id);return !r||!r.skipped;}).slice().sort((a,b)=>{
                            const ra=fit?.results?.find(x=>x.id===a.id);
                            const rb=fit?.results?.find(x=>x.id===b.id);
                            const ma=ra?.mape,mb=rb?.mape;
                            if(ma==null&&mb==null)return 0;
                            if(ma==null)return 1;
                            if(mb==null)return -1;
                            return ma-mb;
                          }).map(m=>{
                            const r=fit?.results?.find(x=>x.id===m.id);
                            const isBest=fit?.bestId===m.id;
                            const isActive=activeModelId===m.id;
                            return(
                              <div key={m.id} onClick={()=>setFcstActiveModel(m.id)} onMouseEnter={()=>setFcstHoverModel(m.id)} onMouseLeave={()=>setFcstHoverModel(null)} style={{padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:isActive?700:500,cursor:'pointer',background:isActive?'#fff':'transparent',color:isActive?$.t1:$.t3,boxShadow:isActive?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .15s',userSelect:'none',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6,position:'relative'}}>
                                {isBest&&<span style={{fontSize:11}}>⭐</span>}
                                {m.label}
                                {r&&r.mape!=null&&<span style={{fontSize:10,fontFamily:$.mo,color:isActive?$.blu:$.t3,fontWeight:600}}>{r.mape.toFixed(1)}%</span>}
                                <Info size={11} style={{opacity:.4,marginLeft:2}}/>
                              </div>
                            );
                          })}
                        </div>
                        {/* Hover tooltip card */}
                        {fcstHoverModel&&(()=>{
                          const m=FORECAST_MODELS.find(mm=>mm.id===fcstHoverModel);
                          if(!m)return null;
                          const r=fit?.results?.find(x=>x.id===m.id);
                          return(
                            <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:50,background:'#1a2332',color:'#fff',borderRadius:12,padding:'14px 18px',boxShadow:'0 12px 32px rgba(0,0,0,.25)',pointerEvents:'none',animation:'stepFade .15s ease-out'}}>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                                {fit?.bestId===m.id&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:'linear-gradient(135deg,#fbbf24,#f59e0b)',color:'#fff',fontWeight:800,letterSpacing:.4}}>⭐ BEST FIT</span>}
                                <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>{m.label}</span>
                                <span style={{fontSize:11,color:'#94a3b8',fontFamily:$.mo,fontWeight:600}}>{m.short}</span>
                                {r&&!r.skipped&&r.mape!=null&&<span style={{marginLeft:'auto',fontSize:11.5,padding:'3px 9px',borderRadius:6,background:r.mape<10?'rgba(45,212,160,.18)':r.mape<20?'rgba(245,166,35,.18)':'rgba(229,72,77,.18)',color:r.mape<10?'#2dd4a0':r.mape<20?'#fbbf24':'#f87171',fontFamily:$.mo,fontWeight:800}}>MAPE {r.mape.toFixed(1)}%</span>}
                              </div>
                              <div style={{fontSize:11.5,color:'#cbd5e1',lineHeight:1.55,marginBottom:8}}>{m.description}</div>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:8,paddingTop:10,borderTop:'1px solid rgba(255,255,255,.08)'}}>
                                <div>
                                  <div style={{fontSize:9.5,fontWeight:800,color:'#2dd4a0',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>✓ Güçlü Yan</div>
                                  <div style={{fontSize:10.5,color:'#cbd5e1',lineHeight:1.5}}>{m.strength}</div>
                                </div>
                                <div>
                                  <div style={{fontSize:9.5,fontWeight:800,color:'#f87171',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>✗ Zayıf Yan</div>
                                  <div style={{fontSize:10.5,color:'#cbd5e1',lineHeight:1.5}}>{m.weakness}</div>
                                </div>
                                <div>
                                  <div style={{fontSize:9.5,fontWeight:800,color:'#60a5fa',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>⮕ Ne Zaman</div>
                                  <div style={{fontSize:10.5,color:'#cbd5e1',lineHeight:1.5}}>{m.whenToUse}</div>
                                </div>
                              </div>
                              {m.formula&&<div style={{fontSize:10.5,fontFamily:$.mo,color:'#94a3b8',marginTop:8,padding:'6px 10px',background:'rgba(255,255,255,.04)',borderRadius:6}}>{m.formula}</div>}
                              {r?.skipped&&r.reason&&<div style={{fontSize:10.5,color:'#fbbf24',marginTop:6,fontStyle:'italic'}}>⚠ Bu seri için atlandı: {r.reason}</div>}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ─── Aktif Model Sonuç Paneli ─── */}
                      {activeResult&&!activeResult.skipped&&activeResult.forecast&&(()=>{
                        const fcPts=activeResult.forecast.point;
                        const fcLow=activeResult.forecast.lower;
                        const fcUp=activeResult.forecast.upper;
                        const histTotal=histArr?sumArr(histArr.slice(-12)):0;
                        const fcTotal=sumArr(fcPts);
                        const monthlyAvg=fcTotal/horizon;
                        const trendPct=histTotal>0?((fcTotal-histTotal*horizon/12)/(histTotal*horizon/12)*100):null;
                        const isSeasonalNaive=activeModelId==='snaive';
                        return(<>
                          {/* Seasonal Naive uyarı banner — neden hep YoY %0 */}
                          {isSeasonalNaive&&fit?.bestId==='snaive'&&(
                            <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',marginBottom:14,borderRadius:10,background:'linear-gradient(135deg,rgba(245,166,35,.08),rgba(245,166,35,.03))',border:'1px solid rgba(245,166,35,.25)'}}>
                              <Info size={16} color="#b45309" style={{flexShrink:0,marginTop:1}}/>
                              <div style={{flex:1,fontSize:11.5,color:'#92400e',lineHeight:1.55}}>
                                <strong>Seasonal Naive Best Fit olarak seçildi.</strong> Bu model gelecekteki her ayı doğrudan <strong>geçen yılın aynı ayındaki değer</strong> olarak verir → tanım gereği <strong>YoY %0</strong>. Trend veya değişim yansıtmaz. Bu, tahmin "düz" göründüğü için değil, bu trader'ın verisinde belirgin bir trend/anomali olmadığı için diğer modellerin (Holt-Winters, Theta vb.) bu yöntemin daha iyisini yapamadığı anlamına gelir. Trend görmek için sekmelerden <strong>Theta</strong> veya <strong>Holt's Linear</strong>'a tıklayıp inceleyebilirsiniz.
                              </div>
                            </div>
                          )}
                          {/* Özet kartlar — hover'da terim açıklaması */}
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:14}}>
                            {[
                              {l:'Aylık Ortalama Tahmin',v:fmtMetric(monthlyAvg),c:$.blu,bg:$.bluB,info:{title:'Aylık Ortalama Tahmin',desc:`Önümüzdeki ${horizon} ayın tahmin değerlerinin aritmetik ortalaması. Trader'ın tipik aylık kapasitesini gösterir.`,detail:'Toplam tahmin / horizon. Tek seferlik aşırı değerler ortalamaya yansır — uç değerler için medyan daha güvenilir olabilir.'}},
                              {l:`${horizon} Ay Toplam Tahmin`,v:fmtMetric(fcTotal),c:'#0d6e4f',bg:$.grnB,info:{title:`${horizon} Ay Toplam Tahmin`,desc:`Önümüzdeki ${horizon} ay boyunca beklenen toplam ${fcstMetric==='value'?'satış değeri':'satış miktarı'}. Modelin kümülatif öngörüsü.`,detail:`Tahmin noktalarının toplamı. Mevsimsel pikleri ve trend'i içerir. Stok/kontrat planlama için referans.`}},
                              {l:'Trend (vs son 12 ay)',v:trendPct!=null?(trendPct>=0?'+':'')+trendPct.toFixed(1)+'%':'—',c:trendPct==null?$.t3:trendPct>=0?'#0d6e4f':$.red,bg:trendPct==null?$.bdL:trendPct>=0?$.grnB:$.redB,info:{title:'Trend Değişim Oranı',desc:'Tahmin dönemi toplamının, son 12 ayın aynı süreye eşitlenmiş değerine göre yüzde değişimi.',detail:'Pozitif değer büyüme, negatif daralma sinyalidir. Mevsimsel düzeltme yapmaz — yıl üstü kıyaslamadır.',formula:'(tahmin_topl × 12/horizon) / son12 × 100 - 100'}},
                              {l:'Backtest MAPE',v:activeResult.mape!=null?activeResult.mape.toFixed(1)+'%':'—',c:activeResult.mape==null?$.t3:activeResult.mape<10?'#0d6e4f':activeResult.mape<20?$.org:$.red,bg:activeResult.mape==null?$.bdL:activeResult.mape<10?$.grnB:activeResult.mape<20?$.orgB:$.redB,info:{title:'Backtest MAPE (Hata Oranı)',desc:'Mean Absolute Percentage Error — modelin geçmiş veride yaptığı tahminlerin gerçek değerlerden ortalama yüzde sapması.',detail:'%0-10 mükemmel · %10-20 kabul edilebilir · %20+ gürültülü/güvensiz. Düşük MAPE daha güvenilir tahmin.',formula:'mean(|gerçek - tahmin| / gerçek) × 100'}},
                            ].map((k,i)=>(
                              <div key={i} style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'14px 16px',boxShadow:$.sh}}>
                                <div style={{fontSize:10,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                                  {k.l}
                                  <InfoTip title={k.info.title} desc={k.info.desc} detail={k.info.detail} formula={k.info.formula} placement="bottom" iconSize={10}><span/></InfoTip>
                                </div>
                                <div style={{fontSize:18,fontWeight:800,color:k.c,fontFamily:$.mo}}>{k.v}</div>
                              </div>
                            ))}
                          </div>

                          {/* Çizgi grafik */}
                          <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:14}}>
                            <div style={{padding:'13px 18px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,color:$.t1,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                              <BarChart3 size={15} color={$.ac}/>
                              <span>Tahmin Grafiği — {FORECAST_MODELS.find(m=>m.id===activeModelId)?.label}</span>
                              <div style={{marginLeft:'auto',display:'flex',gap:14,fontSize:11,color:$.t3,fontWeight:500}}>
                                <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:2.5,background:$.blu,display:'inline-block',borderRadius:1}}/>Geçmiş</span>
                                <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:2.5,backgroundImage:'linear-gradient(90deg,#0d6e4f 50%,transparent 50%)',backgroundSize:'4px 2.5px',display:'inline-block'}}/>Tahmin</span>
                                <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:8,background:'rgba(13,110,79,.18)',display:'inline-block',borderRadius:2}}/>Güven Bandı</span>
                              </div>
                            </div>
                            {(()=>{
                              // Geçmişi çeyreklik aggregate'e indir (görsel temizlik için), tahmin aylık kalır
                              const qKeys=[],qVals=[];
                              {
                                const map=new Map();
                                for(let i=0;i<histKeys.length;i++){
                                  const [yy,mm]=histKeys[i].split('-').map(Number);
                                  const q=Math.ceil(mm/3);
                                  const qKey=`${yy}-Q${q}`;
                                  if(!map.has(qKey))map.set(qKey,{sum:0,count:0});
                                  const r=map.get(qKey);
                                  if(histArr[i]!=null){r.sum+=histArr[i];r.count++;}
                                }
                                for(const [k,v] of map){qKeys.push(k);qVals.push(v.count>0?v.sum/v.count:0);}
                              }
                              const allKeys=[...qKeys,...forecastKeys];
                              const allHistVals=[...qVals,...new Array(horizon).fill(null)];
                              const allFcVals=[...new Array(qKeys.length).fill(null),...fcPts];
                              const allFcLow=[...new Array(qKeys.length).fill(null),...fcLow];
                              const allFcUp=[...new Array(qKeys.length).fill(null),...fcUp];
                              const histLen=qKeys.length;
                              const allValuesRaw=[...allHistVals,...allFcUp,...allFcVals].filter(v=>v!=null&&!isNaN(v));
                              const dataMax=Math.max(...allValuesRaw,1);
                              // Akıllı scale: 15% headroom — veri grafiğin ~%87'sini kaplar
                              const maxV=dataMax*1.15;
                              const minV=0;
                              const W=fcstChartW,H=380,padL=72,padR=24,padT=24,padB=70;
                              const innerW=W-padL-padR,innerH=H-padT-padB;
                              const x=i=>padL+(allKeys.length>1?i*innerW/(allKeys.length-1):innerW/2);
                              const y=v=>padT+innerH-((v-minV)/(maxV-minV))*innerH;
                              // Akıllı sayı formatı: Bin Ton, Milyon Ton, kg
                              const fmtAxis=v=>{
                                if(fcstMetric==='value'){
                                  if(v>=1e9)return '$'+(v/1e9).toFixed(1)+'B';
                                  if(v>=1e6)return '$'+(v/1e6).toFixed(1)+'M';
                                  if(v>=1e3)return '$'+(v/1e3).toFixed(0)+'K';
                                  return '$'+Math.round(v);
                                }
                                // Miktar: kg → Ton bazında göster
                                const t=v/1000;
                                if(t>=1e6)return (t/1e6).toFixed(1)+'M Ton';
                                if(t>=1e3)return (t/1e3).toFixed(1)+'K Ton';
                                if(t>=1)return Math.round(t)+' Ton';
                                return Math.round(v)+' kg';
                              };
                              const fmtTooltip=v=>fcstMetric==='value'?`$${fmt(v)}`:fmtTon(v);
                              // Catmull-Rom benzeri smooth Bezier path — ardışık nokta dizisinden geçer
                              const buildSmoothPath=(arr,xFn,yFn)=>{
                                const segs=[];let cur=null;
                                for(let i=0;i<arr.length;i++){
                                  if(arr[i]==null){if(cur){segs.push(cur);cur=null;}continue;}
                                  if(!cur)cur={pts:[]};
                                  cur.pts.push([xFn(i),yFn(arr[i])]);
                                }
                                if(cur)segs.push(cur);
                                let d='';
                                for(const seg of segs){
                                  const p=seg.pts;if(p.length===0)continue;
                                  d+=`M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
                                  if(p.length<2)continue;
                                  if(p.length===2){d+=`L${p[1][0].toFixed(1)},${p[1][1].toFixed(1)}`;continue;}
                                  for(let i=0;i<p.length-1;i++){
                                    const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p[i+1];
                                    const t=0.18;  // tension
                                    const cp1x=p1[0]+(p2[0]-p0[0])*t,cp1y=p1[1]+(p2[1]-p0[1])*t;
                                    const cp2x=p2[0]-(p3[0]-p1[0])*t,cp2y=p2[1]-(p3[1]-p1[1])*t;
                                    d+=` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
                                  }
                                }
                                return d;
                              };
                              const histPath=buildSmoothPath(allHistVals,x,y);
                              // History altına gradient alan
                              const histAreaPath=(()=>{
                                const validIdx=allHistVals.map((v,i)=>v!=null?i:null).filter(i=>i!=null);
                                if(validIdx.length<2)return '';
                                const top=validIdx.map(i=>`${x(i).toFixed(1)},${y(allHistVals[i]).toFixed(1)}`).join(' L ');
                                const baseY=y(minV);
                                return `M ${x(validIdx[0]).toFixed(1)},${baseY.toFixed(1)} L ${top} L ${x(validIdx[validIdx.length-1]).toFixed(1)},${baseY.toFixed(1)} Z`;
                              })();
                              const fcPath=buildSmoothPath(allFcVals,x,y);
                              let bandPath='';
                              const ciIdxs=allFcUp.map((v,i)=>v!=null?i:null).filter(i=>i!=null);
                              if(ciIdxs.length>0){
                                bandPath='M '+ciIdxs.map(i=>`${x(i).toFixed(1)},${y(allFcUp[i]).toFixed(1)}`).join(' L ')+' L '+ciIdxs.slice().reverse().map(i=>`${x(i).toFixed(1)},${y(allFcLow[i]).toFixed(1)}`).join(' L ')+' Z';
                              }
                              const yTicks=6;
                              const ticks=Array.from({length:yTicks+1},(_,i)=>minV+(maxV-minV)*i/yTicks);
                              // Çeyrek key → çeyreğin son ayının kısa adı + yıl ("Mar '24" gibi)
                              const chartLabel=k=>{
                                if(k.includes('-Q')){const [yy,q]=k.split('-Q');const lastMonth=+q*3;return `${MONTHS_TR[lastMonth-1].slice(0,3)} '${yy.slice(2)}`;}
                                return monthLabel(k);
                              };
                              const isHistQuarter=k=>k&&k.includes('-Q');
                              const hi=fcstHoverIdx;
                              const hoverHist=hi!=null&&hi<histLen?allHistVals[hi]:null;
                              const hoverFc=hi!=null&&hi>=histLen?allFcVals[hi]:null;
                              const hoverLow=hi!=null&&hi>=histLen?allFcLow[hi]:null;
                              const hoverUp=hi!=null&&hi>=histLen?allFcUp[hi]:null;
                              const hoverKey=hi!=null?allKeys[hi]:null;
                              // YoY: çeyrekse geçen yıl aynı çeyrek, ayyysa geçen yıl aynı ay
                              const hoverYoy=hi!=null&&allKeys[hi]?(()=>{
                                const k=allKeys[hi];
                                const cur=hoverHist??hoverFc;
                                if(cur==null)return null;
                                if(isHistQuarter(k)){
                                  const [yy,q]=k.split('-Q');
                                  const prevK=`${+yy-1}-Q${q}`;
                                  const idx=allKeys.indexOf(prevK);
                                  const ly=idx>=0?allHistVals[idx]:null;
                                  return ly!=null&&ly>0?((cur-ly)/ly*100):null;
                                }
                                // ay → geçen yıl aynı ay (önce hist quarterly, sonra forecast aylık olabilir)
                                const ly=yoyOf(k,allKeysCombined,allValsCombined);
                                return ly!=null&&ly>0?((cur-ly)/ly*100):null;
                              })():null;
                              return(
                                <div ref={fcstChartRef} style={{position:'relative',width:'100%',padding:'10px 0 6px',minHeight:380}}>
                                  <svg width={W} height={H} style={{display:'block'}} onMouseMove={e=>{
                                    const rect=e.currentTarget.getBoundingClientRect();
                                    const relX=e.clientX-rect.left;
                                    if(relX<padL||relX>W-padR)return setFcstHoverIdx(null);
                                    const idx=Math.round((relX-padL)/innerW*(allKeys.length-1));
                                    if(idx>=0&&idx<allKeys.length)setFcstHoverIdx(idx);
                                  }} onMouseLeave={()=>setFcstHoverIdx(null)}>
                                    <defs>
                                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity=".28"/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                                      </linearGradient>
                                      <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0d6e4f" stopOpacity=".28"/>
                                        <stop offset="100%" stopColor="#2dd4a0" stopOpacity=".05"/>
                                      </linearGradient>
                                      <linearGradient id="histLineGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#3b82f6"/>
                                        <stop offset="100%" stopColor="#6366f1"/>
                                      </linearGradient>
                                      <linearGradient id="fcLineGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#0d6e4f"/>
                                        <stop offset="100%" stopColor="#2dd4a0"/>
                                      </linearGradient>
                                      <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="120%">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                                        <feOffset dy="2"/>
                                        <feComponentTransfer><feFuncA type="linear" slope=".18"/></feComponentTransfer>
                                        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                                      </filter>
                                    </defs>
                                    {/* Y grid + labels */}
                                    {ticks.map((t,i)=>(
                                      <g key={i}>
                                        <line x1={padL} y1={y(t)} x2={W-padR} y2={y(t)} stroke="#eef1f6" strokeWidth="1" strokeDasharray={i===0?'':'2 4'}/>
                                        <text x={padL-10} y={y(t)+4} fontSize="11" fill="#64748b" textAnchor="end" fontWeight="600" fontFamily="-apple-system,Segoe UI,sans-serif">{fmtAxis(t)}</text>
                                      </g>
                                    ))}
                                    {/* History area gradient */}
                                    {histAreaPath&&<path d={histAreaPath} fill="url(#histGrad)" stroke="none"/>}
                                    {/* CI band */}
                                    {bandPath&&<path d={bandPath} fill="url(#ciGrad)" stroke="none"/>}
                                    {/* History line — premium with gradient + shadow */}
                                    {histPath&&<path d={histPath} fill="none" stroke="url(#histLineGrad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)"/>}
                                    {/* Forecast line (dashed) — premium with gradient + shadow */}
                                    {fcPath&&<path d={fcPath} fill="none" stroke="url(#fcLineGrad)" strokeWidth="3" strokeDasharray="7 4" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)"/>}
                                    {/* Vertical separator */}
                                    {histLen>0&&<line x1={x(histLen-1)} y1={padT} x2={x(histLen-1)} y2={H-padB} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 4" opacity=".7"/>}
                                    {histLen>0&&<text x={x(histLen-1)+5} y={padT+12} fontSize="10" fill="#64748b" fontWeight="700" fontFamily="-apple-system,Segoe UI,sans-serif">▶ TAHMİN</text>}
                                    {/* History noktaları */}
                                    {allHistVals.map((v,i)=>v!=null&&<circle key={'h'+i} cx={x(i)} cy={y(v)} r={hi===i?5.5:3.2} fill="#3b82f6" stroke="#fff" strokeWidth={hi===i?2.5:1.4}/>)}
                                    {/* Forecast noktaları */}
                                    {allFcVals.map((v,i)=>v!=null&&<circle key={'f'+i} cx={x(i)} cy={y(v)} r={hi===i?5.5:3.5} fill="#0d6e4f" stroke="#fff" strokeWidth={hi===i?2.5:1.5}/>)}
                                    {/* Hover guide line */}
                                    {hi!=null&&<line x1={x(hi)} y1={padT} x2={x(hi)} y2={H-padB} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" opacity=".6"/>}
                                    {/* X labels */}
                                    {allKeys.map((k,i)=>{
                                      const isFc=i>=histLen;
                                      const fontSize=allKeys.length>20?10:11;
                                      return(
                                        <text key={'xl'+i} x={x(i)} y={H-padB+12} fontSize={fontSize} fill={isFc?'#0d6e4f':'#64748b'} fontWeight={isFc?700:600} textAnchor="end" fontFamily="-apple-system,Segoe UI,sans-serif" transform={`rotate(-35,${x(i)},${H-padB+12})`}>{chartLabel(k)}</text>
                                      );
                                    })}
                                  </svg>
                                  {/* Hover tooltip */}
                                  {hi!=null&&hoverKey&&(
                                    <div style={{position:'absolute',top:14,left:x(hi),transform:`translateX(${hi<allKeys.length/2?'10px':'calc(-100% - 10px)'})`,pointerEvents:'none',background:'#1a2332',color:'#fff',borderRadius:10,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.18)',fontSize:11.5,minWidth:200,zIndex:10}}>
                                      <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,letterSpacing:.5,textTransform:'uppercase',marginBottom:6}}>{hi>=histLen?'Tahmin':isHistQuarter(hoverKey)?'Geçmiş (çeyrek)':'Geçmiş'} · {chartLabel(hoverKey)}</div>
                                      {hoverHist!=null&&(<>
                                        <div style={{fontSize:16,fontWeight:800,fontFamily:$.mo,color:'#fff'}}>{fmtTooltip(hoverHist)}</div>
                                        {isHistQuarter(hoverKey)&&<div style={{fontSize:10.5,color:'#94a3b8',fontFamily:$.mo,marginTop:2}}>aylık ortalama</div>}
                                      </>)}
                                      {hoverFc!=null&&(<>
                                        <div style={{fontSize:16,fontWeight:800,fontFamily:$.mo,color:'#2dd4a0'}}>{fmtTooltip(hoverFc)}</div>
                                        {hoverLow!=null&&hoverUp!=null&&<div style={{fontSize:10.5,color:'#94a3b8',fontFamily:$.mo,marginTop:2}}>Aralık: {fmtTooltip(hoverLow)} – {fmtTooltip(hoverUp)}</div>}
                                      </>)}
                                      {hoverYoy!=null&&<div style={{marginTop:5,paddingTop:5,borderTop:'1px solid rgba(255,255,255,.1)',fontSize:11,fontFamily:$.mo,fontWeight:700,color:hoverYoy>=0?'#2dd4a0':'#f87171'}}>YoY {hoverYoy>=0?'+':''}{hoverYoy.toFixed(1)}%</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* ─── Mevsim & Trend Analizi ─── */}
                          {(()=>{
                            const histKeysAll=histKeys;
                            const histArrAll=histArr||[];
                            if(histArrAll.length<12)return null;
                            // Mevsim profili: her ay için tarihsel ortalama (12 ay × N yıl ortalaması)
                            const monthAvg=Array.from({length:12},()=>({sum:0,count:0}));
                            for(let i=0;i<histArrAll.length;i++){
                              const m=+histKeysAll[i].split('-')[1]-1;
                              monthAvg[m].sum+=histArrAll[i]||0;monthAvg[m].count++;
                            }
                            const monthMeans=monthAvg.map(x=>x.count>0?x.sum/x.count:0);
                            const overallMean=monthMeans.reduce((s,v)=>s+v,0)/12;
                            const seasonality=monthMeans.map((m,i)=>({m,i,pct:overallMean>0?((m-overallMean)/overallMean*100):0}));
                            const sortedSeas=[...seasonality].sort((a,b)=>b.pct-a.pct);
                            const topMonths=sortedSeas.slice(0,3);
                            const lowMonths=sortedSeas.slice(-3).reverse();
                            // Trend gücü: lineer regresyon r²
                            const xs=histArrAll.map((_,i)=>i),ys=histArrAll;
                            const xMean2=xs.reduce((s,x)=>s+x,0)/xs.length;
                            const yMean2=ys.reduce((s,y)=>s+y,0)/ys.length;
                            let num2=0,denomX=0,denomY=0;
                            for(let i=0;i<xs.length;i++){num2+=(xs[i]-xMean2)*(ys[i]-yMean2);denomX+=(xs[i]-xMean2)**2;denomY+=(ys[i]-yMean2)**2;}
                            const r2=denomX>0&&denomY>0?(num2*num2)/(denomX*denomY):0;
                            const slope2=denomX>0?num2/denomX:0;
                            const trendDir=slope2>overallMean*0.005?'up':slope2<-overallMean*0.005?'down':'flat';
                            const trendLabel=trendDir==='up'?'Artan':trendDir==='down'?'Azalan':'Yatay';
                            // Güven seviyesi
                            const mape=activeResult?.mape;
                            const confidence=mape==null?'low':mape<10?'high':mape<20?'medium':'low';
                            const confColor=confidence==='high'?'#0d6e4f':confidence==='medium'?$.org:$.red;
                            const confBg=confidence==='high'?$.grnB:confidence==='medium'?$.orgB:$.redB;
                            const confLabel=confidence==='high'?'YÜKSEK GÜVEN':confidence==='medium'?'ORTA GÜVEN':'DÜŞÜK GÜVEN';
                            const confDesc=confidence==='high'?'Tahmin sapması düşük (<%10). Modelin geçmişteki başarısı yüksek; planlama için güvenle kullanılabilir.':confidence==='medium'?'Orta sapma (%10-20). Tahmin yön gösterir ama kesin sayı için ±%20 marj bırakın.':'Yüksek sapma (>%20). Seri çok gürültülü veya yapısal kırılma var. Tahmin sadece referans olarak kullanın.';
                            return(
                              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10,marginBottom:14}}>
                                {/* Mevsim profili */}
                                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,padding:'14px 16px'}}>
                                  <div style={{fontSize:11,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                                    Mevsim Profili
                                    <InfoTip title="Mevsim Profili" desc="Her takvim ayının tarihsel ortalamasının, genel ortalamaya göre yüzde sapması. Trader'ın hangi aylarda yoğun, hangilerinde düşük çalıştığını gösterir." detail="Pikler agro hasat dönemleri (ayçiçeği yaz, nohut sonbahar) veya tüketici takvimi (Ramazan, bayram) ile ilişkili olabilir." iconSize={10}><span/></InfoTip>
                                  </div>
                                  <div style={{display:'flex',gap:1,marginBottom:8,height:50,alignItems:'flex-end'}}>
                                    {seasonality.map(s=>{
                                      const norm=(s.m/Math.max(...monthMeans,1))*100;
                                      return(<div key={s.i} title={`${MONTHS_TR[s.i]}: ${s.pct>=0?'+':''}${s.pct.toFixed(0)}%`} style={{flex:1,height:Math.max(norm,4)+'%',background:s.pct>=10?'#0d6e4f':s.pct>=-10?'#3b82f6':$.bdL,borderRadius:'2px 2px 0 0',transition:'all .15s'}}/>);
                                    })}
                                  </div>
                                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:$.t3,fontFamily:$.mo,fontWeight:600,marginBottom:8}}>
                                    {[0,2,4,6,8,10].map(i=><span key={i}>{MONTHS_TR[i].slice(0,1)}</span>)}
                                  </div>
                                  <div style={{fontSize:11,color:$.t2,lineHeight:1.5}}>
                                    <strong style={{color:'#0d6e4f'}}>Pik aylar:</strong> {topMonths.map(m=>MONTHS_TR[m.i].slice(0,3)).join(', ')} <span style={{color:$.t3}}>(+%{topMonths[0].pct.toFixed(0)} ortalamada)</span>
                                  </div>
                                  <div style={{fontSize:11,color:$.t2,lineHeight:1.5,marginTop:3}}>
                                    <strong style={{color:$.red}}>Düşük aylar:</strong> {lowMonths.map(m=>MONTHS_TR[m.i].slice(0,3)).join(', ')} <span style={{color:$.t3}}>(%{lowMonths[0].pct.toFixed(0)} ortalamadan)</span>
                                  </div>
                                </div>
                                {/* Trend gücü */}
                                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,padding:'14px 16px'}}>
                                  <div style={{fontSize:11,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                                    Trend Analizi
                                    <InfoTip title="Trend Yönü ve Gücü" desc="Geçmiş veriye lineer regresyon uygulanarak hesaplanır. R² (determinasyon katsayısı) trend'in serideki varyansı ne kadar açıkladığını gösterir." detail="R² > 0.7 → güçlü trend · 0.3-0.7 → orta · < 0.3 → trend yok/zayıf, mevsimsellik ya da gürültü baskın." formula="R² = SSR / SST" iconSize={10}><span/></InfoTip>
                                  </div>
                                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                                    <div style={{width:48,height:48,borderRadius:12,background:trendDir==='up'?$.grnB:trendDir==='down'?$.redB:$.bdL,display:'flex',alignItems:'center',justifyContent:'center',color:trendDir==='up'?'#0d6e4f':trendDir==='down'?$.red:$.t3,fontSize:22}}>
                                      {trendDir==='up'?'↗':trendDir==='down'?'↘':'→'}
                                    </div>
                                    <div>
                                      <div style={{fontSize:18,fontWeight:800,color:trendDir==='up'?'#0d6e4f':trendDir==='down'?$.red:$.t1,fontFamily:$.mo}}>{trendLabel}</div>
                                      <div style={{fontSize:10.5,color:$.t3,fontWeight:600,marginTop:1}}>R² = {r2.toFixed(2)} · {r2>=0.7?'güçlü':r2>=0.3?'orta':'zayıf'} açıklama gücü</div>
                                    </div>
                                  </div>
                                  <div style={{height:6,borderRadius:3,background:$.bdL,overflow:'hidden',marginBottom:6}}>
                                    <div style={{height:'100%',width:Math.min(r2*100,100)+'%',background:r2>=0.7?'#0d6e4f':r2>=0.3?$.org:$.red,transition:'width .4s'}}/>
                                  </div>
                                  <div style={{fontSize:10.5,color:$.t3,lineHeight:1.5}}>{r2>=0.7?'Modeller bu trader\'da güvenle çalışır.':r2>=0.3?'Trend var ama varyans yüksek; tahmin koridor şeklinde yorumlanmalı.':'Trend belirsiz; mevsim veya gürültü baskın. Seasonal Naive sık kazanabilir.'}</div>
                                </div>
                                {/* Güven seviyesi */}
                                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,padding:'14px 16px'}}>
                                  <div style={{fontSize:11,fontWeight:700,color:$.t3,textTransform:'uppercase',letterSpacing:.5,marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                                    Tahmin Güveni
                                    <InfoTip title="Tahmin Güven Seviyesi" desc="Aktif modelin backtest MAPE değerine göre belirlenir. Geçmişte ne kadar başarılıysa, gelecek tahmininin de o kadar güvenilir olması beklenir." detail="High (<%10) · Medium (%10-20) · Low (>%20). Düşük güvende sayıları nokta tahmin değil koridor olarak yorumlayın." iconSize={10}><span/></InfoTip>
                                  </div>
                                  <div style={{display:'inline-block',padding:'5px 11px',borderRadius:7,background:confBg,fontSize:11,fontWeight:800,color:confColor,letterSpacing:.5,marginBottom:10}}>{confLabel}</div>
                                  <div style={{fontSize:11,color:$.t2,lineHeight:1.55}}>{confDesc}</div>
                                  {mape!=null&&<div style={{fontSize:10.5,color:$.t3,fontFamily:$.mo,fontWeight:600,marginTop:8,paddingTop:8,borderTop:'1px solid '+$.bdL}}>Backtest MAPE: <strong style={{color:confColor}}>{mape.toFixed(1)}%</strong></div>}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Aylık tahmin tablosu */}
                          <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:14,overflow:'hidden'}}>
                            <div style={{padding:'13px 18px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,color:$.t1,display:'flex',alignItems:'center',gap:8}}>
                              <Layers size={14} color={$.ac}/>Aylık Tahmin Detayı ({horizon} ay)
                            </div>
                            <div style={{overflowX:'auto'}}>
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                                <thead>
                                  <tr style={{background:$.bg}}>
                                    <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd}}>Ay</th>
                                    <th style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd}}>Tahmin</th>
                                    <th style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd}}>Alt - Üst</th>
                                    <th style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd}}>Geçen Yıl</th>
                                    <th style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd}}>YoY %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {forecastKeys.map((k,i)=>{
                                    const v=fcPts[i];
                                    const ly=yoyOf(k,allKeysCombined,allValsCombined);
                                    const yoy=ly!=null&&ly>0?((v-ly)/ly*100):null;
                                    return(
                                      <tr key={k} style={{borderBottom:'1px solid '+$.bdL,background:i%2?$.bg:$.bg2}}>
                                        <td style={{padding:'9px 14px',fontWeight:600,color:$.t1,fontFamily:$.mo}}>{monthLabel(k)}</td>
                                        <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:700,color:'#0d6e4f'}}>{fmtMetricShort(v)}</td>
                                        <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontSize:11,color:$.t3}}>{fmtMetricShort(fcLow[i])} – {fmtMetricShort(fcUp[i])}</td>
                                        <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontSize:11,color:$.t2}}>{ly!=null?fmtMetricShort(ly):'—'}</td>
                                        <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:700,color:yoy==null?$.t3:yoy>=0?'#0d6e4f':$.red}}>{yoy==null?'—':(yoy>=0?'+':'')+yoy.toFixed(1)+'%'}</td>
                                      </tr>
                                    );
                                  })}
                                  {/* Alt toplam */}
                                  <tr style={{background:$.acL,borderTop:'2px solid '+$.ac}}>
                                    <td style={{padding:'11px 14px',fontWeight:800,color:$.ac}}>TOPLAM</td>
                                    <td style={{padding:'11px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:800,color:'#0d6e4f'}}>{fmtMetric(sumArr(fcPts))}</td>
                                    <td colSpan={3}/>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Model karşılaştırma — genişletilmiş kart görünümü */}
                          <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,overflow:'hidden'}}>
                            <div style={{padding:'13px 18px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,color:$.t1,display:'flex',alignItems:'center',gap:8}}>
                              <ShieldAlert size={14} color={$.org}/>Model Karşılaştırma (Backtest MAPE)
                              <span style={{marginLeft:'auto',fontSize:10,color:$.t3,fontWeight:500,fontFamily:$.mo}}>
                                {Math.min(6,Math.floor(histKeys.length/6))} ay holdout · düşük MAPE = daha iyi
                              </span>
                            </div>
                            <div style={{padding:'14px 18px 16px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                              {[...fit.results].sort((a,b)=>{
                                // MAPE küçükten büyüğe; null (skipped) en sona
                                if(a.skipped&&!b.skipped)return 1;
                                if(!a.skipped&&b.skipped)return -1;
                                if(a.mape==null&&b.mape==null)return 0;
                                if(a.mape==null)return 1;
                                if(b.mape==null)return -1;
                                return a.mape-b.mape;
                              }).map(r=>{
                                const m=FORECAST_MODELS.find(mm=>mm.id===r.id);
                                const isBest=fit.bestId===r.id;
                                const mapeColor=r.mape==null?$.t3:r.mape<10?'#0d6e4f':r.mape<20?$.org:$.red;
                                const mapeBg=r.mape==null?$.bdL:r.mape<10?$.grnB:r.mape<20?$.orgB:$.redB;
                                return(
                                  <div key={r.id} onClick={()=>{if(!r.skipped)setFcstActiveModel(r.id);}} style={{padding:'12px 14px',borderRadius:10,border:'1px solid '+(isBest?'rgba(13,110,79,.3)':$.bdL),background:isBest?'linear-gradient(135deg,rgba(45,212,160,.06),rgba(59,130,246,.04))':r.skipped?'rgba(0,0,0,.02)':$.bg,cursor:r.skipped?'not-allowed':'pointer',opacity:r.skipped?.55:1,boxShadow:isBest?'0 2px 8px rgba(13,110,79,.08)':'none',transition:'all .15s'}} className={r.skipped?'':'rh'}>
                                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                                      {isBest&&<span style={{fontSize:11,padding:'2px 7px',borderRadius:5,background:'linear-gradient(135deg,#fbbf24,#f59e0b)',color:'#fff',fontWeight:800,letterSpacing:.4}}>⭐ BEST</span>}
                                      <div style={{fontSize:13,fontWeight:isBest?800:700,color:r.skipped?$.bdL:$.t1,flex:1,minWidth:0}}>{m?.label||r.id}</div>
                                      <div style={{fontFamily:$.mo,fontSize:11.5,fontWeight:800,color:mapeColor,padding:'3px 8px',borderRadius:5,background:mapeBg}}>
                                        {r.skipped?'—':r.mape!=null?'MAPE '+r.mape.toFixed(1)+'%':'MAPE —'}
                                      </div>
                                    </div>
                                    <div style={{fontSize:11,color:$.t3,fontWeight:500,marginBottom:6}}>{m?.short}</div>
                                    {r.skipped?(
                                      <div style={{fontSize:10.5,color:$.org,fontStyle:'italic',background:$.orgB,padding:'5px 9px',borderRadius:5}}>⚠ {r.reason||'Atlandı'}</div>
                                    ):(
                                      <div style={{fontSize:10.5,color:$.t2,lineHeight:1.55}}>{m?.whenToUse}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{padding:'10px 18px 14px',borderTop:'1px solid '+$.bdL,fontSize:10.5,color:$.t3,lineHeight:1.5,background:'#fafbfc'}}>
                              <strong>MAPE</strong> = Mean Absolute Percentage Error. Son {Math.min(6,Math.floor(histKeys.length/6))} ay tutulup geri kalan tarihçe ile model eğitildi, sonra saklanan aylar tahmin edildi ve gerçek değerle kıyaslandı. <strong>%0-10</strong> mükemmel · <strong>%10-20</strong> kabul edilebilir · <strong>%20+</strong> seri tahmin edilemez kadar gürültülü.
                            </div>
                          </div>
                        </>);
                      })()}
                    </>);
                  })()}
                </div>
              );
            })()}

            {/* ===== ERP VERİLERİ ===== */}
            {pg==='erp'&&(
              <div>
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                  <div style={{padding:'12px 16px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
                      <Globe size={16} color={$.ac}/>
                      <span style={{fontSize:13,fontWeight:700,color:$.t1}}>ERP Verileri</span>
                      {erpRaw.length>0&&<span style={{fontSize:11,color:$.t3,fontWeight:500}}>{erpRaw.length} kayıt · {erpFields.length} alan</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{position:'relative'}}>
                        <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:$.t3}}/>
                        <input className="fi" placeholder="Ara..." value={erpSearch} onChange={e=>setErpSearch(e.target.value)} style={{paddingLeft:28,width:180}}/>
                      </div>
                      {erpRaw.length>0&&<button className="tb-b" onClick={()=>{
                        const doIt=()=>{const ws=window.XLSX.utils.json_to_sheet(erpRaw.map(rec=>{const o={};erpFields.forEach(f=>{o[f]=rec[f]??'';});return o;}));const wb=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(wb,ws,'ERP');window.XLSX.writeFile(wb,'erp_verileri.xlsx');};
                        if(window.XLSX)doIt();else{const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=doIt;document.head.appendChild(sc);};
                      }} style={{gap:6}}>
                        <Download size={13}/>Dışarı Aktar
                      </button>}
                      {MSAL_ENABLED&&msalAccount&&<button className="tb-b pr" onClick={handleErpFetch} disabled={erpLoading} style={{gap:6}}>
                        {erpLoading?<span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>:<Database size={13}/>}
                        {erpLoading?'Çekiliyor...':'ERP Verilerini Çek'}
                      </button>}
                    </div>
                  </div>
                  {erpRaw.length===0?(
                    <div style={{padding:'60px 20px',textAlign:'center'}}>
                      <Globe size={40} color={$.t3} style={{opacity:.3,marginBottom:12}}/>
                      <div style={{fontSize:14,fontWeight:600,color:$.t2,marginBottom:6}}>Henüz ERP verisi yok</div>
                      <div style={{fontSize:12,color:$.t3,marginBottom:16}}>D365 ERP'den veri çekmek için yukarıdaki "ERP Verilerini Çek" butonuna basın</div>
                    </div>
                  ):(
                    <div style={{overflow:'auto',maxHeight:'calc(100vh - 200px)'}}>
                      {(()=>{
                        const s=erpSearch.toLowerCase();
                        const erpFiltered=s?erpRaw.filter(rec=>erpFields.some(f=>String(rec[f]||'').toLowerCase().includes(s))):erpRaw;
                        const sumQty=erpFiltered.reduce((acc,rec)=>acc+(Number(rec['mserp_qty'])||0),0);
                        const sumAmt=erpFiltered.reduce((acc,rec)=>acc+(Number(rec['mserp_amountmst'])||0),0);
                        const total=erpFiltered.length;
                        const tp=Math.ceil(total/pageSize);
                        return(<>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:$.mo}}>
                        <thead>
                          <tr style={{background:'rgba(13,110,79,.04)',position:'sticky',top:0,zIndex:5}}>
                            <th style={{padding:'8px 10px',textAlign:'left',fontWeight:700,fontSize:10,color:$.ac,borderBottom:'2px solid '+$.bdL,whiteSpace:'nowrap',position:'sticky',left:0,background:'rgba(237,241,246,.98)',zIndex:6}}>#</th>
                            {erpFields.map(f=><th key={f} style={{padding:'8px 10px',textAlign:'left',fontWeight:600,fontSize:9.5,color:f==='mserp_qty'||f==='mserp_amountmst'?$.ac:$.t2,borderBottom:'2px solid '+$.bdL,whiteSpace:'nowrap',letterSpacing:.3}}>{f.replace('mserp_','')}{f==='mserp_qty'?' (kg)':f==='mserp_amountmst'?' (₺)':''}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {erpFiltered.slice(erpPage*pageSize,(erpPage+1)*pageSize).map((rec,i)=>(
                              <tr key={i} className="rh" style={{borderBottom:'1px solid '+$.bdL}}>
                                <td style={{padding:'6px 10px',color:$.t3,fontSize:10,position:'sticky',left:0,background:'#fff',zIndex:1}}>{erpPage*pageSize+i+1}</td>
                                {erpFields.map(f=>{
                                  const v=rec[f];
                                  const isEmpty=v==null||v==='';
                                  const isSum=f==='mserp_qty'||f==='mserp_amountmst';
                                  return <td key={f} style={{padding:'6px 10px',whiteSpace:'nowrap',maxWidth:250,overflow:'hidden',textOverflow:'ellipsis',color:isEmpty?$.t3:isSum?$.ac:$.t1,opacity:isEmpty?.4:1,fontWeight:isSum?700:400}}>{isEmpty?'—':typeof v==='number'?(isSum?fN(v):v):String(v).slice(0,80)}</td>;
                                })}
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr style={{background:'rgba(13,110,79,.06)',borderTop:'2px solid '+$.ac}}>
                            <td style={{padding:'10px 10px',fontWeight:800,fontSize:10,color:$.ac,position:'sticky',left:0,background:'rgba(228,245,238,.98)',zIndex:1}}>Σ</td>
                            {erpFields.map(f=>{
                              const isQty=f==='mserp_qty';
                              const isAmt=f==='mserp_amountmst';
                              return <td key={f} style={{padding:'10px 10px',whiteSpace:'nowrap',fontWeight:isQty||isAmt?800:400,fontSize:isQty||isAmt?12:10,color:isQty?$.ac:isAmt?$.blu:$.t3}}>
                                {isQty?fN(sumQty)+' kg':isAmt?'₺'+fN(sumAmt):''}
                              </td>;
                            })}
                          </tr>
                        </tfoot>
                      </table>
                      {tp>1&&(
                        <div style={{padding:'10px 16px',borderTop:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                          <div style={{fontSize:11,color:$.t3,fontWeight:500}}>{erpPage*pageSize+1}–{Math.min((erpPage+1)*pageSize,total)} / {total} kayıt</div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <button className="tb-b" onClick={()=>setErpPage(p=>Math.max(0,p-1))} disabled={erpPage===0} style={{padding:'5px 12px',fontSize:11,opacity:erpPage===0?.4:1}}><ChevronLeft size={13}/>Önceki</button>
                            <span style={{fontSize:11,fontFamily:$.mo,fontWeight:700,color:$.t1,padding:'0 8px'}}>{erpPage+1} / {tp}</span>
                            <button className="tb-b" onClick={()=>setErpPage(p=>Math.min(tp-1,p+1))} disabled={erpPage>=tp-1} style={{padding:'5px 12px',fontSize:11,opacity:erpPage>=tp-1?.4:1}}>Sonraki<ChevronRight size={13}/></button>
                          </div>
                        </div>
                      )}</>);})()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== AYARLAR ===== */}
            {pg==='set'&&(
              <div style={{maxWidth:720}}>
                {/* AI Chatbot */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:16}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,rgba(13,110,79,.1),rgba(59,130,246,.1))',color:$.ac,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Zap size={14}/></div>
                    {'AI Chatbot (Gemini)'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{fontSize:12,color:$.t2,marginBottom:12,lineHeight:1.6}}>Google Gemini AI ile stok verilerinizi doğal dille sorgulayın. Ücretsiz API key gereklidir.</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
                      <div style={{position:'relative',flex:1}}>
                        <input type={showGeminiKey?'text':'password'} className="fi" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)}
                          placeholder="Gemini API Key" style={{width:'100%',fontSize:12,paddingRight:36}}/>
                        <div onClick={()=>setShowGeminiKey(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',cursor:'pointer',color:$.t3,transition:'color .15s'}} className="rh">
                          {showGeminiKey?<Eye size={15}/>:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>}
                        </div>
                      </div>
                      <button className="tb-b pr" onClick={()=>{localStorage.setItem('tyrowms_gemini_key',geminiKey);
                        testGeminiKey(geminiKey).then(r=>{alert(r.ok?'✅ API key geçerli — bağlantı başarılı!':'❌ Hata: '+(r.error||'Bilinmeyen hata'));});}}
                        style={{fontSize:11,padding:'8px 14px',whiteSpace:'nowrap'}}>Test Et</button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:geminiKey?'#2dd4a0':'#e5484d'}}/>
                      <span style={{fontSize:11,fontWeight:600,color:geminiKey?'#0d6e4f':'#e5484d'}}>{geminiKey?'Key girildi':'Key girilmedi'}</span>
                    </div>
                    <div style={{fontSize:10,color:$.t3,lineHeight:1.6}}>
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{color:$.blu,textDecoration:'none',fontWeight:600}}>Google AI Studio</a>'dan ücretsiz key alabilirsiniz. Key sadece bu tarayıcıda saklanır.
                    </div>
                  </div>
                </div>

                {/* Veri Yönetimi */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:16}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.bluB,color:$.blu,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Database size={14}/></div>
                    {'Veri Yönetimi'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
                      <button className="tb-b pr" onClick={()=>fR.current?.click()} style={{padding:'10px 20px',fontSize:12}}><Upload size={14}/>Excel İçe Aktar (.xlsx)</button>
                      {MSAL_ENABLED&&msalAccount&&<button className="tb-b pr" onClick={handleErpFetch} disabled={erpLoading} style={{padding:'10px 20px',fontSize:12,background:erpLoading?'#6b7280':'#0d6e4f',opacity:erpLoading?.7:1}}><Database size={14}/>{erpLoading?'Çekiliyor...':'ERP Verilerini Çek (D365)'}</button>}
                      <button className="tb-b" onClick={()=>{const hdr=HDR.join(',')+'\n';const csv=rows.map(r=>r.map(v=>typeof v==='string'?'"'+v+'"':v).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([hdr+csv],{type:'text/csv;charset=utf-8'}));a.download='TYRO_Export_'+new Date().toISOString().slice(0,10)+'.csv';a.click();}} style={{padding:'10px 20px',fontSize:12}}><Download size={14}/>CSV Dışa Aktar</button>
                    </div>
                    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                      {[{l:'Toplam Satır',v:rows.length,c:$.blu},{l:'Kolon Sayısı',v:HDR.length,c:'#0d6e4f'},{l:'Tesis',v:D.s.facilityCount,c:$.pur},{l:'Ürün',v:D.s.prodCount,c:$.org}].map((s,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:3,background:s.c}}/>
                          <span style={{fontSize:11,color:$.t3}}>{s.l}:</span>
                          <span style={{fontSize:12,fontFamily:$.mo,fontWeight:700,color:$.t1}}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Görünüm */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:16}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.purB,color:$.pur,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Palette size={14}/></div>
                    {'Görünüm'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:600,color:$.t2,marginBottom:8}}>Yaşlanma Eşikleri (gün)</div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {BK.map(b=>(
                          <div key={b.k} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:6,background:$.bg,border:'1px solid '+$.bdL}}>
                            <div style={{width:10,height:10,borderRadius:3,background:b.c}}/>
                            <span style={{fontSize:11,fontFamily:$.mo,fontWeight:600,color:$.t1}}>{b.k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:$.t2,marginBottom:8}}>Tesis Tipi Renkleri</div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {Object.entries(TI).map(([k,v])=>(
                          <div key={k} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:6,background:$.bg,border:'1px solid '+$.bdL}}>
                            <div style={{width:10,height:10,borderRadius:3,background:v.color}}/>
                            <span style={{fontSize:11,fontWeight:500,color:$.t1}}>{v.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablo Ayarları */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:16}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Layers size={14}/></div>
                    {'Tablo Ayarları'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:$.t1,marginBottom:2}}>Sayfa Başına Kayıt Sayısı</div>
                        <div style={{fontSize:10.5,color:$.t3,fontWeight:400}}>Rapor Satırları ve ERP Verileri tablolarındaki sayfalama boyutu</div>
                      </div>
                      <div style={{display:'flex',gap:4}}>
                        {[25,50,100,250,500].map(s=>(
                          <div key={s} onClick={()=>{setPageSize(s);setRawPage(0);setErpPage(0);}} style={{padding:'6px 14px',borderRadius:$.r,fontSize:12,fontFamily:$.mo,fontWeight:pageSize===s?700:500,cursor:'pointer',background:pageSize===s?$.acL:$.bg,color:pageSize===s?$.ac:$.t2,border:'1px solid '+(pageSize===s?'#b8dece':$.bdL),transition:'all .15s'}}>{s}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uygulama Bilgisi */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Info size={14}/></div>
                    {'Uygulama Bilgisi'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:'10px 0',fontSize:12}}>
                      <span style={{color:$.t3,fontWeight:600}}>Uygulama</span><span style={{fontWeight:700}}>TYRO STOCK Agent</span>
                      <span style={{color:$.t3,fontWeight:600}}>Versiyon</span><span style={{fontFamily:$.mo,fontWeight:600}}>v8.0</span>
                      <span style={{color:$.t3,fontWeight:600}}>Veri Kaynağı</span><span>TRY Inventory Aging Report</span>
                      <span style={{color:$.t3,fontWeight:600}}>Yaşlanma Metodu</span><span style={{fontFamily:$.mo,fontWeight:600}}>PurchFIFO</span>
                      <span style={{color:$.t3,fontWeight:600}}>Para Birimi</span><span>₺ TRY / $ USD</span>
                      <span style={{color:$.t3,fontWeight:600}}>Kritik Eşik</span><span style={{color:$.red,fontWeight:600}}>180+ gün</span>
                      <span style={{color:$.t3,fontWeight:600}}>Geliştirici</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:20,height:20,borderRadius:5,background:'linear-gradient(135deg,#1a3a6b,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#fff',fontSize:8,fontWeight:900}}>T</span></div>
                        <span style={{fontWeight:600}}>TTECH Business Solutions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ===== RIGHT KPI PANEL ===== */}
          {sd&&pg==='dash'&&!mob&&(
            <div className="ks" style={{width:440,flexShrink:0,background:'rgba(255,255,255,.72)',backdropFilter:'blur(20px) saturate(160%)',WebkitBackdropFilter:'blur(20px) saturate(160%)',borderLeft:'1px solid rgba(226,231,238,.4)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px 18px',borderBottom:'1px solid '+$.bd,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                <div style={{width:11,height:11,borderRadius:'50%',background:ac(sd.avgA),flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:17,color:$.t1,lineHeight:1.2}}>{sel}</div>
                  <div style={{fontSize:13,color:$.t2,fontWeight:500,marginTop:2}}>{sd.facs.length} tesis · {sd.tWh} depo</div>
                </div>
                <div onClick={()=>{setSel(null);setDrillFac(null);setDrillWh(null);setDrillL2(null);}} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh">
                  <X size={15} color={$.t2}/>
                </div>
              </div>
              <div style={{flex:1,overflow:'auto',padding:'14px 16px'}}>

                {prodData?(
                  <div>
                    {/* Breadcrumb: Şehir › Tesis › L2 › Ürünler — glass single row */}
                    {(()=>{const facName=drillFac?sd.facs.find(f=>f.id===drillFac)?.n||drillFac:sd.whs.find(w=>w.id===drillWh)?.n||drillWh;return(
                    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:16,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.85)',boxShadow:'0 2px 16px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)',borderRadius:12,overflow:'hidden'}}>
                      <div onClick={()=>setDrillL2(null)} className="rh" style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'11px 13px',borderRight:'1px solid rgba(0,0,0,0.06)',flexShrink:0,transition:'background .15s'}}>
                        <ChevronLeft size={14} color={$.blu}/><span style={{fontSize:12,fontWeight:700,color:$.blu,whiteSpace:'nowrap'}}>Geri</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',flexWrap:'wrap',minWidth:0}}>
                        <span onClick={()=>{setDrillFac(null);setDrillWh(null);setDrillL2(null);}} style={{cursor:'pointer',fontSize:11,fontWeight:600,color:$.blu,whiteSpace:'nowrap'}}>{sel}</span>
                        <ChevronRight size={10} color={$.t3}/>
                        <span onClick={()=>setDrillL2(null)} style={{cursor:'pointer',fontSize:11,fontWeight:600,color:$.blu,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{facName}</span>
                        <ChevronRight size={10} color={$.t3}/>
                        <span onClick={()=>setDrillL2(null)} style={{cursor:'pointer',fontSize:11,fontWeight:600,color:$.blu,whiteSpace:'nowrap'}}>{drillL2}</span>
                        <ChevronRight size={10} color={$.t3}/>
                        <span style={{fontSize:11,fontWeight:700,color:$.t1,whiteSpace:'nowrap'}}>Ürünler</span>
                      </div>
                    </div>);})()}
                    <div style={{fontSize:12,color:$.t2,fontWeight:600,marginBottom:10}}>{prodData.length} ürün</div>
                    {prodData.map((item,i)=>{const mxQ=prodData[0]?.q||1;return(
                      <div key={item.n} className="fu" style={{animationDelay:i*25+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'13px 15px',marginBottom:7,boxShadow:$.sh}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:8}}>
                          <span style={{fontWeight:700,fontSize:12,color:$.t1,lineHeight:1.4,wordBreak:'break-word',flex:1}}>{item.n}</span>
                          <span style={{fontSize:11,fontWeight:700,color:ac(item.a),padding:'2px 7px',borderRadius:5,background:acBg(item.a),whiteSpace:'nowrap',flexShrink:0}}>{item.a}g</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                          <span style={{fontSize:12,fontWeight:700,color:$.t1}}>{fmtTon(item.q)}</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(item.v)}</span>
                        </div>
                        <div style={{height:5,borderRadius:3,background:$.bdL,overflow:'hidden'}}><div style={{height:'100%',width:(item.q/mxQ)*100+'%',borderRadius:3,background:ac(item.a),opacity:.45}}/></div>
                      </div>);})}
                    {prodData.length===0&&<div style={{fontSize:11,color:$.t3,padding:12,textAlign:'center'}}>Bu kategoride ürün yok</div>}
                  </div>
                ):l2Data?(
                  <div>
                    {/* Breadcrumb: Şehir › Tesis/Depo › Seviye 2 — glass single row */}
                    {(()=>{const facName=drillFac?sd.facs.find(f=>f.id===drillFac)?.n||drillFac:sd.whs.find(w=>w.id===drillWh)?.n||drillWh;return(
                    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:16,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.85)',boxShadow:'0 2px 16px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)',borderRadius:12,overflow:'hidden'}}>
                      <div onClick={()=>{setDrillFac(null);setDrillWh(null);setDrillL2(null);}} className="rh" style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'11px 13px',borderRight:'1px solid rgba(0,0,0,0.06)',flexShrink:0,transition:'background .15s'}}>
                        <ChevronLeft size={14} color={$.blu}/><span style={{fontSize:12,fontWeight:700,color:$.blu,whiteSpace:'nowrap'}}>Geri</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'11px 13px',flexWrap:'wrap',minWidth:0}}>
                        <span onClick={()=>{setDrillFac(null);setDrillWh(null);setDrillL2(null);}} style={{cursor:'pointer',fontSize:11,fontWeight:600,color:$.blu,whiteSpace:'nowrap'}}>{sel}</span>
                        <ChevronRight size={10} color={$.t3}/>
                        <span style={{fontSize:11,fontWeight:700,color:$.t1,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{facName}</span>
                        <ChevronRight size={10} color={$.t3}/>
                        <span style={{fontSize:11,fontWeight:700,color:$.t1,whiteSpace:'nowrap'}}>Seviye 2</span>
                      </div>
                    </div>);})()}
                    {l2Data.map((item,i)=>{const mxQ=l2Data[0]?.q||1;return(
                      <div key={item.n} className="fu" onClick={()=>setDrillL2(item.n)} style={{animationDelay:i*30+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'13px 15px',marginBottom:7,boxShadow:$.sh,cursor:'pointer'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:8}}>
                          <span style={{fontWeight:700,fontSize:12,lineHeight:1.4,wordBreak:'break-word',flex:1}}>{item.n}</span>
                          <span style={{fontSize:11,fontWeight:700,color:ac(item.a),padding:'2px 8px',borderRadius:5,background:acBg(item.a),flexShrink:0}}>{item.a}g</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:700,color:$.t1}}>{fmtTon(item.q)}</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(item.v)}</span>
                          <ChevronRight size={12} color={$.t3} style={{marginLeft:'auto',flexShrink:0}}/>
                        </div>
                        <div style={{height:5,borderRadius:3,background:$.bdL,overflow:'hidden'}}><div style={{height:'100%',width:(item.q/mxQ)*100+'%',borderRadius:3,background:ac(item.a),opacity:.45}}/></div>
                      </div>);})}
                  </div>
                ):(
                  <div>
                    {/* Mini KPI */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Stok',v:fmtTon(sd.tQ),c:$.blu,bg:$.bluB},{l:'Değer',v:'$'+fmt(sd.tV),c:'#0d6e4f',bg:$.grnB},{l:'Depo',v:sd.tWh,c:$.pur,bg:$.purB},{l:'Ürün',v:sd.tPc,c:$.org,bg:$.orgB}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'11px 13px'}}>
                          <div style={{fontSize:10,color:$.t2,textTransform:'uppercase',fontWeight:700,letterSpacing:.8}}>{k.l}</div>
                          <div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:$.mo,marginTop:3}}>{k.v}</div>
                        </div>))}
                    </div>
                    {/* FIFO aging bar */}
                    <div style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'11px 13px',marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:10,color:$.t3,fontWeight:700}}>FIFO YAŞLANMA</span>
                        <span style={{fontSize:17,fontFamily:$.mo,fontWeight:700,color:ac(sd.avgA)}}>{sd.avgA} gün</span>
                      </div>
                      <div style={{height:6,borderRadius:3,background:$.bdL,overflow:'hidden'}}>
                        <div style={{height:'100%',width:Math.min(100,(sd.avgA/500)*100)+'%',borderRadius:3,background:'linear-gradient(90deg,#0d6e4f,'+ac(sd.avgA)+')'}}/>
                      </div>
                    </div>
                    {/* Aging distribution */}
                    <div style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'10px 12px',marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:$.t3,marginBottom:7}}>YAŞLANMA ARALIĞI</div>
                      <AgBar ag={sd.cityAg} total={sd.tQ}/>
                    </div>
                    {/* Facility type */}
                    <div style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'10px 12px',marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:$.t3,marginBottom:7}}>TESİS TİPİ</div>
                      <TypeBar facs={sd.facs} total={sd.tQ}/>
                    </div>
                    {/* Tabs */}
                    <div style={{display:'flex',gap:4,marginBottom:10}}>
                      {[{id:'f',l:'Tesisler'},{id:'w',l:'Depolar'}].map(t=>(
                        <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'7px',borderRadius:$.r,fontSize:11,fontWeight:600,textAlign:'center',cursor:'pointer',background:tab===t.id?$.acL:$.bg,color:tab===t.id?$.ac:$.t3,border:'1px solid '+(tab===t.id?'#b8dece':$.bdL)}}>{t.l}</div>))}
                    </div>
                    {tab==='f'&&sd.facs.sort((a,b)=>b.q-a.q).map((f,i)=>{const ti=TI[f.type]||TI.dis;return(
                      <div key={f.id} className="fu" onClick={()=>{setDrillFac(f.id);setDrillWh(null);setDrillL2(null);}} style={{animationDelay:i*30+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'12px 14px',marginBottom:6,position:'relative',overflow:'hidden',boxShadow:$.sh,cursor:'pointer'}}>
                        <div style={{position:'absolute',top:0,left:0,bottom:0,width:3,background:ti.color,opacity:.6}}/>
                        <div style={{paddingLeft:10,fontWeight:700,fontSize:12,marginBottom:6,wordBreak:'break-word',lineHeight:1.4}}>{f.n}</div>
                        <div style={{display:'flex',gap:8,paddingLeft:10,alignItems:'center',flexWrap:'wrap'}}>
                          <span style={{fontSize:12,fontWeight:700,color:$.t1}}>{fmtTon(f.q)}</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(f.v)}</span>
                          <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:ac(f.a),padding:'2px 7px',borderRadius:5,background:acBg(f.a)}}>{f.a}g</span>
                          <ChevronRight size={13} color={$.t3}/>
                        </div>
                      </div>);})}
                    {tab==='w'&&sd.whs.sort((a,b)=>b.q-a.q).map((w,i)=>(
                      <div key={w.id+i} className="fu" onClick={()=>{setDrillWh(w.id);setDrillFac(null);setDrillL2(null);}} style={{animationDelay:i*25+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'12px 14px',marginBottom:6,cursor:'pointer',boxShadow:$.sh}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:6,marginBottom:6}}>
                          <span style={{fontWeight:700,fontSize:12,flex:1,color:$.t1,wordBreak:'break-word',lineHeight:1.4}}>{w.n}</span>
                          <span style={{fontSize:11,fontWeight:700,color:ac(w.a),padding:'2px 7px',borderRadius:5,background:acBg(w.a),flexShrink:0}}>{w.a}g</span>
                          <ChevronRight size={12} color={$.t3} style={{flexShrink:0,marginTop:2}}/>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:5,borderRadius:3,background:$.bdL,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(100,(w.q/(sd.whs[0]?.q||1))*100)+'%',borderRadius:3,background:ac(w.a),opacity:.45}}/></div>
                          <span style={{fontSize:11,color:$.t1,fontWeight:700}}>{fmtTon(w.q)}</span>
                          <span style={{fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(w.v)}</span>
                        </div>
                      </div>))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== YÖNETİM RIGHT DRAWER ===== */}
          {yonDetail&&pg==='yon'&&(
            <div style={{width:mob?'100%':440,flexShrink:0,background:'rgba(255,255,255,.82)',backdropFilter:'blur(24px) saturate(160%)',WebkitBackdropFilter:'blur(24px) saturate(160%)',borderLeft:mob?'none':'1px solid rgba(226,231,238,.4)',display:'flex',flexDirection:'column',overflow:'hidden',position:mob?'absolute':'relative',top:mob?0:undefined,right:mob?0:undefined,bottom:mob?0:undefined,zIndex:mob?40:undefined,height:mob?'100%':undefined}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                <div onClick={()=>setYonDetail(null)} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(13,110,79,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh"><ChevronLeft size={16} color={$.ac}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:$.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{yonDetail.name}</div>
                  {yonDetail.badge&&<div style={{fontSize:12,color:yonDetail.badgeC||$.t2,fontWeight:600,marginTop:2}}>{yonDetail.badge}</div>}
                </div>
                <div onClick={()=>setYonDetail(null)} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh"><X size={15} color={$.t2}/></div>
              </div>
              <div style={{flex:1,overflow:'auto',padding:'14px 16px'}}>
                {yonDetail.type==='company'&&(()=>{
                  const c=yonDetail.data;const cRows=gRows.filter(r=>(r[1]||r[0])===c.n);
                  const byFac={};cRows.forEach(r=>{const s=r[10]||r[9];if(!byFac[s])byFac[s]={n:s,q:0,v:0,td:0,tq:0};byFac[s].q+=r[8];byFac[s].v+=r[8]*r[25];byFac[s].td+=r[8]*r[27];byFac[s].tq+=r[8];});
                  const facs=Object.values(byFac).map(s=>({...s,a:s.tq>0?Math.round(s.td/s.tq):0})).sort((a,b)=>b.v-a.v);
                  return(<div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Toplam Stok',v:fmtTon(c.q),c:$.blu},{l:'Toplam Değer',v:'$'+fmt(c.v),c:'#0d6e4f'},{l:'Ort. Yaş',v:c.a+' gün',c:ac(c.a)},{l:'Ürün Sayısı',v:c.pc,c:$.pur}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                          <div style={{fontSize:15,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>Tesis Dağılımı ({facs.length})</div>
                    {facs.map((f,i)=>(
                      <div key={f.n} onClick={()=>{setPg('dash');setDrillFac(f.n);setYonDetail(null);}} style={{padding:'9px 0',borderBottom:i<facs.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} className="rh">
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(f.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f'}}>${fmt(f.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a)}}>{f.a}g</span>
                        <ChevronRight size={13} color={$.t2}/>
                      </div>))}
                  </div>);
                })()}
                {yonDetail.type==='facility'&&(()=>{
                  const f=yonDetail.data;const fRows=gRows.filter(r=>r[9]===f.id);
                  const byProd={};fRows.forEach(r=>{const n=r[3];if(!byProd[n])byProd[n]={n,q:0,v:0,td:0,tq:0};byProd[n].q+=r[8];byProd[n].v+=r[8]*r[25];byProd[n].td+=r[8]*r[27];byProd[n].tq+=r[8];});
                  const prods=Object.values(byProd).map(p=>({...p,a:p.tq>0?Math.round(p.td/p.tq):0})).sort((a,b)=>b.v-a.v).slice(0,15);
                  return(<div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Stok',v:fmtTon(f.q),c:$.blu},{l:'Değer',v:'$'+fmt(f.v),c:'#0d6e4f'},{l:'Ort. Yaş',v:f.a+' gün',c:ac(f.a)},{l:'Depo',v:f.wc,c:$.pur}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                          <div style={{fontSize:15,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>Ürün Dağılımı</div>
                    {prods.map((p,i)=>(
                      <div key={p.n} style={{padding:'8px 0',borderBottom:i<prods.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(p.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f'}}>${fmt(p.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(p.a),padding:'2px 7px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>
                      </div>))}
                  </div>);
                })()}
                {yonDetail.type==='l2'&&(()=>{
                  const l=yonDetail.data;const lRows=gRows.filter(r=>(r[17]||'Diğer')===l.n);
                  const byFac={};lRows.forEach(r=>{const s=r[10]||r[9];if(!byFac[s])byFac[s]={n:s,q:0,v:0,td:0,tq:0};byFac[s].q+=r[8];byFac[s].v+=r[8]*r[25];byFac[s].td+=r[8]*r[27];byFac[s].tq+=r[8];});
                  const facs=Object.values(byFac).map(f=>({...f,a:f.tq>0?Math.round(f.td/f.tq):0})).sort((a,b)=>b.q-a.q);
                  return(<div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Toplam Stok',v:fmtTon(l.q),c:$.blu},{l:'Toplam Değer',v:'$'+fmt(l.v),c:'#0d6e4f'},{l:'Ort. Yaş',v:l.a+' gün',c:ac(l.a)}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'8px 10px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:2}}>{k.l}</div>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>Tesis Dağılımı ({facs.length})</div>
                    {facs.map((f,i)=>(
                      <div key={f.n} style={{padding:'8px 0',borderBottom:i<facs.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(f.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#0d6e4f'}}>${fmt(f.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a)}}>{f.a}g</span>
                      </div>))}
                  </div>);
                })()}
                {yonDetail.type==='critical'&&(()=>{
                  const{critQty,critVal,critProds}=yonData;
                  return(<div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Kritik Stok',v:fmtTon(critQty),c:'#e5484d'},{l:'Kritik Değer',v:'$'+fmt(critVal),c:'#ea580c'},{l:'Ürün',v:critProds.length,c:$.pur}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'8px 10px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:2}}>{k.l}</div>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>365+ Gün Ürünler</div>
                    {critProds.map((p,i)=>(
                      <div key={p.n} style={{padding:'8px 0',borderBottom:i<critProds.length-1?'1px solid '+$.bdL:'none',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(p.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:'#e5484d'}}>${fmt(p.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:ac(p.a),padding:'2px 7px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>
                      </div>))}
                  </div>);
                })()}
              </div>
            </div>
          )}

          {/* ===== EM RIGHT DRAWER (Harita sayfası + Dashboard dünya modu) ===== */}
          {(emSel==='__global__'||emSD)&&pg==='dash'&&dashMapMode==='world'&&!mob&&(()=>{
            const emFacName=DW.f.find(f=>f.id===(emDrillFac||emDrillWh))?.n||(emDrillFac||emDrillWh);
            const GBC=({children})=><div style={{display:'flex',alignItems:'center',gap:0,marginBottom:14,background:'rgba(255,255,255,0.65)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.85)',boxShadow:'0 2px 12px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.9)',borderRadius:12,overflow:'hidden',flexWrap:'wrap'}}>{children}</div>;
            const BCBack=({onClick})=><div onClick={onClick} className="rh" style={{display:'flex',alignItems:'center',gap:4,padding:'10px 13px',cursor:'pointer',borderRight:'1px solid rgba(0,0,0,0.06)',flexShrink:0,transition:'background .15s'}}><ChevronLeft size={14} color={$.blu}/><span style={{fontSize:12,fontWeight:700,color:$.blu}}>Geri</span></div>;
            const BCItem=({label,onClick,active})=><><span className={onClick?'rh':''} style={{cursor:onClick?'pointer':'default',color:onClick?$.blu:$.t1,fontWeight:active?600:500,padding:'2px 0'}} onClick={onClick||undefined}>{label}</span><ChevronRight size={10} color={$.t3} style={{flexShrink:0}}/></>;
            const isGlobal=emSel==='__global__';
            // Seviye belirle: global → ülke → tesis → l2 → ürün
            const level=isGlobal?'global':emProdData?'product':emL2Data?'l2':(emSD?'country':null);
            return(
            <div style={{width:440,flexShrink:0,background:'rgba(255,255,255,.82)',backdropFilter:'blur(24px) saturate(160%)',WebkitBackdropFilter:'blur(24px) saturate(160%)',borderLeft:'1px solid rgba(226,231,238,.4)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontWeight:700,fontSize:17,color:$.t1,lineHeight:1.2}}>{isGlobal?'Küresel Operasyonlar':emSel}</div>
                  <div style={{fontSize:13,color:$.t2,fontWeight:500,marginTop:2}}>{isGlobal?DW.countries.length+' ülke · '+DW.s.facilityCount+' tesis':emSD?.facs.length+' tesis · '+emSD?.tWh+' depo'}</div>
                </div>
                <div onClick={()=>{setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}} style={{cursor:'pointer',width:30,height:30,borderRadius:8,background:'rgba(0,0,0,.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s'}} className="rh"><X size={15} color={$.t2}/></div>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>

                {/* ── GLOBAL: Ülke listesi ── */}
                {level==='global'&&(
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                      {[{l:'Toplam Stok',v:fmtTon(DW.s.totalQty),c:$.blu},{l:'Toplam Değer',v:'$'+fmt(DW.s.totalVal),c:'#0d6e4f'},{l:'Ort. Yaş',v:DW.s.avgAge+' gün',c:ac(DW.s.avgAge)}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                          <div style={{fontSize:16,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:$.t1,marginBottom:8}}>Ülke Bazlı Kırılım ({DW.countries.length})</div>
                    {[...DW.countries].sort((a,b)=>b.q-a.q).map(c=>(
                      <div key={c.n} onClick={()=>{setEmSel(c.n);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setEmTab('f');}} style={{padding:'10px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}} className="rh">
                        <div style={{width:8,height:8,borderRadius:4,background:ac(c.a),flexShrink:0}}/>
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(c.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(c.a),padding:'2px 7px',borderRadius:4,background:acBg(c.a)}}>{c.a}g</span>
                        <span style={{fontSize:10,color:$.t2}}>{c.fc}</span>
                        <ChevronRight size={13} color={$.t2}/>
                      </div>))}
                  </div>
                )}

                {/* ── ÜLKE: Tesis/Depo listesi ── */}
                {level==='country'&&emSD&&(
                  <div>
                    <GBC>
                      <BCBack onClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'10px 13px',fontSize:12,color:$.t2,fontWeight:500}}>
                        <BCItem label="Küresel" onClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                        <span style={{color:$.t1,fontWeight:600}}>{emSel}</span>
                      </div>
                    </GBC>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                      {[{l:'Stok',v:fmtTon(emSD.tQ),c:$.blu},{l:'Değer',v:'$'+fmt(emSD.tV),c:'#0d6e4f'},{l:'Depo',v:emSD.tWh,c:$.pur},{l:'Ürün',v:emSD.tPc,c:$.org}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,borderRadius:8,padding:'10px 12px',border:'1px solid '+$.bdL}}>
                          <div style={{fontSize:10,color:$.t2,fontWeight:600,marginBottom:3}}>{k.l}</div>
                          <div style={{fontSize:16,fontWeight:700,fontFamily:$.mo,color:k.c}}>{k.v}</div>
                        </div>))}
                    </div>
                    <div style={{marginBottom:14}}><SegBar ag={emSD.countryAg} total={emSD.tQ} h={10} rd={5}/><div style={{textAlign:'center',marginTop:4,fontSize:11,fontFamily:$.mo,fontWeight:700,color:ac(emSD.avgA)}}>{emSD.avgA} gün ort.</div></div>
                    <div style={{display:'flex',gap:4,marginBottom:12,background:$.bg,borderRadius:8,padding:3}}>
                      {[{id:'f',l:'Tesisler'},{id:'w',l:'Depolar'}].map(t=>(
                        <div key={t.id} onClick={()=>setEmTab(t.id)} style={{flex:1,textAlign:'center',padding:'7px 0',borderRadius:6,fontSize:12,fontWeight:emTab===t.id?700:500,cursor:'pointer',background:emTab===t.id?'#fff':'transparent',color:emTab===t.id?$.t1:$.t2,boxShadow:emTab===t.id?'0 1px 3px rgba(0,0,0,.08)':'none',transition:'all .2s'}}>{t.l}</div>))}
                    </div>
                    {emTab==='f'&&emSD.facs.sort((a,b)=>b.q-a.q).map(f=>(
                      <div key={f.id} onClick={()=>{setEmDrillFac(f.id);setEmDrillWh(null);setEmDrillL2(null);}} style={{padding:'9px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'flex-start',gap:8,border:'1px solid '+$.bdL,borderLeft:'3px solid '+(TI[f.type]?.color||$.t3)}} className="rh">
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,wordBreak:'break-word',lineHeight:1.4}}>{f.n||f.id}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2,whiteSpace:'nowrap',flexShrink:0}}>{fmtTon(f.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f',whiteSpace:'nowrap',flexShrink:0}}>${fmt(f.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(f.a),padding:'2px 7px',borderRadius:4,background:acBg(f.a),whiteSpace:'nowrap',flexShrink:0}}>{f.a}g</span>
                        <ChevronRight size={13} color={$.t2} style={{flexShrink:0,marginTop:2}}/>
                      </div>))}
                    {emTab==='w'&&emSD.whs.sort((a,b)=>b.q-a.q).map(w=>(
                      <div key={w.id} onClick={()=>{setEmDrillWh(w.id);setEmDrillFac(null);setEmDrillL2(null);}} style={{padding:'9px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'flex-start',gap:8,border:'1px solid '+$.bdL}} className="rh">
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,minWidth:0,wordBreak:'break-word',lineHeight:1.4}}>{w.n||w.id}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2,whiteSpace:'nowrap',flexShrink:0}}>{fmtTon(w.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(w.a),padding:'2px 7px',borderRadius:4,background:acBg(w.a),whiteSpace:'nowrap',flexShrink:0}}>{w.a}g</span>
                        <ChevronRight size={13} color={$.t2} style={{flexShrink:0,marginTop:2}}/>
                      </div>))}
                  </div>
                )}

                {/* ── L2: Seviye 2 listesi ── */}
                {level==='l2'&&(
                  <div>
                    <GBC>
                      <BCBack onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);}}/>
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'10px 13px',fontSize:12,color:$.t2,fontWeight:500,flexWrap:'wrap'}}>
                        <BCItem label="Küresel" onClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                        <BCItem label={emSel} onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                        <span style={{color:$.t1,fontWeight:600}}>{emFacName}</span>
                      </div>
                    </GBC>
                    <div style={{fontSize:12,color:$.t2,fontWeight:600,marginBottom:8}}>{emL2Data.length} kategori</div>
                    {emL2Data.map(l=>(
                      <div key={l.n} onClick={()=>setEmDrillL2(l.n)} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,cursor:'pointer',display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}} className="rh">
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(l.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(l.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(l.a),padding:'2px 7px',borderRadius:4,background:acBg(l.a)}}>{l.a}g</span>
                        <ChevronRight size={13} color={$.t2}/>
                      </div>))}
                  </div>
                )}

                {/* ── ÜRÜN: Ürün listesi ── */}
                {level==='product'&&(
                  <div>
                    <GBC>
                      <BCBack onClick={()=>setEmDrillL2(null)}/>
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'10px 13px',fontSize:12,color:$.t2,fontWeight:500,flexWrap:'wrap'}}>
                        <BCItem label="Küresel" onClick={()=>{setEmSel('__global__');setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                        <BCItem label={emSel} onClick={()=>{setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);}}/>
                        <BCItem label={emFacName} onClick={()=>setEmDrillL2(null)}/>
                        <span style={{color:$.t1,fontWeight:600}}>{emDrillL2}</span>
                      </div>
                    </GBC>
                    <div style={{fontSize:12,color:$.t2,fontWeight:600,marginBottom:8}}>{emProdData.length} ürün</div>
                    {emProdData.map(p=>(
                      <div key={p.n} style={{padding:'9px 10px',borderRadius:8,marginBottom:4,display:'flex',alignItems:'center',gap:8,border:'1px solid '+$.bdL}}>
                        <span style={{fontSize:12,fontWeight:600,color:$.t1,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.n}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:$.t2}}>{fmtTon(p.q)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,color:'#0d6e4f'}}>${fmt(p.v)}</span>
                        <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(p.a),padding:'2px 7px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>
                      </div>))}
                  </div>
                )}

              </div>
            </div>);
          })()}

        </div>
      </div>
      {/* MOBILE BOTTOM NAV */}
      {mob&&<>
        {mobMenu&&<div style={{position:'fixed',inset:0,zIndex:1099}} onClick={()=>setMobMenu(false)}/>}
        <div style={{position:'fixed',bottom:12,left:12,right:12,zIndex:1100,background:'rgba(255,255,255,.92)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',borderRadius:22,boxShadow:'0 4px 24px rgba(0,0,0,.1), 0 0 0 1px rgba(226,231,238,.4)',padding:'6px 8px',display:'flex',alignItems:'center',justifyContent:'space-around'}}>
          {[{id:'dash',icon:BarChart3,label:'Dashboard'},{id:'ana',icon:Activity,label:'Risk Radarı'},{id:'yon',icon:Briefcase,label:'AI | İçgörüler'}].map(p=>{const isA=pg===p.id;return(
            <button key={p.id} className={'bnav-btn'+(isA?' active':'')} onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setMobMenu(false);}}>
              <div style={{width:36,height:36,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:isA?'rgba(13,110,79,.1)':'transparent',transition:'all .2s'}}><p.icon size={20} strokeWidth={isA?2.2:1.6}/></div>
              <span>{p.label}</span>
            </button>);})}
          {/* Three-dot menu */}
          <div style={{position:'relative'}}>
            <button className={'bnav-btn'+(['rep','sto','fcst','raw','erp','set'].includes(pg)?' active':'')} onClick={()=>setMobMenu(m=>!m)}>
              <div style={{width:36,height:36,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:mobMenu||['rep','sto','fcst','raw','erp','set'].includes(pg)?'rgba(13,110,79,.1)':'transparent',transition:'all .2s'}}><MoreHorizontal size={20} strokeWidth={['rep','sto','fcst','raw','erp','set'].includes(pg)?2.2:1.6}/></div>
              <span>Diğer</span>
            </button>
            {mobMenu&&<div style={{position:'absolute',bottom:'100%',right:-8,marginBottom:12,background:'rgba(255,255,255,.96)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(226,231,238,.4)',padding:'6px',minWidth:180,animation:'mobMenuUp .2s ease'}}>
              {[{id:'rep',icon:FileBarChart,label:'Kırılım Raporu'},{id:'sto',icon:Package,label:'Stok Raporu'},{id:'fcst',icon:TrendingUp,label:'Satış Tahmini'},{id:'raw',icon:Database,label:'ERP Veriler'},{id:'erp',icon:Database,label:'Ham Veriler'},{id:'set',icon:Settings,label:'Ayarlar'}].map(p=>{const isA=pg===p.id;return(
                <div key={p.id} onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setAnaDetail(null);setYonDetail(null);setEmSel(null);setEmDrillFac(null);setEmDrillWh(null);setEmDrillL2(null);setMobMenu(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,cursor:'pointer',background:isA?'rgba(13,110,79,.07)':'transparent',color:isA?$.ac:$.t1,fontWeight:isA?600:500,fontSize:13,transition:'all .15s'}} className="rh">
                  <p.icon size={17} strokeWidth={isA?2.2:1.6}/>{p.label}
                  {p.id==='raw'&&rows.length>0&&<span style={{marginLeft:'auto',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:6,background:$.blu,color:'#fff'}}>{rows.length}</span>}
                </div>);})}
            </div>}
          </div>
        </div>
      </>}
      {/* Fixed tooltip for KPI info */}
      {hovTip&&pg==='dash'&&(()=>{const tips2=[
        'Tüm tesislerdeki toplam envanter miktarı (kg). Formül: Σ Miktar (tüm satırlar)',
        'Envanterin USD cinsinden toplam değeri. Formül: Σ (Miktar × Birim Fiyat $)',
        'Aktif tesis ve depo sayısı. Benzersiz Tesis Kodu ve Depo Kodu sayımı',
        'Stokta bulunan benzersiz ürün (Ürün Adı) sayısı. Ürün çeşitliliği göstergesi',
        'Miktar ağırlıklı ortalama yaşlanma. Formül: Σ(Miktar × PurchFIFO) / Σ Miktar',
        '180 gün ve üzeri PurchFIFO değerine sahip stoklar. Fire ve değer kaybı riski taşır. Oran: Kritik Miktar / Toplam Miktar × 100',
      ];return(
        <div style={{position:'fixed',top:hovTip.y,left:hovTip.x,transform:'translateX(-50%)',width:250,padding:'13px 15px',background:$.bg2,border:'1px solid '+$.bd,borderRadius:$.rM,boxShadow:'0 8px 32px rgba(0,0,0,.15)',zIndex:9999,fontSize:11.5,lineHeight:1.65,color:$.t2,fontWeight:400,pointerEvents:'none'}}>
          <div style={{position:'absolute',top:-6,left:'50%',marginLeft:-6,width:12,height:12,background:$.bg2,border:'1px solid '+$.bd,borderBottom:'none',borderRight:'none',transform:'rotate(45deg)'}}/>
          {tips2[hovTip.i]}
        </div>);})()}

      {/* ═══════ AI CHATBOT ═══════ */}
      {/* Chat panel — premium glassmorphism */}
      {chatOpen&&<div onClick={()=>setChatOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.12)',zIndex:998,backdropFilter:'blur(2px)'}}/>}
      <div style={{position:'fixed',top:mob?0:12,right:mob?0:12,bottom:mob?0:12,width:mob?'100%':400,
        background:'rgba(255,255,255,.92)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',
        borderRadius:mob?0:24,border:'1px solid rgba(255,255,255,.6)',
        boxShadow:'-12px 0 40px rgba(0,0,0,.08),0 0 0 1px rgba(0,0,0,.04)',
        zIndex:999,transform:chatOpen?'translateX(0)':'translateX(calc(100% + 24px))',transition:'transform .35s cubic-bezier(.16,1,.3,1)',
        display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Header — gradient accent + avatar */}
        <div style={{position:'relative',padding:'16px 18px 14px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#2dd4a0,#3b82f6,#8b5cf6)',borderRadius:'24px 24px 0 0'}}/>
          <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#2dd4a0,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(45,212,160,.2)'}}>
            <svg width="20" height="20" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.52,68.93v33.41s-.28,6.49,3.59,4.28c10.49-6.21,21.95-12.7,26.51-15.05,9.39-4.69,8.01-10.49,8.01-10.49V48.77c0-8.42-5.8-4.69-5.8-4.69l-28.16,16.15s-4.14,2.35-4.14,8.7Z" fill="rgba(255,255,255,.85)"/>
              <path d="M97.77,70.17v40.31s1.52,10.91-7.45,15.88l-25.68,15.19s-6.9,3.31-6.49-2.76l1.66-48.73,37.96-19.88Z" fill="rgba(255,255,255,.6)"/>
              <path d="M58.15,137.95V66.72s-1.52-13.67,18.5-24.99l54.94-31.61s5.8-3.59,5.8,4.69V47.12s1.52,5.8-8.01,10.49c-9.53,4.69-47.9,27.61-47.9,27.61,0,0-23.33,11.87-23.33,52.74Z" fill="#fff"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:$.t1,letterSpacing:-.2}}>TYRO AI</div>
            <div style={{fontSize:10,color:$.t3,fontWeight:500}}>Stok yaşlandırma analiz asistanı</div>
          </div>
          {chatMsgs.length>0&&<div onClick={()=>setChatMsgs([])} style={{cursor:'pointer',fontSize:9.5,fontWeight:600,color:$.t3,padding:'4px 10px',borderRadius:8,background:'rgba(0,0,0,.04)',border:'1px solid rgba(0,0,0,.06)',transition:'all .15s'}} className="rh">Temizle</div>}
          <div onClick={()=>setChatOpen(false)} style={{cursor:'pointer',width:28,height:28,borderRadius:10,background:'rgba(0,0,0,.04)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}} className="rh"><X size={14} color={$.t2}/></div>
        </div>

        {/* Mesaj listesi */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:12}}>
          {!geminiKey&&<div style={{padding:'20px',borderRadius:16,background:'linear-gradient(135deg,rgba(245,166,35,.06),rgba(245,166,35,.02))',border:'1px solid rgba(245,166,35,.15)',textAlign:'center'}}>
            <div style={{width:36,height:36,borderRadius:12,background:'rgba(245,166,35,.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}><AlertTriangle size={18} color="#b45309"/></div>
            <div style={{fontSize:13,fontWeight:700,color:'#92400e',marginBottom:4}}>API Key Gerekli</div>
            <div style={{fontSize:11,color:'#a16207',lineHeight:1.5}}>Ayarlar → AI Chatbot bölümünden<br/>Gemini API key girin.</div>
          </div>}

          {chatMsgs.length===0&&geminiKey&&<div style={{textAlign:'center',padding:'40px 24px'}}>
            <div style={{width:48,height:48,borderRadius:16,background:'linear-gradient(135deg,rgba(45,212,160,.1),rgba(59,130,246,.1))',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d6e4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:$.t1,marginBottom:6}}>Nasıl yardımcı olabilirim?</div>
            <div style={{fontSize:12,color:$.t3,lineHeight:1.6,marginBottom:20}}>Stok yaşlandırma verilerinizi analiz<br/>edebilir, öneriler sunabilirim.</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {['Toplam stok durumu nedir?','En yaşlı tesisi analiz et','Kritik stok için aksiyon öner','Ülke bazlı dağılımı özetle'].map((q,i)=>(
                <div key={i} onClick={()=>{setChatInput(q);}} style={{padding:'10px 14px',borderRadius:12,background:'rgba(0,0,0,.03)',border:'1px solid rgba(0,0,0,.04)',fontSize:11.5,fontWeight:500,color:$.t2,cursor:'pointer',textAlign:'left',transition:'all .15s'}} className="rh">{q}</div>
              ))}
            </div>
          </div>}

          {chatMsgs.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',gap:8,alignItems:'flex-end'}}>
              {m.role==='model'&&<div style={{width:24,height:24,borderRadius:8,background:'linear-gradient(135deg,#2dd4a0,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2"/></svg>
              </div>}
              <div style={{maxWidth:'80%',padding:'11px 15px',
                borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                background:m.role==='user'?'linear-gradient(135deg,#0d6e4f,#2563EB)':'rgba(255,255,255,.8)',
                border:m.role==='model'?'1px solid rgba(0,0,0,.06)':'none',
                boxShadow:m.role==='model'?'0 1px 4px rgba(0,0,0,.04)':'0 2px 8px rgba(13,110,79,.12)',
                color:m.role==='user'?'#fff':$.t1,fontSize:12.5,fontWeight:m.role==='user'?500:400,lineHeight:1.65,
                whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                {m.role==='model'?<span dangerouslySetInnerHTML={{__html:m.text
                  .replace(/\*\*(.+?)\*\*/g,'<strong style="font-weight:700;color:#1a2332">$1</strong>')
                  .replace(/\*(.+?)\*/g,'<em>$1</em>')
                  .replace(/^- (.+)/gm,'<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#2dd4a0;font-weight:700">•</span><span>$1</span></div>')
                  .replace(/\n/g,'<br/>')}}/>:m.text}
              </div>
              {m.role==='user'&&<div style={{width:24,height:24,borderRadius:8,background:'linear-gradient(135deg,#0d6e4f,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,fontWeight:700,color:'#fff'}} title={msalAccount?.name||msalAccount?.username||''}>{((msalAccount?.name||msalAccount?.username||'').split(/[\s.@]/).filter(Boolean).map(n=>n[0]||'').join('').slice(0,2).toLocaleUpperCase('tr-TR'))||'?'}</div>}
            </div>
          ))}

          {chatLoading&&<div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:24,height:24,borderRadius:8,background:'linear-gradient(135deg,#2dd4a0,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{padding:'12px 16px',borderRadius:16,background:'rgba(255,255,255,.8)',border:'1px solid rgba(0,0,0,.06)',display:'flex',gap:5}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#2dd4a0',animation:'fadeUp .8s ease infinite'}}/>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#3b82f6',animation:'fadeUp .8s ease .2s infinite'}}/>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#8b5cf6',animation:'fadeUp .8s ease .4s infinite'}}/>
            </div>
          </div>}
          <div ref={chatEndRef}/>
        </div>

        {/* Input — rounded glassmorphism */}
        <div style={{padding:'12px 14px 14px',flexShrink:0}}>
          <div style={{display:'flex',gap:8,padding:'6px 6px 6px 16px',borderRadius:18,background:'rgba(255,255,255,.7)',border:'1px solid rgba(0,0,0,.06)',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}}
              placeholder={geminiKey?'Stok hakkında bir şey sorun...':'API key gerekli'}
              disabled={!geminiKey||chatLoading}
              style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:12.5,fontFamily:'inherit',color:$.t1,fontWeight:500}}/>
            <button onClick={sendChat} disabled={!geminiKey||chatLoading||!chatInput.trim()}
              style={{width:34,height:34,borderRadius:12,border:'none',cursor:'pointer',flexShrink:0,
                background:chatInput.trim()&&geminiKey?'linear-gradient(135deg,#2dd4a0,#3b82f6)':'rgba(0,0,0,.05)',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',
                boxShadow:chatInput.trim()&&geminiKey?'0 2px 8px rgba(45,212,160,.2)':'none'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim()&&geminiKey?'#fff':'#b8c4d0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style={{textAlign:'center',marginTop:6,fontSize:9,color:$.t3,opacity:.5}}>TYRO AI · Veriler anlık dashboard'dan</div>
        </div>
      </div>
    </div>
  );
}
