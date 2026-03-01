import { useState, useMemo, useRef, useEffect } from "react";
import { Factory, Warehouse, Package, Clock, MapPin, X, BarChart3, TrendingUp, Building2, Ship, Truck, Container, Database, Layers, ArrowUpDown, ChevronRight, Search, Plus, Trash2, Pencil, Upload, CheckCircle2, ChevronLeft, FileBarChart, Settings, Download, Globe, Palette, Info, Activity } from "lucide-react";
import TurkeyMap3D from './TurkeyMap3D';

const INIT=[["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","TRKYEM00138","DKM","M1",1040,"GZT-DTS","Gaziantep Dış Tesisi","GZTD-001","TMO PINARBAŞI DEPO","C59323DANE-030418","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",13.3,0.3118,133.83,128,136,0,0,0,136],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000000900","DKM","M1",76859,"KON-DTS","Konya Dış Tesisler","KON-008","Konya Besyem 1 Nolu De","C23106DANE-032190","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",12.17,0.2875,80.87,75,89,0,0,0,89],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000000900","DKM","M1",47840,"KON-DTS","Konya Dış Tesisler","KON-008","Konya Besyem 1 Nolu De","C61753DANE-032992","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",12.17,0.2875,83.0,83,83,0,0,0,83],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000000900","DKM","M1",51840,"KON-DTS","Konya Dış Tesisler","KON-008","Konya Besyem 1 Nolu De","C59733DANE-033235","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",12.17,0.2875,75.0,75,75,0,0,0,75],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000001490","DKM","M1",6140,"GZT-FSN","Gaziantep Fason Tesisl","GZTF-010","Vatan Fason Depo","C22341DANE-033730","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.15,0.33,44.0,44,44,0,0,0,44],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000000900","DKM","M1",47220,"KON-DTS","Konya Dış Tesisler","KON-008","Konya Besyem 1 Nolu De","C59733DANE-034211","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",12.17,0.2875,44.0,44,44,0,0,0,44],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",81500,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C51506DANE-034612","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,21.0,21,21,0,0,0,21],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",34000,"GZT-FSN","Gaziantep Fason Tesisl","GZTF-010","Vatan Fason Depo","C28867DANE-034700","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,18.0,18,18,0,0,0,18],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000001277","DKM","M1",80,"ADP-FSN","Adapazarı Fason Tesis","ADP-FSN-FR","Adapazarı Fark Ambarı","C17343DANE-034701","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",12.65,0.3012,18.81,18,20,0,0,0,11],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",70340,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C28867DANE-034668","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,15.68,6,20,0,0,0,18],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",85520,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C59733DANE-034772","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,19.0,19,19,0,0,0,15],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",100560,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C28867DANE-034202","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,33.0,33,33,0,0,0,33],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",53880,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C51506DANE-034691","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,20.0,20,20,0,0,0,20],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",82939,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C59733DANE-034037","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,44.0,44,44,0,0,0,44],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",48380,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C59733DANE-034117","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,44.0,44,44,0,0,0,44],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",20,"TRY-GZT","Gaziantep Tesisi","GZT-ORG-FR","Depolararası Fark Amba","C59733DANE-034772","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,19.0,19,19,0,0,0,15],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002490","DKM","M1",92980,"ADP-FSN","Adapazarı Fason Tesis","ADPF-001","Avrasya Yağ Fason Amba","C17343DANE-034701","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,18.81,18,20,0,0,0,11],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002490","DKM","M1",19989,"ADP-FSN","Adapazarı Fason Tesis","ADPF-001","Avrasya Yağ Fason Amba","C54288DANE-034463","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,26.0,26,26,0,0,0,26],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002490","DKM","M1",1848,"ADP-FSN","Adapazarı Fason Tesis","ADPF-001","Avrasya Yağ Fason Amba","C28341DTHY-027441","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,212.0,212,212,0,0,0,212],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",76200,"TRY-GZT","Gaziantep Tesisi","GPLT-005","Gaziantep Pellet Hamma","C59733DANE-034891","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,19.0,19,19,0,0,0,12],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",50,"TRY-GZT","Gaziantep Tesisi","GZT-ORG-FR","Depolararası Fark Amba","C59733DANE-034891","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,19.0,19,19,0,0,0,12],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002489","DKM","M1",5370,"GZT-DTS","Gaziantep Dış Tesisi","GZTD-002","Gaziantep TMO Deposu","C59733DANE-034891","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.25,0.3272,19.0,19,19,0,0,0,12],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002491","DKM","M1",111400,"TRY-GYM","Güç Yem Tesisi","CGYD-001","Güç Yem Yatay Depo","C59733DANE-033851","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,39.5,39,40,0,0,0,40],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002491","DKM","M1",123960,"TRY-GYM","Güç Yem Tesisi","CGYD-001","Güç Yem Yatay Depo","C59733DANE-034718","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,19.0,19,19,0,0,0,19],["dane","TİRYAKİ TAHIL VE YEM TİCARET A","101001","ARPA - BÜTÜN","TR","PRJ000002491","DKM","M1",26000,"TRY-GYM","Güç Yem Tesisi","CGYD-001","Güç Yem Yatay Depo","C63799DANE-034719","TCR","Ticari","THL","Tahıl","ARP","Arpa","BEY","Beyaz","BTN","Bütün",14.24,0.3272,55.13,53,58,0,0,0,58]];
const HDR=["Şirket Kodu","Şirket Adı","Madde Kodu","Ürün Adı","Menşe","Proje No","Ambalaj","Gümrük","Miktar","Tesis","Tesis Adı","Depo","Ambar Adı","Parti No","L1","L1 Adı","L2","L2 Adı","L3","L3 Adı","L4","L4 Adı","L5","L5 Adı","Fiyat ₺","Fiyat $","PurchWEAV","PurchFIFO","PurchLIFO","ProdWEAV","ProdFIFO","ProdLIFO","Gün"];
const NC=new Set([8,24,25,26,27,28,29,30,31,32]);
const CTM={"ADN":"Adana","ADP":"Adapazarı","BND":"Bandırma","BRS":"Bursa","CRM":"Çorum","EDN":"Edirne","GZT":"Gaziantep","GRS":"Giresun","HTY":"Hatay","ISK":"İskenderun","DTC":"İstanbul","DISTICARET":"İstanbul","IZM":"İzmir","KRM":"Karaman","KON":"Konya","MRS":"Mersin","MUS":"Muş","ORD":"Ordu","SMS":"Samsun","TRY-BND":"Bandırma","TRY-CRM":"Çorum","TRY-GYM":"Gaziantep","TRY-GZT":"Gaziantep","TRY-IST":"İstanbul","TRY-MRS":"Mersin","TRY-SLM":"Bandırma","YLD-KON":"Konya","YLD-MUS":"Muş"};
const CLL={"Adana":[37,35.33],"Adapazarı":[40.68,30.4],"Bandırma":[40.35,27.97],"Bursa":[40.19,29.06],"Çorum":[40.55,34.96],"Edirne":[41.68,26.56],"Gaziantep":[37.07,37.38],"Giresun":[40.91,38.39],"Hatay":[36.2,36.16],"İskenderun":[36.59,36.17],"İstanbul":[41.01,28.98],"İzmir":[38.42,27.14],"Karaman":[37.18,33.23],"Konya":[37.87,32.48],"Mersin":[36.81,34.64],"Muş":[38.74,41.49],"Ordu":[40.99,37.88],"Samsun":[41.29,36.33]};
const fmt=n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));
const fN=n=>new Intl.NumberFormat('tr-TR').format(Math.round(n));
const ac=d=>d<60?'#0d6e4f':d<90?'#16a34a':d<180?'#f5a623':d<365?'#ea580c':'#e5484d';
const acBg=d=>d<60?'rgba(45,212,160,.1)':d<90?'rgba(22,163,74,.08)':d<180?'rgba(245,166,35,.08)':d<365?'rgba(234,88,12,.08)':'rgba(229,72,77,.08)';
const TI={own:{color:'#0d6e4f',label:'Öz Tesis'},fason:{color:'#8b5cf6',label:'Fason'},dis:{color:'#3b82f6',label:'Dış Tesis'},disticaret:{color:'#f5a623',label:'Dış Ticaret'}};
const gC=c=>{if(CTM[c])return CTM[c];const p=c.split('-')[0];return CTM[p]||Object.entries(CTM).find(([k])=>c.includes(k))?.[1]||'Diğer';};
const gT=c=>{if(!c)return'dis';const u=c.toUpperCase();if(u.includes('FSN'))return'fason';if(u==='DISTICARET'||u.includes('DTC'))return'disticaret';if(u.startsWith('TRY-')||u.startsWith('YLD-'))return'own';return'dis';};
const BK=[{k:'0-30',c:'#0d6e4f'},{k:'31-60',c:'#16a34a'},{k:'61-90',c:'#65a30d'},{k:'91-120',c:'#f5a623'},{k:'121-180',c:'#ea580c'},{k:'181-365',c:'#e5484d'},{k:'365+',c:'#991b1b'}];

function buildD(rows){
  const fm={},wm={};
  rows.forEach(r=>{const mi=r[8],ts=r[9],ta=r[10],dp=r[11],da=r[12],ua=r[3],ft=r[24],fu=r[25],fifo=r[27];
    if(!fm[ts])fm[ts]={id:ts,n:ta,city:gC(ts),type:gT(ts),q:0,v:0,vu:0,ws:new Set(),ps:new Set(),td:0,tq:0};
    const f=fm[ts];f.q+=mi;f.v+=mi*ft;f.vu+=mi*fu;f.ws.add(dp);f.ps.add(ua);f.td+=mi*fifo;f.tq+=mi;
    const wk=ts+'|'+dp;if(!wm[wk])wm[wk]={fc:ts,id:dp,n:da,q:0,ps:new Set(),td:0,tq:0};
    const w=wm[wk];w.q+=mi;w.ps.add(ua);w.td+=mi*fifo;w.tq+=mi;});
  const f=Object.values(fm).map(x=>({id:x.id,n:x.n,city:x.city,type:x.type,q:Math.round(x.q),v:Math.round(x.v),vu:Math.round(x.vu),wc:x.ws.size,pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const w=Object.values(wm).map(x=>({fc:x.fc,id:x.id,n:x.n,q:Math.round(x.q),pc:x.ps.size,a:x.tq>0?Math.round(x.td/x.tq):0}));
  const cm={};f.forEach(fc=>{const c=fc.city;if(!cm[c])cm[c]={n:c,q:0,v:0,fc:0,wc:0,fcs:[],td:0,tq:0};const o=cm[c];o.q+=fc.q;o.v+=fc.v;o.fc++;o.wc+=fc.wc;o.fcs.push(fc.id);o.td+=fc.a*fc.q;o.tq+=fc.q;});
  const ct=Object.values(cm).map(c=>{const ll=CLL[c.n]||[39,35];return{n:c.n,q:c.q,v:c.v,fc:c.fc,wc:c.wc,fcs:c.fcs,a:c.tq>0?Math.round(c.td/c.tq):0,lat:ll[0],lng:ll[1]};});
  const ag={};BK.forEach(b=>{ag[b.k]=0;});
  rows.forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});
  const tQ=f.reduce((s,x)=>s+x.q,0),tV=f.reduce((s,x)=>s+x.v,0),tVU=f.reduce((s,x)=>s+x.vu,0);
  return{f,w,ct,ag,s:{totalQty:tQ,totalVal:tV,totalValUsd:tVU,facilityCount:f.length,whCount:w.length,prodCount:new Set(rows.map(r=>r[3])).size,avgAge:tQ>0?Math.round(f.reduce((s,x)=>s+x.a*x.q,0)/tQ):0,cityCount:ct.length}};
}

function getL2(rows,filterFn){
  const m={};
  rows.filter(filterFn).forEach(r=>{const l2=r[17]||'Diğer';const q=r[8];const fifo=r[27];if(!m[l2])m[l2]={n:l2,q:0,td:0,tq:0};m[l2].q+=q;m[l2].td+=q*fifo;m[l2].tq+=q;});
  return Object.values(m).map(x=>({n:x.n,q:Math.round(x.q),a:x.tq>0?Math.round(x.td/x.tq):0})).sort((a,b)=>b.q-a.q);
}

function agingOf(rows,facIds){
  const ag={};BK.forEach(b=>{ag[b.k]=0;});
  rows.filter(r=>facIds.includes(r[9])).forEach(r=>{const d=r[27],q=r[8];if(d<=30)ag['0-30']+=q;else if(d<=60)ag['31-60']+=q;else if(d<=90)ag['61-90']+=q;else if(d<=120)ag['91-120']+=q;else if(d<=180)ag['121-180']+=q;else if(d<=365)ag['181-365']+=q;else ag['365+']+=q;});
  return ag;
}

function buildPivot(rows,groupIdx,labelIdx){
  const m={};
  rows.forEach(r=>{
    const g=r[labelIdx]||r[groupIdx]||'Diğer';
    const q=r[8];const d=r[27];
    if(!m[g])m[g]={n:g,total:0,td:0,ag:{}};
    BK.forEach(b=>{if(!m[g].ag[b.k])m[g].ag[b.k]=0;});
    m[g].total+=q;m[g].td+=q*d;
    if(d<=30)m[g].ag['0-30']+=q;else if(d<=60)m[g].ag['31-60']+=q;else if(d<=90)m[g].ag['61-90']+=q;else if(d<=120)m[g].ag['91-120']+=q;else if(d<=180)m[g].ag['121-180']+=q;else if(d<=365)m[g].ag['181-365']+=q;else m[g].ag['365+']+=q;
  });
  return Object.values(m).map(x=>({...x,avg:x.total>0?Math.round(x.td/x.total):0})).sort((a,b)=>b.total-a.total);
}

const $={bg:'#f5f7fa',bg2:'#fff',bg3:'#edf1f6',t1:'#1a2332',t2:'#5a6b7f',t3:'#8e9bb3',ac:'#0d6e4f',acL:'#e4f5ee',grn:'#2dd4a0',grnB:'rgba(45,212,160,.1)',blu:'#3b82f6',bluB:'rgba(59,130,246,.08)',red:'#e5484d',redB:'rgba(229,72,77,.08)',pur:'#8b5cf6',purB:'rgba(139,92,246,.08)',org:'#f5a623',orgB:'rgba(245,166,35,.08)',tel:'#14b8a6',telB:'rgba(20,184,166,.08)',bd:'#e2e7ee',bdL:'#eef1f6',sh:'0 1px 3px rgba(0,0,0,.04)',shM:'0 4px 16px rgba(0,0,0,.07)',r:'8px',rM:'12px',rL:'16px',f:"'Plus Jakarta Sans',-apple-system,sans-serif",mo:"'JetBrains Mono',monospace"};

const KI=({children,bg,color})=><div style={{width:30,height:30,borderRadius:8,background:bg,color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{children}</div>;

const AgBar=({ag,total,big})=>{const tq=total||1;const sz=big?12:10.5;const dt=big?9:7;const gp=big?'5px 14px':'4px 10px';const bh=big?12:8;return(<div><div style={{display:'flex',height:bh,borderRadius:bh/2,overflow:'hidden',background:$.bdL,marginBottom:big?10:6}}>{BK.map(b=>{const p=(ag[b.k]||0)/tq*100;return p>0?<div key={b.k} style={{width:p+'%',background:b.c,transition:'width .4s'}}/>:null;})}</div><div style={{display:'flex',flexWrap:'wrap',gap:gp}}>{BK.map(b=>{const v=ag[b.k]||0;return v>0?<div key={b.k} style={{display:'flex',alignItems:'center',gap:big?5:3,fontSize:sz,color:$.t2}}><div style={{width:dt,height:dt,borderRadius:3,background:b.c}}/><span style={{fontFamily:$.mo,fontWeight:700}}>{((v/tq)*100).toFixed(0)}%</span><span style={{color:$.t3,fontWeight:500}}>{b.k}</span></div>:null;})}</div></div>);};

const TypeBar=({facs,total,big})=>{const tq=total||1;const sz=big?12:10.5;const dt=big?9:7;const gp=big?'5px 14px':'4px 10px';const bh=big?12:8;const types=Object.entries(TI).map(([k,v])=>({k,c:v.color,l:v.label,q:facs.filter(f=>f.type===k).reduce((s,f)=>s+f.q,0)})).filter(t=>t.q>0);if(types.length<1)return null;return(<div><div style={{display:'flex',height:bh,borderRadius:bh/2,overflow:'hidden',background:$.bdL,marginBottom:big?10:6}}>{types.map(t=><div key={t.k} style={{width:(t.q/tq)*100+'%',background:t.c,transition:'width .4s'}}/>)}</div><div style={{display:'flex',flexWrap:'wrap',gap:gp}}>{types.map(t=><div key={t.k} style={{display:'flex',alignItems:'center',gap:big?5:3,fontSize:sz,color:$.t2}}><div style={{width:dt,height:dt,borderRadius:3,background:t.c}}/><span style={{fontFamily:$.mo,fontWeight:700}}>{((t.q/tq)*100).toFixed(0)}%</span><span style={{color:$.t3,fontWeight:500}}>{t.l}</span></div>)}</div></div>);};

const SegBar=({ag,total,h,rd})=>{const tq=total||1;const hh=h||10;const rr=rd||5;return(
  <div style={{flex:1,height:hh,borderRadius:rr,background:$.bdL,display:'flex',position:'relative',overflow:'visible'}}>
    {BK.map(b=>{const v=ag[b.k]||0;const p=tq>0?(v/tq)*100:0;return p>0?(
      <div key={b.k} className="sg" style={{width:p+'%',background:b.c,opacity:.7,transition:'width .4s',position:'relative',cursor:'pointer'}}>
        <div className="sgt" style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',padding:'7px 11px',background:$.bg2,border:'1px solid '+$.bd,borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,.12)',whiteSpace:'nowrap',zIndex:30,pointerEvents:'none',opacity:0,transition:'opacity .15s',fontSize:11.5,lineHeight:1.5}}>
          <div style={{fontWeight:700,color:b.c,marginBottom:1}}>{b.k} gün</div>
          <div style={{fontFamily:$.mo,fontWeight:600,color:$.t1}}>{fmt(v)} ton</div>
          <div style={{fontFamily:$.mo,fontSize:10,color:$.t3}}>{p.toFixed(1)}%</div>
          <div style={{position:'absolute',bottom:-5,left:'50%',marginLeft:-5,width:10,height:10,background:$.bg2,border:'1px solid '+$.bd,borderTop:'none',borderLeft:'none',transform:'rotate(45deg)'}}/>
        </div>
      </div>
    ):null;})}
  </div>
);};

export default function App(){
  const [rows,setRows]=useState(INIT);
  const D=useMemo(()=>buildD(rows),[rows]);
  const [mob,setMob]=useState(typeof window!=='undefined'&&window.innerWidth<768);
  const [sbOpen,setSbOpen]=useState(false);
  useEffect(()=>{const h=()=>{setMob(window.innerWidth<768);if(window.innerWidth>=768)setSbOpen(false);};window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  const [pg,setPg]=useState('dash');
  const [sel,setSel]=useState(null);
  const [hov,setHov]=useState(null);
  const [tab,setTab]=useState('f');
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
  const [hovTip,setHovTip]=useState(null); // {i, x, y}
  const [repTab,setRepTab]=useState('comp');
  const [repSearch,setRepSearch]=useState('');
  const [repSC,setRepSC]=useState('total'); // sort column: n, total, avg, or bucket key
  const [repSD,setRepSD]=useState(-1); // sort direction

  const l2Data=useMemo(()=>{
    if(drillWh)return getL2(rows,r=>r[11]===drillWh);
    if(drillFac)return getL2(rows,r=>r[9]===drillFac);
    return null;
  },[drillFac,drillWh,rows]);

  const mQ=Math.max(...D.ct.map(c=>c.q),1);

  const filtered=useMemo(()=>{if(!search.trim())return rows;const s=search.toLowerCase();return rows.filter(r=>r.some(v=>String(v).toLowerCase().includes(s)));},[rows,search]);
  const sorted=useMemo(()=>[...filtered].sort((a,b)=>{const x=a[rC],y=b[rC];return(typeof x==='number'?(x-y):String(x).localeCompare(String(y)))*rD;}),[filtered,rC,rD]);

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
    const cityAg=agingOf(rows,facs.map(f=>f.id));
    return{ct,facs,whs,tQ,tV,tWh,tPc,avgA,cityAg};
  },[sel,D,rows]);

  const clr=(cls)=>({blu:{c:$.blu,bg:$.bluB},grn:{c:'#0d6e4f',bg:$.grnB},pur:{c:$.pur,bg:$.purB},org:{c:$.org,bg:$.orgB},red:{c:$.red,bg:$.redB},tel:{c:$.tel,bg:$.telB}}[cls]);

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:$.f,background:$.bg,color:$.t1,overflow:'hidden',WebkitFontSmoothing:'antialiased',fontSize:13}}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes sbIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}.ks{animation:slideIn .3s cubic-bezier(.16,1,.3,1)}.fu{animation:fadeUp .35s ease both}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#c8cdd5;border-radius:10px}.rh:hover{background:#f0f3f8!important}.kp{transition:all .2s}.kp:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);transform:translateY(-2px)}input.fi{border:1px solid rgba(226,231,238,.6);border-radius:8px;padding:5px 8px;font-size:11px;font-family:inherit;outline:none;width:100%;background:rgba(255,255,255,.7);backdrop-filter:blur(6px)}input.fi:focus{border-color:#0d6e4f;background:#fff}.tb-b{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid rgba(226,231,238,.5);background:rgba(255,255,255,.7);backdrop-filter:blur(6px);color:#5a6b7f;font-size:11.5px;font-family:inherit;font-weight:500;cursor:pointer;transition:all .15s}.tb-b:hover{background:rgba(255,255,255,.95);border-color:#d0d6df}.tb-b.pr{background:#0d6e4f;color:#fff;border-color:#0d6e4f}.tb-b.pr:hover{background:#0a5a40}.sg:hover{opacity:1!important}.sg:hover .sgt{opacity:1!important}.sbn:hover{background:rgba(13,110,79,.04)!important}.mob-ov{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;backdrop-filter:blur(2px)}.mob-sb{animation:sbIn .25s ease}`}</style>
      <input ref={fR} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{display:'none'}}/>

      {/* SIDEBAR */}
      {mob&&sbOpen&&<div className="mob-ov" onClick={()=>setSbOpen(false)}/>}
      <div className={mob?'mob-sb':''} style={{width:250,background:'rgba(255,255,255,.95)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',display:mob&&!sbOpen?'none':'flex',flexDirection:'column',flexShrink:0,borderRight:'1px solid rgba(226,231,238,.4)',...(mob?{position:'fixed',left:0,top:0,bottom:0,zIndex:1000,boxShadow:'4px 0 24px rgba(0,0,0,.15)'}:{})}}>
        <div style={{padding:'20px 20px 16px',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#134E5E 0%,#0d7a5f 50%,#2dd4a0 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 18px rgba(13,122,95,.2)',position:'relative',overflow:'hidden',flexShrink:0}}>
            <div style={{position:'absolute',top:'-40%',right:'-40%',width:'80%',height:'80%',background:'radial-gradient(circle,rgba(255,255,255,.22),transparent 70%)',borderRadius:'50%'}}/>
            <Warehouse size={18} color="#fff" style={{position:'relative',zIndex:1}}/>
          </div>
          <div>
            <div style={{color:$.t1,fontWeight:800,fontSize:16,letterSpacing:.3,lineHeight:1.1}}>TYRO</div>
            <div style={{color:$.ac,fontSize:9.5,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',marginTop:2}}>WH AGENT</div>
          </div>
        </div>
        <div style={{padding:'0 12px',flex:1,overflowY:'auto'}}>
          <div style={{padding:'10px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Genel'}</div>
          {[{id:'dash',icon:BarChart3,label:'Dashboard'},{id:'ana',icon:Activity,label:'Analiz & Risk'}].map(p=>{const isA=pg===p.id;return(
            <div key={p.id} className="sbn" onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 11px',margin:'1px 0',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease'}}>
              {isA&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <p.icon size={16} strokeWidth={isA?2.2:1.8}/>{p.label}
            </div>);})}
          <div style={{padding:'14px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Veri & Raporlama'}</div>
          {[{id:'rep',icon:FileBarChart,label:'Raporlar'},{id:'raw',icon:Database,label:'Ham Veri'}].map(p=>{const isA=pg===p.id;return(
            <div key={p.id} className="sbn" onClick={()=>{setPg(p.id);setSel(null);setDrillFac(null);setDrillWh(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 11px',margin:'1px 0',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease'}}>
              {isA&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <p.icon size={16} strokeWidth={isA?2.2:1.8}/>{p.label}
              {p.id==='raw'&&<span style={{marginLeft:'auto',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:6,background:$.blu,color:'#fff',minWidth:18,textAlign:'center'}}>{rows.length}</span>}
            </div>);})}
          <div style={{padding:'14px 8px 6px',fontSize:9,fontWeight:700,letterSpacing:1.8,textTransform:'uppercase',color:$.t3,opacity:.45}}>{'Sistem'}</div>
          {(()=>{const isA=pg==='set';return(
            <div className="sbn" onClick={()=>{setPg('set');setSel(null);setSbOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 11px',borderRadius:8,color:isA?$.ac:$.t2,cursor:'pointer',fontSize:12.5,fontWeight:isA?600:500,background:isA?'rgba(13,110,79,.07)':'transparent',position:'relative',transition:'all .2s ease'}}>
              {isA&&<div style={{position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:$.ac,borderRadius:'0 3px 3px 0'}}/>}
              <Settings size={16} strokeWidth={isA?2.2:1.8}/>Ayarlar
            </div>);})()}
        </div>
        <div style={{padding:'14px 16px',borderTop:'1px solid rgba(226,231,238,.35)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <div style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,#1a3a6b,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{color:'#fff',fontSize:9,fontWeight:900}}>T</span>
            </div>
            <div>
              <div style={{fontSize:8,color:$.t3,fontWeight:500,lineHeight:1}}>Powered by</div>
              <div style={{fontSize:10,fontWeight:700,color:'#1a3a6b',letterSpacing:.2,lineHeight:1.3}}>TTECH <span style={{fontWeight:400,color:$.t3,fontSize:8.5}}>Business Solutions</span></div>
            </div>
          </div>
          <div style={{fontSize:7.5,color:$.t3,opacity:.5}}>© {new Date().getFullYear()} Tüm hakları saklıdır.</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Topbar */}
        <div style={{height:mob?48:56,background:'rgba(255,255,255,.65)',backdropFilter:'blur(20px) saturate(160%)',WebkitBackdropFilter:'blur(20px) saturate(160%)',borderBottom:'1px solid rgba(226,231,238,.35)',display:'flex',alignItems:'center',padding:mob?'0 14px':'0 26px',flexShrink:0,gap:8}}>
          {mob&&<div onClick={()=>setSbOpen(!sbOpen)} style={{width:34,height:34,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'rgba(13,110,79,.06)',flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={$.ac} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>}
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
            {!mob&&<div style={{width:32,height:32,borderRadius:9,background:'rgba(13,110,79,.06)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {pg==='dash'?<BarChart3 size={15} color={$.ac}/>:pg==='ana'?<Activity size={15} color={$.ac}/>:pg==='rep'?<FileBarChart size={15} color={$.ac}/>:pg==='raw'?<Database size={15} color={$.ac}/>:<Settings size={15} color={$.ac}/>}
            </div>}
            <div style={{minWidth:0}}>
              <div style={{fontSize:mob?13:15,fontWeight:700,color:$.t1,lineHeight:1.2}}>{{'dash':'Dashboard','ana':'Analiz & Risk','raw':'Ham Veri','rep':'Raporlar','set':'Ayarlar'}[pg]}</div>
              {!mob&&<div style={{fontSize:10,color:$.t3,fontWeight:400}}>{{'dash':'Genel Bakış','ana':'Stok Analizi ve Risk Değerlendirmesi','raw':'İşlem Kayıtları','rep':'Stok Yaşlandırma Analizleri','set':'Uygulama Tercihleri'}[pg]}</div>}
            </div>
          </div>
          {!mob&&<div style={{padding:'4px 10px',borderRadius:7,background:'rgba(226,231,238,.06)',fontSize:10,fontFamily:$.mo,fontWeight:500,color:$.t3}}>{new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'})}</div>}
        </div>
        <div style={{flex:1,overflow:'auto',display:'flex'}}>
          <div style={{flex:1,overflow:'auto',padding:mob?12:22}}>

            {/* ===== DASHBOARD ===== */}
            {pg==='dash'&&(
              <div>
                {/* KPI Cards */}
                {(()=>{const critQty=rows.filter(r=>r[27]>=180).reduce((s,r)=>s+r[8],0);const critPct=D.s.totalQty>0?((critQty/D.s.totalQty)*100).toFixed(1):'0';
                const tips=[
                  'Tüm tesislerdeki toplam envanter miktarı (ton). Formül: Σ Miktar (tüm satırlar)',
                  'Envanterin TL cinsinden toplam değeri. Formül: Σ (Miktar × Birim Fiyat ₺)',
                  'Aktif tesis ve depo sayısı. Benzersiz Tesis Kodu ve Depo Kodu sayımı',
                  'Stokta bulunan benzersiz ürün (Ürün Adı) sayısı. Ürün çeşitliliği göstergesi',
                  'Miktar ağırlıklı ortalama yaşlanma. Formül: Σ(Miktar × PurchFIFO) / Σ Miktar',
                  '180 gün ve üzeri PurchFIFO değerine sahip stoklar. Fire ve değer kaybı riski taşır. Oran: Kritik Miktar / Toplam Miktar × 100',
                ];
                return(
                <div style={{display:'grid',gridTemplateColumns:mob?'repeat(2,1fr)':'repeat(6,1fr)',gap:mob?8:10,marginBottom:mob?14:20}}>
                  {[
                    {l:'Toplam Stok (ton)',v:fmt(D.s.totalQty),cls:'blu',ic:<Package size={18}/>},
                    {l:'Toplam Değer',v:'₺'+fmt(D.s.totalVal),cls:'grn',ic:<TrendingUp size={18}/>},
                    {l:'Tesis / Depo',v:D.s.facilityCount+' / '+D.s.whCount,cls:'pur',ic:<Building2 size={18}/>},
                    {l:'Aktif Ürün',v:String(D.s.prodCount),cls:'tel',ic:<Layers size={18}/>},
                    {l:'Ort. Yaşlanma (FIFO)',v:String(D.s.avgAge)+' gün',cls:'org',ic:<Clock size={18}/>},
                    {l:'Kritik Stok (180+ gün)',v:fmt(critQty),cls:'red',ic:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,sub:critPct+'% toplam stokun'},
                  ].map((k,i)=>{const cc=clr(k.cls);return(
                    <div key={i} className="kp fu" style={{animationDelay:i*70+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'13px 14px',position:'relative',overflow:'hidden',boxShadow:$.sh}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,'+cc.c+',transparent)',opacity:.6,borderRadius:'12px 12px 0 0'}}/>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:7}}>
                        <KI bg={cc.bg} color={cc.c}>{k.ic}</KI>
                        <div onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setHovTip({i,x:r.left+r.width/2,y:r.bottom+8});}} onMouseLeave={()=>setHovTip(null)} style={{width:21,height:21,borderRadius:'50%',border:'1.5px solid '+$.bd,background:$.bg2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'help',fontSize:10,fontWeight:800,color:hovTip?.i===i?cc.c:$.t3,transition:'all .15s',flexShrink:0}}>
                          i
                        </div>
                      </div>
                      <div style={{fontSize:19,fontWeight:800,marginBottom:1,fontFamily:$.mo,fontVariantNumeric:'tabular-nums',color:k.cls==='red'?$.red:$.t1}}>{k.v}</div>
                      <div style={{fontSize:10,color:$.t3,fontWeight:500}}>{k.sub||k.l}</div>
                    </div>);})}
                </div>);})()}

                {/* MAP */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:18,overflow:'hidden'}}>
                  <div style={{padding:'15px 18px 13px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid '+$.bdL}}>
                    <div style={{fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.bluB,color:$.blu,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><MapPin size={14}/></div>
                      {'Türkiye Tiryaki Haritası'}
                      <span style={{fontSize:9,fontWeight:600,color:$.ac,background:$.acL,padding:'2px 8px',borderRadius:6,marginLeft:4}}>3D</span>
                    </div>
                  </div>
                  <TurkeyMap3D
                    cities={D.ct}
                    maxQty={mQ}
                    sel={sel}
                    hov={hov}
                    onSelect={(name)=>{setSel(sel===name?null:name);setDrillFac(null);setDrillWh(null);}}
                    onHover={setHov}
                    onHoverEnd={()=>setHov(null)}
                    acFn={ac}
                    fmt={fmt}
                  />
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
                              <span style={{fontSize:9,fontFamily:$.mo,fontWeight:700,color:$.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{fmt(v)}</span>
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

            {/* ===== ANALİZ & RİSK ===== */}
            {pg==='ana'&&(()=>{
              const tq=D.s.totalQty||1;
              // Value by aging bucket
              const vBk={};BK.forEach(b=>{vBk[b.k]=0;});
              rows.forEach(r=>{const d=r[27],v=r[8]*r[24];if(d<=30)vBk['0-30']+=v;else if(d<=60)vBk['31-60']+=v;else if(d<=90)vBk['61-90']+=v;else if(d<=120)vBk['91-120']+=v;else if(d<=180)vBk['121-180']+=v;else if(d<=365)vBk['181-365']+=v;else vBk['365+']+=v;});
              const tVal=Object.values(vBk).reduce((s,v)=>s+v,0)||1;
              // Top 5 products by qty
              const pm={};rows.forEach(r=>{const n=r[3];if(!pm[n])pm[n]={n,q:0,td:0,tq:0};pm[n].q+=r[8];pm[n].td+=r[8]*r[27];pm[n].tq+=r[8];});
              Object.values(pm).forEach(x=>{x.a=x.tq>0?Math.round(x.td/x.tq):0;});
              const top5=Object.values(pm).sort((a,b)=>b.q-a.q).slice(0,5);
              const mxP=top5[0]?.q||1;
              // Risk levels per facility
              const rl=[{k:'fresh',l:'Taze Stok',r:'0-60 gün',c:'#0d6e4f',bg:'rgba(45,212,160,.08)',fn:f=>f.a<60},
                {k:'normal',l:'Normal',r:'60-180 gün',c:'#f5a623',bg:'rgba(245,166,35,.06)',fn:f=>f.a>=60&&f.a<180},
                {k:'risky',l:'Riskli',r:'180-365 gün',c:'#ea580c',bg:'rgba(234,88,12,.06)',fn:f=>f.a>=180&&f.a<365},
                {k:'critical',l:'Kritik',r:'365+ gün',c:'#e5484d',bg:'rgba(229,72,77,.06)',fn:f=>f.a>=365}];
              const rCounts=rl.map(r=>({...r,count:D.f.filter(r.fn).length,qty:D.f.filter(r.fn).reduce((s,f)=>s+f.q,0)}));
              const mxR=Math.max(...rCounts.map(r=>r.count),1);
              // Donut segments
              const donutSegs=[];let cumAngle=0;
              BK.forEach(b=>{const v=vBk[b.k]||0;const pct=v/tVal;if(pct>0){const a=pct*360;donutSegs.push({k:b.k,c:b.c,start:cumAngle,end:cumAngle+a,pct,v});cumAngle+=a;}});
              const arc=(cx,cy,r,s,e)=>{const sr=s*Math.PI/180,er=e*Math.PI/180;const x1=cx+r*Math.cos(sr),y1=cy+r*Math.sin(sr),x2=cx+r*Math.cos(er),y2=cy+r*Math.sin(er);const lg=e-s>180?1:0;return`M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2}`;};
              return(
                <div>
                  {/* Top row: Oldest Stocks + Donut */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1.2fr 1fr',gap:16,marginBottom:16}}>
                    {/* En Yaşlı Stoklar */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.redB,color:$.red,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Clock size={14}/></div>
                        {'En Yaşlı Stoklar (Ürün)'}
                      </div>
                      <div style={{padding:'14px 18px'}}>
                        {(()=>{const old5=Object.values(pm).sort((a,b)=>b.a-a.a).slice(0,5);return old5.map((p,i)=>(
                          <div key={p.n} style={{marginBottom:i<4?12:0}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                              <span style={{fontSize:11.5,fontWeight:600,color:$.t1,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:13,fontWeight:800,color:ac(p.a),padding:'2px 8px',borderRadius:5,background:acBg(p.a)}}>{p.a} gün</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{flex:1,height:10,borderRadius:5,background:$.bdL,overflow:'hidden'}}>
                                <div style={{height:'100%',width:Math.min(100,(p.a/365)*100)+'%',borderRadius:5,background:ac(p.a),opacity:.6,transition:'width .5s'}}/>
                              </div>
                              <span style={{fontFamily:$.mo,fontSize:10,color:$.t3,fontWeight:600,minWidth:55,textAlign:'right'}}>{fmt(p.q)} ton</span>
                            </div>
                          </div>));})()}
                      </div>
                    </div>
                    {/* Donut Chart */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><TrendingUp size={14}/></div>
                        {'Stok Değer Dağılımı (₺)'}
                      </div>
                      <div style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:16}}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                          {donutSegs.map(s=><path key={s.k} d={arc(70,70,55,s.start-90,s.end-90)} fill="none" stroke={s.c} strokeWidth="18" strokeLinecap="round" opacity=".8"/>)}
                          <text x="70" y="65" textAnchor="middle" fontSize="15" fontWeight="800" fill={$.t1} fontFamily="JetBrains Mono">₺{fmt(tVal)}</text>
                          <text x="70" y="82" textAnchor="middle" fontSize="9" fill={$.t3} fontWeight="500">{'Toplam Değer'}</text>
                        </svg>
                        <div style={{display:'flex',flexDirection:'column',gap:6,flex:1}}>
                          {donutSegs.map(s=>(
                            <div key={s.k} style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:8,height:8,borderRadius:3,background:s.c,flexShrink:0}}/>
                              <span style={{fontSize:11,color:$.t2,flex:1}}>{s.k} Gün</span>
                              <span style={{fontSize:11,fontFamily:$.mo,fontWeight:700,color:$.t1}}>₺{fmt(s.v)}</span>
                            </div>))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom row: Top 5 + Risk */}
                  <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1.2fr 1fr',gap:16}}>
                    {/* Top 5 Products */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Package size={14}/></div>
                        {'En Yüksek Stok (Ürün)'}
                      </div>
                      <div style={{padding:'14px 18px'}}>
                        {top5.map((p,i)=>(
                          <div key={p.n} style={{marginBottom:i<4?12:0}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                              <span style={{fontSize:11.5,fontWeight:600,color:$.t1,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.n}</span>
                              <span style={{fontFamily:$.mo,fontSize:12,fontWeight:700,color:$.t1}}>{fmt(p.q)} ton</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{flex:1,height:10,borderRadius:5,background:$.bdL,overflow:'hidden'}}>
                                <div style={{height:'100%',width:(p.q/mxP)*100+'%',borderRadius:5,background:ac(p.a),opacity:.65,transition:'width .5s'}}/>
                              </div>
                              <span style={{fontFamily:$.mo,fontSize:10,fontWeight:700,color:ac(p.a),padding:'2px 6px',borderRadius:4,background:acBg(p.a)}}>{p.a}g</span>
                            </div>
                          </div>))}
                      </div>
                    </div>
                    {/* Risk Summary */}
                    <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                      <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:26,height:26,borderRadius:7,background:$.redB,color:$.red,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Activity size={14}/></div>
                        {'Risk Özeti'}
                      </div>
                      <div style={{padding:'14px 18px'}}>
                        {rCounts.map((r,i)=>(
                          <div key={r.k} style={{padding:'10px 12px',borderRadius:$.rM,background:r.bg,marginBottom:i<3?8:0}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                              <div>
                                <span style={{fontSize:12.5,fontWeight:700,color:r.c}}>{r.l}</span>
                                <span style={{fontSize:10,color:$.t3,marginLeft:8}}>{r.r}</span>
                              </div>
                              <span style={{fontFamily:$.mo,fontSize:13,fontWeight:800,color:r.c}}>{r.count} tesis</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{flex:1,height:8,borderRadius:4,background:'rgba(0,0,0,.04)',overflow:'hidden'}}>
                                <div style={{height:'100%',width:D.f.length>0?(r.count/D.f.length)*100+'%':'0%',borderRadius:4,background:r.c,opacity:.6,transition:'width .5s'}}/>
                              </div>
                              <span style={{fontFamily:$.mo,fontSize:10,color:$.t2,fontWeight:600,minWidth:55,textAlign:'right'}}>{fmt(r.qty)} ton</span>
                            </div>
                          </div>))}
                      </div>
                    </div>
                  </div>
                </div>
              );})()}

            {/* ===== RAW DATA ===== */}
            {pg==='raw'&&(
              <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,overflow:'hidden',boxShadow:$.sh}}>
                <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <div style={{fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}><div style={{width:26,height:26,borderRadius:7,background:$.bluB,color:$.blu,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Database size={14}/></div>Ham Veri</div>
                  <span style={{fontSize:11,color:$.t3}}>{filtered.length}/{rows.length}</span>
                  <div style={{flex:1}}/>
                  <div style={{position:'relative',width:220}}><Search size={14} color={$.t3} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/><input className="fi" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara..." style={{paddingLeft:30,height:32}}/></div>
                  <button className="tb-b pr" onClick={()=>{setAddMode(true);setNewRow(HDR.map((_,i)=>NC.has(i)?0:''));}}><Plus size={13}/>Yeni</button>
                  <button className="tb-b" onClick={()=>fR.current?.click()}><Upload size={13}/>İçeri Aktar</button>
                  {selRows.size>0&&<button className="tb-b" onClick={handleDelete} style={{color:$.red,borderColor:$.red}}><Trash2 size={13}/>Sil ({selRows.size})</button>}
                </div>
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
                      {HDR.map((h,ci)=>(
                        <th key={ci} onClick={()=>{if(rC===ci)setRD(d=>d*-1);else{setRC(ci);setRD(-1);}}} style={{padding:'9px 10px',textAlign:NC.has(ci)?'right':'left',color:$.t3,fontWeight:700,fontSize:9,textTransform:'uppercase',borderBottom:'2px solid '+$.bd,cursor:'pointer',whiteSpace:'nowrap',background:$.bg,minWidth:ci===1||ci===3||ci===10||ci===12?130:60,letterSpacing:.5}}>{h}{rC===ci?<ArrowUpDown size={8} style={{marginLeft:2,verticalAlign:'middle'}} color={$.blu}/>:null}</th>))}
                      <th style={{padding:'9px 6px',borderBottom:'2px solid '+$.bd,background:$.bg,width:36}}/>
                    </tr></thead>
                    <tbody>{sorted.map((r,i)=>{const oi=rows.indexOf(r);return(
                      <tr key={i} className="rh" style={{borderBottom:'1px solid '+$.bdL,background:selRows.has(oi)?$.acL:i%2?'#fafbfc':'#fff'}}>
                        <td style={{padding:'7px 10px'}}><input type="checkbox" checked={selRows.has(oi)} onChange={e=>{const n=new Set(selRows);e.target.checked?n.add(oi):n.delete(oi);setSelRows(n);}}/></td>
                        {r.map((v,ci)=>(
                          <td key={ci} style={{padding:'7px 10px',textAlign:NC.has(ci)?'right':'left',fontFamily:NC.has(ci)?$.mo:'inherit',fontSize:10.5,whiteSpace:'nowrap',maxWidth:ci===1||ci===3||ci===10||ci===12?150:200,overflow:'hidden',textOverflow:'ellipsis',color:ci===8?$.t1:$.t2,fontWeight:ci===8?600:400}}>
                            {ci===27?<span style={{padding:'2px 7px',borderRadius:5,background:acBg(v),color:ac(v),fontWeight:600,fontFamily:$.mo}}>{v}</span>:ci===24?('₺'+v):ci===25?('$'+v):typeof v==='number'?fN(v):v}
                          </td>))}
                        <td style={{padding:'7px 6px'}}><Pencil size={12} color={$.t3} style={{cursor:'pointer'}} onClick={()=>{setEditIdx(oi);setEditRow([...r]);}}/></td>
                      </tr>);})}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== RAPORLAR ===== */}
            {pg==='rep'&&(()=>{
              const tabs=[{id:'comp',l:'Şirket',idx:0,lbl:1},{id:'fac',l:'Tesis',idx:9,lbl:10},{id:'l2',l:'Seviye 2',idx:16,lbl:17},{id:'l3',l:'Seviye 3',idx:18,lbl:19},{id:'origin',l:'Menşe',idx:4,lbl:4}];
              const cur=tabs.find(t=>t.id===repTab)||tabs[0];
              const pv=buildPivot(rows,cur.idx,cur.lbl).filter(r=>!repSearch.trim()||r.n.toLowerCase().includes(repSearch.toLowerCase())).sort((a,b)=>{
                let va,vb;
                if(repSC==='n'){va=a.n;vb=b.n;return va.localeCompare(vb)*repSD;}
                else if(repSC==='total'){va=a.total;vb=b.total;}
                else if(repSC==='avg'){va=a.avg;vb=b.avg;}
                else{va=a.ag[repSC]||0;vb=b.ag[repSC]||0;}
                return(va-vb)*repSD;
              });
              const mxT=Math.max(...pv.map(r=>r.total),1);
              const gt=pv.reduce((s,r)=>s+r.total,0);
              return(
                <div>
                  {/* Tab selector */}
                  <div style={{display:'flex',gap:6,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
                    {tabs.map(t=>(
                      <div key={t.id} onClick={()=>{setRepTab(t.id);setRepSearch('');setRepSC('total');setRepSD(-1);}} style={{padding:'8px 18px',borderRadius:$.r,fontSize:12,fontWeight:600,cursor:'pointer',background:repTab===t.id?$.acL:$.bg2,color:repTab===t.id?$.ac:$.t3,border:'1px solid '+(repTab===t.id?'#b8dece':$.bdL),transition:'all .15s'}}>{t.l}</div>
                    ))}
                    <div style={{marginLeft:'auto',position:'relative',width:220}}>
                      <Search size={14} color={$.t3} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/>
                      <input className="fi" value={repSearch} onChange={e=>setRepSearch(e.target.value)} placeholder={cur.l+' ara...'} style={{paddingLeft:30,height:34}}/>
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
                          const hd=[cur.l,'Toplam (ton)','Ort.Yaş (gün)',...BK.map(b=>b.k)];
                          const csvRows=pv.map(r=>['"'+r.n+'"',Math.round(r.total),r.avg,...BK.map(b=>Math.round(r.ag[b.k]||0))].join(','));
                          const csv=hd.join(',')+'\n'+csvRows.join('\n');
                          const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download='TYRO_'+cur.l+'_Rapor_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
                        }} style={{fontSize:11}}><Download size={13}/>Excel</button>
                        <button className="tb-b pr" onClick={()=>{
                          const w=window.open('','_blank');
                          const gtot=pv.reduce((s,r)=>s+r.total,0);
                          const bkH=BK.map(b=>'<th style="padding:8px 6px;text-align:right;font-size:9px;color:'+b.c+';border-bottom:2px solid #ddd;white-space:nowrap">'+b.k+'</th>').join('');
                          const trs=pv.map((r,i)=>{
                            const bkC=BK.map(b=>{const v=r.ag[b.k]||0;return '<td style="padding:7px 6px;text-align:right;font-family:monospace;font-size:10px;color:'+(v>0?'#333':'#ccc')+'">'+( v>0?Math.round(v).toLocaleString('tr-TR'):'-')+'</td>';}).join('');
                            return '<tr style="background:'+(i%2?'#fafbfc':'#fff')+'"><td style="padding:7px 10px;font-weight:600;font-size:11px">'+r.n+'</td><td style="padding:7px 10px;text-align:right;font-family:monospace;font-weight:700;font-size:11px">'+Math.round(r.total).toLocaleString('tr-TR')+'</td><td style="padding:7px 10px;text-align:right"><span style="font-family:monospace;font-size:10px;font-weight:700;color:'+(r.avg<60?'#0d6e4f':r.avg<180?'#f5a623':'#e5484d')+';padding:2px 6px;border-radius:4px;background:'+(r.avg<60?'rgba(45,212,160,.1)':r.avg<180?'rgba(245,166,35,.08)':'rgba(229,72,77,.08)')+'">'+r.avg+' g</span></td>'+bkC+'</tr>';
                          }).join('');
                          const gBk=BK.map(b=>{const v=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);return '<td style="padding:8px 6px;text-align:right;font-family:monospace;font-size:10px;font-weight:700;color:'+b.c+'">'+Math.round(v).toLocaleString('tr-TR')+'</td>';}).join('');
                          w.document.write('<!DOCTYPE html><html><head><title>T-Stock '+cur.l+' Raporu</title><style>@page{size:landscape;margin:15mm}body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1a2332}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #ddd}td{border-bottom:1px solid #eee}.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #0d6e4f}.logo{display:flex;align-items:center;gap:10px}.lbox{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#134E5E,#0d7a5f,#2dd4a0);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900}.meta{text-align:right;font-size:11px;color:#888}.ttl{font-size:20px;font-weight:800}.sub{font-size:10px;color:#0d6e4f;font-weight:700;letter-spacing:2px;text-transform:uppercase}.ftr{margin-top:20px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:9px;color:#aaa}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>');
                          w.document.write('<div class="hdr"><div class="logo"><div class="lbox">T</div><div><div class="ttl">TYRO</div><div class="sub">WH AGENT</div></div></div><div class="meta">'+cur.l+' Bazlı Yaşlandırma Raporu<br>'+new Date().toLocaleDateString('tr-TR')+'<br><span style="font-size:10px;color:#555">'+pv.length+' kayıt · Toplam '+Math.round(gtot).toLocaleString('tr-TR')+' ton</span></div></div>');
                          w.document.write('<table><thead><tr><th>'+cur.l+'</th><th style="text-align:right">Toplam</th><th style="text-align:right">Ort.Yaş</th>'+bkH+'</tr></thead><tbody>'+trs+'<tr style="background:#e4f5ee;border-top:2px solid #0d6e4f"><td style="padding:8px 10px;font-weight:800;color:#0d6e4f">TOPLAM</td><td style="padding:8px 10px;text-align:right;font-family:monospace;font-weight:800;color:#0d6e4f">'+Math.round(gtot).toLocaleString('tr-TR')+'</td><td></td>'+gBk+'</tr></tbody></table>');
                          w.document.write('<div class="ftr"><span>Powered by TTECH Business Solutions</span><span>© '+new Date().getFullYear()+' TYRO WH AGENT — Stok Yaşlandırma Raporu</span></div>');
                          w.document.write('</body></html>');
                          w.document.close();
                          setTimeout(()=>w.print(),300);
                        }} style={{fontSize:11}}><Download size={13}/>PDF</button>
                      </div>
                    </div>

                    <div style={{overflowX:'auto',maxHeight:'calc(100vh - 230px)'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11.5}}>
                        <thead>
                          <tr style={{position:'sticky',top:0,zIndex:2,background:$.bg}}>
                            {(()=>{const sH=(col)=>({onClick:()=>{if(repSC===col)setRepSD(d=>d*-1);else{setRepSC(col);setRepSD(-1);}},style:{cursor:'pointer',userSelect:'none'}});const sI=(col)=>repSC===col?<ArrowUpDown size={9} style={{marginLeft:3,verticalAlign:'middle'}} color={$.blu}/>:null;return(<>
                            <th {...sH('n')} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,fontSize:10,color:repSC==='n'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:160,cursor:'pointer'}}>{cur.l}{sI('n')}</th>
                            <th {...sH('total')} style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:repSC==='total'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:90,cursor:'pointer'}}>Toplam{sI('total')}</th>
                            <th {...sH('avg')} style={{padding:'10px 14px',textAlign:'right',fontWeight:700,fontSize:10,color:repSC==='avg'?$.blu:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:60,cursor:'pointer'}}>Ort.Yaş{sI('avg')}</th>
                            {BK.map(b=><th key={b.k} {...sH(b.k)} style={{padding:'10px 8px',textAlign:'right',fontWeight:700,fontSize:9,color:repSC===b.k?$.blu:b.c,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:62,cursor:'pointer'}}>{b.k}{sI(b.k)}</th>)}
                            </>);})()}
                            <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,fontSize:10,color:$.t3,textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid '+$.bd,background:$.bg,minWidth:200}}>Dağılım</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pv.map((r,ri)=>(
                            <tr key={r.n} className="rh" style={{borderBottom:'1px solid '+$.bdL,background:ri%2?'#fafbfc':'#fff'}}>
                              <td style={{padding:'9px 14px',fontWeight:600,fontSize:12,color:$.t1}}>{r.n}</td>
                              <td style={{padding:'9px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:700,fontSize:12,color:$.t1}}>{fmt(r.total)}</td>
                              <td style={{padding:'9px 14px',textAlign:'right'}}>
                                <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(r.avg),padding:'2px 8px',borderRadius:5,background:acBg(r.avg)}}>{r.avg}g</span>
                              </td>
                              {BK.map(b=>{const v=r.ag[b.k]||0;const p=r.total>0?((v/r.total)*100).toFixed(0):'0';return(
                                <td key={b.k} style={{padding:'9px 8px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,color:v>0?$.t2:$.bdL,fontWeight:v>0?600:400}}>{v>0?fmt(v)+' ('+p+'%)':'-'}</td>
                              );})}
                              <td style={{padding:'9px 14px'}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <SegBar ag={r.ag} total={r.total}/>
                                  <span style={{fontSize:10,fontFamily:$.mo,color:$.t3,fontWeight:600,minWidth:35,textAlign:'right'}}>{gt>0?((r.total/gt)*100).toFixed(0)+'%':'0%'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {/* Grand total row */}
                          <tr style={{background:$.acL,borderTop:'2px solid '+$.bd}}>
                            <td style={{padding:'10px 14px',fontWeight:800,fontSize:12,color:$.ac}}>TOPLAM</td>
                            <td style={{padding:'10px 14px',textAlign:'right',fontFamily:$.mo,fontWeight:800,fontSize:12,color:$.ac}}>{fmt(gt)}</td>
                            <td style={{padding:'10px 14px',textAlign:'right'}}>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(D.s.avgAge),padding:'2px 8px',borderRadius:5,background:acBg(D.s.avgAge)}}>{D.s.avgAge}g</span>
                            </td>
                            {BK.map(b=>{const v=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);return(
                              <td key={b.k} style={{padding:'10px 8px',textAlign:'right',fontFamily:$.mo,fontSize:10.5,fontWeight:700,color:b.c}}>{fmt(v)}</td>
                            );})}
                            <td style={{padding:'10px 14px'}}>
                              {(()=>{const tag={};BK.forEach(b=>{tag[b.k]=pv.reduce((s,r)=>s+(r.ag[b.k]||0),0);});return <SegBar ag={tag} total={gt}/>;})()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top 10 Bar Chart */}
                  <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginTop:16}}>
                    <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,display:'flex',alignItems:'center',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:7,background:$.orgB,color:$.org,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><BarChart3 size={14}/></div>
                      <span style={{fontSize:13,fontWeight:700}}>Top {Math.min(10,pv.length)} — Stok ve Yaşlanma</span>
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      {pv.slice(0,10).map((r,i)=>(
                        <div key={r.n} className="fu" style={{animationDelay:i*30+'ms',marginBottom:10}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                            <span style={{fontSize:12,fontWeight:600,color:$.t1,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.n}</span>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <span style={{fontFamily:$.mo,fontSize:12,fontWeight:700,color:$.t1}}>{fmt(r.total)}</span>
                              <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(r.avg),padding:'2px 8px',borderRadius:5,background:acBg(r.avg)}}>{r.avg}g</span>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <SegBar ag={r.ag} total={r.total} h={14} rd={7}/>
                            <span style={{fontSize:10,fontFamily:$.mo,color:$.t3,fontWeight:600,minWidth:35}}>{gt>0?((r.total/gt)*100).toFixed(0)+'%':''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );})()}

            {/* ===== AYARLAR ===== */}
            {pg==='set'&&(
              <div style={{maxWidth:720}}>
                {/* Veri Yönetimi */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh,marginBottom:16}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.bluB,color:$.blu,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Database size={14}/></div>
                    {'Veri Yönetimi'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
                      <button className="tb-b pr" onClick={()=>fR.current?.click()} style={{padding:'10px 20px',fontSize:12}}><Upload size={14}/>Excel İçe Aktar (.xlsx)</button>
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

                {/* Uygulama Bilgisi */}
                <div style={{background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rL,boxShadow:$.sh}}>
                  <div style={{padding:'15px 18px 13px',borderBottom:'1px solid '+$.bdL,fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:26,height:26,borderRadius:7,background:$.grnB,color:'#0d6e4f',display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Info size={14}/></div>
                    {'Uygulama Bilgisi'}
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:'10px 0',fontSize:12}}>
                      <span style={{color:$.t3,fontWeight:600}}>Uygulama</span><span style={{fontWeight:700}}>TYRO — WH AGENT</span>
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
            <div className="ks" style={{width:320,flexShrink:0,background:'rgba(255,255,255,.72)',backdropFilter:'blur(20px) saturate(160%)',WebkitBackdropFilter:'blur(20px) saturate(160%)',borderLeft:'1px solid rgba(226,231,238,.4)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px 18px',borderBottom:'1px solid '+$.bd,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:ac(sd.avgA)}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:16}}>{sel}</div>
                  <div style={{fontSize:11,color:$.t3}}>{sd.facs.length} tesis - {sd.tWh} depo</div>
                </div>
                <X size={16} color={$.t3} onClick={()=>{setSel(null);setDrillFac(null);setDrillWh(null);}} style={{cursor:'pointer'}}/>
              </div>
              <div style={{flex:1,overflow:'auto',padding:'14px 16px'}}>

                {l2Data?(
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                      <div onClick={()=>{setDrillFac(null);setDrillWh(null);}} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,color:$.blu,fontWeight:600}}><ChevronLeft size={14}/>Geri</div>
                      <span style={{fontSize:12,fontWeight:700}}>{drillWh||drillFac} - Seviye 2</span>
                    </div>
                    {l2Data.map((item,i)=>{const mxQ=l2Data[0]?.q||1;return(
                      <div key={item.n} className="fu" style={{animationDelay:i*30+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'11px 14px',marginBottom:5,boxShadow:$.sh}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                          <span style={{fontWeight:700,fontSize:12}}>{item.n}</span>
                          <span style={{fontFamily:$.mo,fontSize:11,fontWeight:700,color:ac(item.a),padding:'2px 8px',borderRadius:5,background:acBg(item.a)}}>{item.a}g</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:6,borderRadius:3,background:$.bdL,overflow:'hidden'}}><div style={{height:'100%',width:(item.q/mxQ)*100+'%',borderRadius:3,background:ac(item.a),opacity:.5}}/></div>
                          <span style={{fontFamily:$.mo,fontSize:11,fontWeight:600,minWidth:60,textAlign:'right'}}>{fmt(item.q)}</span>
                        </div>
                      </div>);})}
                  </div>
                ):(
                  <div>
                    {/* Mini KPI */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                      {[{l:'Stok',v:fmt(sd.tQ),c:$.blu,bg:$.bluB},{l:'Değer',v:'₺'+fmt(sd.tV),c:'#0d6e4f',bg:$.grnB},{l:'Depo',v:sd.tWh,c:$.pur,bg:$.purB},{l:'Ürün',v:sd.tPc,c:$.org,bg:$.orgB}].map((k,i)=>(
                        <div key={i} style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'11px 13px'}}>
                          <div style={{fontSize:9,color:$.t3,textTransform:'uppercase',fontWeight:700,letterSpacing:1}}>{k.l}</div>
                          <div style={{fontSize:24,fontWeight:800,color:k.c,fontFamily:$.mo,marginTop:3}}>{k.v}</div>
                        </div>))}
                    </div>
                    {/* FIFO aging bar */}
                    <div style={{background:$.bg,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'11px 13px',marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:10,color:$.t3,fontWeight:700}}>FIFO YAŞLANMA</span>
                        <span style={{fontSize:17,fontFamily:$.mo,fontWeight:800,color:ac(sd.avgA)}}>{sd.avgA} gün</span>
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
                      <div key={f.id} className="fu" onClick={()=>{setDrillFac(f.id);setDrillWh(null);}} style={{animationDelay:i*30+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.rM,padding:'10px 13px',marginBottom:4,position:'relative',overflow:'hidden',boxShadow:$.sh,cursor:'pointer'}}>
                        <div style={{position:'absolute',top:0,left:0,bottom:0,width:3,background:ti.color,opacity:.5}}/>
                        <div style={{paddingLeft:8,fontWeight:700,fontSize:12,marginBottom:3}}>{f.n}</div>
                        <div style={{display:'flex',gap:10,paddingLeft:8,fontSize:11,color:$.t2}}>
                          <span style={{fontFamily:$.mo,fontWeight:600,color:$.t1}}>{fmt(f.q)}</span>
                          <span style={{marginLeft:'auto',fontFamily:$.mo,fontWeight:700,color:ac(f.a)}}>{f.a}g</span>
                          <ChevronRight size={13} color={$.t3}/>
                        </div>
                      </div>);})}
                    {tab==='w'&&sd.whs.sort((a,b)=>b.q-a.q).map((w,i)=>(
                      <div key={w.id+i} className="fu" onClick={()=>{setDrillWh(w.id);setDrillFac(null);}} style={{animationDelay:i*25+'ms',background:$.bg2,border:'1px solid '+$.bdL,borderRadius:$.r,padding:'9px 13px',marginBottom:4,cursor:'pointer',boxShadow:$.sh}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                          <span style={{fontWeight:600,fontSize:11,flex:1,color:$.t2}}>{w.n}</span>
                          <span style={{fontFamily:$.mo,fontSize:10,fontWeight:700,color:ac(w.a)}}>{w.a}g</span>
                          <ChevronRight size={12} color={$.t3}/>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{flex:1,height:4,borderRadius:2,background:$.bdL,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(100,(w.q/(sd.whs[0]?.q||1))*100)+'%',borderRadius:2,background:ac(w.a),opacity:.45}}/></div>
                          <span style={{fontSize:10,fontFamily:$.mo,color:$.t2,fontWeight:600}}>{fmt(w.q)}</span>
                        </div>
                      </div>))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Fixed tooltip for KPI info */}
      {hovTip&&pg==='dash'&&(()=>{const tips2=[
        'Tüm tesislerdeki toplam envanter miktarı (ton). Formül: Σ Miktar (tüm satırlar)',
        'Envanterin TL cinsinden toplam değeri. Formül: Σ (Miktar × Birim Fiyat ₺)',
        'Aktif tesis ve depo sayısı. Benzersiz Tesis Kodu ve Depo Kodu sayımı',
        'Stokta bulunan benzersiz ürün (Ürün Adı) sayısı. Ürün çeşitliliği göstergesi',
        'Miktar ağırlıklı ortalama yaşlanma. Formül: Σ(Miktar × PurchFIFO) / Σ Miktar',
        '180 gün ve üzeri PurchFIFO değerine sahip stoklar. Fire ve değer kaybı riski taşır. Oran: Kritik Miktar / Toplam Miktar × 100',
      ];return(
        <div style={{position:'fixed',top:hovTip.y,left:hovTip.x,transform:'translateX(-50%)',width:250,padding:'13px 15px',background:$.bg2,border:'1px solid '+$.bd,borderRadius:$.rM,boxShadow:'0 8px 32px rgba(0,0,0,.15)',zIndex:9999,fontSize:11.5,lineHeight:1.65,color:$.t2,fontWeight:400,pointerEvents:'none'}}>
          <div style={{position:'absolute',top:-6,left:'50%',marginLeft:-6,width:12,height:12,background:$.bg2,border:'1px solid '+$.bd,borderBottom:'none',borderRight:'none',transform:'rotate(45deg)'}}/>
          {tips2[hovTip.i]}
        </div>);})()}
    </div>
  );
}
