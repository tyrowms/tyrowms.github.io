import { useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import topoData from './world-110m.json';

const geoData = feature(topoData, topoData.objects.countries);
const projection = geoNaturalEarth1().center([15, 20]).scale(20).translate([0, 0]);

const NAME_TR = {
  'Turkey':'Türkiye','United States of America':'ABD',
  'Canada':'Kanada','Belgium':'Belçika','France':'Fransa','Romania':'Romanya',
  'Iraq':'Irak','Lebanon':'Lübnan','Ghana':'Gana','Sudan':'Sudan',
  'United Arab Emirates':'BAE','Mozambique':'Mozambik','Saudi Arabia':'Suudi Arabistan',
  'Brazil':'Brezilya','Germany':'Almanya','Ukraine':'Ukrayna','India':'Hindistan',
  'Kenya':'Kenya','South Africa':'Güney Afrika','Tanzania':'Tanzanya',
  'Nigeria':'Nijerya','Morocco':'Fas','Tunisia':'Tunus','Algeria':'Cezayir',
  'Singapore':'Singapur','China':'Çin','Russia':'Rusya'
};

function geoToShapes(feat) {
  const coords = feat.geometry.type === 'Polygon'
    ? [feat.geometry.coordinates] : feat.geometry.coordinates;
  const shapes = [];
  coords.forEach(polygon => {
    const outer = polygon[0];
    if (outer.length < 3) return;
    const shape = new THREE.Shape();
    outer.forEach(([lng, lat], i) => {
      const p = projection([lng, lat]);
      if (!p) return;
      if (i === 0) shape.moveTo(p[0], -p[1]); else shape.lineTo(p[0], -p[1]);
    });
    shape.closePath();
    polygon.slice(1).forEach(hole => {
      if (hole.length < 3) return;
      const hp = new THREE.Path();
      hole.forEach(([lng, lat], i) => {
        const p = projection([lng, lat]);
        if (!p) return;
        if (i === 0) hp.moveTo(p[0], -p[1]); else hp.lineTo(p[0], -p[1]);
      });
      hp.closePath();
      shape.holes.push(hp);
    });
    shapes.push(shape);
  });
  return shapes;
}

const EXT_OFF = { depth: 0.04, bevelEnabled: false };
const EXT_ON = { depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 2 };

function mergeGeos(geoms) {
  if (!geoms.length) return null;
  const positions = [], normals = [], indices = [];
  let offset = 0;
  geoms.forEach(g => {
    if (!g.attributes.position) return;
    const pos = g.attributes.position.array;
    const nrm = g.attributes.normal ? g.attributes.normal.array : new Float32Array(pos.length);
    const idx = g.index ? Array.from(g.index.array) : [];
    for (let i = 0; i < pos.length; i++) positions.push(pos[i]);
    for (let i = 0; i < nrm.length; i++) normals.push(nrm[i]);
    idx.forEach(i => indices.push(i + offset));
    offset += pos.length / 3;
  });
  if (!positions.length) return null;
  const t = new THREE.BufferGeometry();
  t.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  t.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (indices.length) t.setIndex(indices);
  return t;
}

// Aurora gradient renk paleti — iki renk arası blend
const AURORA = [
  { max: 60, a: '#2dd4a0', b: '#06b6d4' },   // taze: mint → cyan
  { max: 90, a: '#06b6d4', b: '#3b82f6' },    // iyi: cyan → blue
  { max: 180, a: '#3b82f6', b: '#8b5cf6' },   // orta: blue → violet
  { max: 365, a: '#8b5cf6', b: '#ec4899' },   // riskli: violet → pink
  { max: 9999, a: '#ec4899', b: '#f43f5e' },  // kritik: pink → rose
];
function agingColor(days) {
  for (const band of AURORA) {
    if (days < band.max) {
      const prev = AURORA[AURORA.indexOf(band) - 1];
      const lo = prev ? prev.max : 0;
      const t = Math.min((days - lo) / (band.max - lo), 1);
      return new THREE.Color(band.a).lerp(new THREE.Color(band.b), t);
    }
  }
  return new THREE.Color('#f43f5e');
}
function agingColor2(days) {
  // İkinci aurora renk — emissive için daha açık ton
  for (const band of AURORA) {
    if (days < band.max) return new THREE.Color(band.b);
  }
  return new THREE.Color('#f43f5e');
}

function WorldSurface({ countryDataMap }) {
  const { offGeo, entries } = useMemo(() => {
    const dMap = countryDataMap || {};
    const offGeoms = [], entries = [];
    geoData.features.forEach(f => {
      const name = f.properties?.name || '';
      const trName = NAME_TR[name] || name;
      const cd = dMap[trName];
      const shapes = geoToShapes(f);
      if (cd && cd.q > 0) {
        const gs = [];
        shapes.forEach(s => { try { gs.push(new THREE.ExtrudeGeometry(s, EXT_ON)); } catch(e){} });
        if (gs.length) {
          const mg = mergeGeos(gs); gs.forEach(g => g.dispose());
          if (mg) entries.push({ geo: mg, color: agingColor(cd.a), color2: agingColor2(cd.a) });
        }
      } else {
        shapes.forEach(s => { try { offGeoms.push(new THREE.ExtrudeGeometry(s, EXT_OFF)); } catch(e){} });
      }
    });
    const og = mergeGeos(offGeoms); offGeoms.forEach(g => g.dispose());
    return { offGeo: og, entries };
  }, [countryDataMap]);

  return (
    <>
      {offGeo && <mesh rotation={[-Math.PI/2,0,0]} geometry={offGeo}>
        <meshBasicMaterial color="#edf1f6" side={THREE.DoubleSide} />
      </mesh>}
      {entries.map((e,i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} geometry={e.geo}>
          <meshPhysicalMaterial
            color={e.color} metalness={0.2} roughness={0.1}
            clearcoat={1} clearcoatRoughness={0.05}
            iridescence={0.6} iridescenceIOR={1.4}
            emissive={e.color2 || e.color} emissiveIntensity={0.28}
            transparent opacity={0.78}
            side={THREE.DoubleSide}
            sheen={0.4} sheenColor={e.color2 || e.color}
          />
        </mesh>
      ))}
    </>
  );
}

function Borders() {
  const geo = useMemo(() => {
    const pts = [];
    geoData.features.forEach(f => {
      const coords = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      coords.forEach(poly => {
        const ring = poly[0];
        for (let i = 0; i < ring.length - 1; i++) {
          const a = projection(ring[i]), b = projection(ring[i+1]);
          if (a && b) pts.push(a[0], 0.14, a[1], b[0], 0.14, b[1]);
        }
      });
    });
    if (!pts.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  if (!geo) return null;
  return <lineSegments geometry={geo}><lineBasicMaterial color="#0d6e4f" transparent opacity={0.12} /></lineSegments>;
}

function Marker({ c, maxQty, isSel, isHov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon }) {
  const ref = useRef(), ringRef = useRef();
  const isDiger = c.n === 'Diğer';
  const p = projection([c.lng, c.lat]);
  if (!p) return null;
  const color = isDiger ? new THREE.Color('#6366f1') : acFn(c.a);
  const qr = Math.max(c.q / (maxQty || 1), 0.06);
  const h = isDiger ? 0.15 : (0.3 + qr * 2.8), r = isDiger ? 0.25 : (0.15 + qr * 0.35);

  useFrame(state => {
    if (!ref.current) return;
    const t = isSel ? 1.18 : isHov ? 1.1 : 1;
    ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, t, 0.1);
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, t, 0.1);
    ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, t, 0.1);
    if (ringRef.current) {
      ringRef.current.visible = isSel;
      if (isSel) { const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15; ringRef.current.scale.set(s,s,s); }
    }
  });

  return (
    <group position={[p[0], 0, p[1]]} ref={ref}>
      <mesh position={[0,(h+.3)/2,0]}
        onClick={e => { e.stopPropagation(); onSelect(c.n); }}
        onPointerOver={e => { e.stopPropagation(); onHover(c.n); document.body.style.cursor='pointer'; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor='default'; }}>
        <cylinderGeometry args={[r*3, r*3, h+1.2, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI/2,0,0]} position={[0,.05,0]} visible={false}>
        <ringGeometry args={[r*2.8, r*3.8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {isDiger ? (
        /* Diğer: denizde düz disk + ⚓ */
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,.16,0]}>
          <circleGeometry args={[0.35, 24]} />
          <meshStandardMaterial color={color} transparent opacity={isSel?.9:isHov?.8:.65}
            emissive={color} emissiveIntensity={.3} metalness={.15} roughness={.3} />
        </mesh>
      ) : (<>
        <mesh position={[0, h/2+.14, 0]}>
          <cylinderGeometry args={[r, r*.85, h, 12]} />
          <meshStandardMaterial color={color} transparent opacity={isSel?.95:isHov?.88:.8}
            emissive={color} emissiveIntensity={isSel?.35:isHov?.25:.15} metalness={.1} roughness={.6} />
        </mesh>
        <mesh position={[0, h+.14, 0]}>
          <sphereGeometry args={[r, 12, 8, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={.25} />
        </mesh>
      </>)}
      <Html position={[0, isDiger ? .8 : h+.8, 0]} center zIndexRange={[1,0]} style={{ pointerEvents:'none', whiteSpace:'nowrap' }}>
        <div style={{ fontSize:isDiger?11:13, fontWeight:700, color:isDiger?'#6366f1':'#1a2332', fontFamily:"'Plus Jakarta Sans',sans-serif",
          background:'rgba(255,255,255,.72)', backdropFilter:'blur(14px) saturate(180%)', WebkitBackdropFilter:'blur(14px) saturate(180%)',
          padding:'5px 12px', borderRadius:8,
          boxShadow:'0 2px 10px rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.9)',
          border:'1px solid rgba(255,255,255,.65)' }}>{isDiger?'⚓ ':''}{c.n}</div>
      </Html>
      {isHov && !isSel && (
        <Html position={[0, h+1.8, 0]} center zIndexRange={[9999,9990]} style={{ pointerEvents:'none', whiteSpace:'nowrap' }}>
          <div style={{ background:'rgba(255,255,255,.72)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)',
            borderRadius:16, padding:'14px 20px', boxShadow:'0 8px 32px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9)',
            border:'1px solid rgba(255,255,255,.7)', fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:180 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#1a2332', marginBottom:8 }}>{c.n}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px', fontSize:13, marginBottom:10 }}>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>Stok</div><div style={{ fontWeight:700, color:'#3b82f6', fontSize:14 }}>{fmtTon(c.q)}</div></div>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>Değer</div><div style={{ fontWeight:700, color:'#0d6e4f', fontSize:14 }}>₺{fmt(c.v)}</div></div>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>Tesis</div><div style={{ fontWeight:700, color:'#8b5cf6', fontSize:14 }}>{c.fc}</div></div>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>FIFO Yaş</div><div style={{ fontWeight:700, color, fontSize:14 }}>{c.a} gün</div></div>
            </div>
            <div style={{ fontSize:11, color:'#0d6e4f', fontWeight:600, textAlign:'center', padding:'6px 0', background:'rgba(13,110,79,.06)', borderRadius:8 }}>Detay için tıklayın</div>
          </div>
        </Html>
      )}
      {isSel && (
        <Html position={[0, h+1.8, 0]} center zIndexRange={[9999,9990]} style={{ pointerEvents:'none', whiteSpace:'nowrap' }}>
          <div style={{ background:'rgba(255,255,255,.78)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)',
            borderRadius:18, padding:'16px 22px', boxShadow:`0 12px 40px rgba(0,0,0,.12), 0 0 0 1px ${color}22, inset 0 1px 0 rgba(255,255,255,.9)`,
            border:`1.5px solid ${color}33`, fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:200 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'#1a2332', marginBottom:10 }}>{c.n}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px 16px', fontSize:13, marginBottom:10 }}>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>Stok</div><div style={{ fontWeight:700, color:'#3b82f6', fontSize:15 }}>{fmtTon(c.q)}</div></div>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>Değer</div><div style={{ fontWeight:700, color:'#0d6e4f', fontSize:15 }}>₺{fmt(c.v)}</div></div>
              <div><div style={{ color:'#8e9bb3', fontSize:11, marginBottom:2 }}>FIFO Yaş</div><div style={{ fontWeight:700, color, fontSize:15 }}>{c.a} gün</div></div>
            </div>
            <div style={{ display:'flex', gap:8, fontSize:12 }}>
              <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(139,92,246,.08)', fontWeight:600, color:'#8b5cf6' }}>{c.fc} tesis</span>
              <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(245,166,35,.08)', fontWeight:600, color:'#f5a623' }}>{c.wc} depo</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ClickPlane({ onDeselect }) {
  return (
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.15,0]}
      onClick={e => { e.stopPropagation(); onDeselect(); }}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function Scene({ countries, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon, fN }) {
  const sorted = useMemo(() => [...countries].sort((a, b) => b.q - a.q), [countries]);
  const dataMap = useMemo(() => {
    const m = {};
    countries.forEach(c => { m[c.n] = { q: c.q, a: c.a }; });
    return m;
  }, [countries]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 15, 0]} intensity={0.5} />
      <directionalLight position={[8, 10, 5]} intensity={0.3} />
      <ClickPlane onDeselect={() => onSelect(null)} />
      <WorldSurface countryDataMap={dataMap} />
      <Borders />
      {sorted.map(c => (
        <Marker key={c.n} c={c} maxQty={maxQty}
          isSel={sel===c.n} isHov={hov===c.n}
          onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd}
          acFn={acFn} fmt={fmt} fmtTon={fmtTon} fN={fN} />
      ))}
    </>
  );
}

// Tesisli ülkelerin enlem/boylam sınırlarından kamera hesapla
function computeView(countries) {
  if (!countries.length) return { camY: 30, cx: 0, cz: 0 };
  let minLat=90, maxLat=-90, minLng=180, maxLng=-180;
  countries.forEach(c => {
    minLat = Math.min(minLat, c.lat); maxLat = Math.max(maxLat, c.lat);
    minLng = Math.min(minLng, c.lng); maxLng = Math.max(maxLng, c.lng);
  });
  // Sınırlara pay ekle
  const latPad = Math.max((maxLat - minLat) * 0.3, 8);
  const lngPad = Math.max((maxLng - minLng) * 0.15, 10);
  // Padded sınırları projeksiyondan geçir
  const pTL = projection([minLng - lngPad, maxLat + latPad]);
  const pBR = projection([maxLng + lngPad, minLat - latPad]);
  const pC = projection([(minLng + maxLng) / 2, (minLat + maxLat) / 2]);
  if (!pTL || !pBR || !pC) return { camY: 30, cx: 0, cz: 0 };
  const cx = pC[0];
  const cz = pC[1];
  const spanX = Math.abs(pBR[0] - pTL[0]);
  const spanZ = Math.abs(pBR[1] - pTL[1]);
  // Geniş ekran: yatay span aspect ratio'ya bölünür (canvas ~3:1)
  const fovRad = 40 * Math.PI / 180;
  const camFromZ = (spanZ / 2) / Math.tan(fovRad / 2);
  const camFromX = (spanX / 2) / Math.tan(fovRad / 2) / 2.8; // wide canvas aspect ~2.8:1
  const camY = Math.max(camFromZ, camFromX, 12);
  return { camY, cx, cz };
}

export default function WorldMap3D({ countries, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon, fN, onGlobalClick, globalActive, onSwitchToTurkey }) {
  // Türkiye'ye tıklandığında dashboard'daysa Türkiye haritasına geç
  const wrappedSelect = useCallback((name) => {
    if (name === 'Türkiye' && onSwitchToTurkey) { onSwitchToTurkey(); return; }
    onSelect(name);
  }, [onSelect, onSwitchToTurkey]);
  // İlk render'da hesapla — sonraki güncellemelerde değişmez
  const view = useMemo(() => computeView(countries), [countries]);

  return (
    <div style={{ height: 500, overflow:'hidden', background:'linear-gradient(180deg,#eaeff5,#f5f7fa)', borderRadius:'0 0 16px 16px', position:'relative' }}>
      <Canvas
        camera={{ position:[view.cx, view.camY, view.cz + 0.01], fov:40, near:0.1, far:300, up:[0,1,0] }}
        dpr={[1,1.5]} style={{ width:'100%', height:'100%' }}
      >
        <Scene countries={countries} maxQty={maxQty}
          sel={sel} hov={hov} onSelect={wrappedSelect} onHover={onHover} onHoverEnd={onHoverEnd}
          acFn={acFn} fmt={fmt} fmtTon={fmtTon} fN={fN} />
        <OrbitControls
          enablePan={true} enableZoom={true} enableRotate={false}
          screenSpacePanning={false}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
          minDistance={5} maxDistance={80}
          dampingFactor={0.08} enableDamping={true}
          panSpeed={1.2}
          target={[view.cx, 0, view.cz]}
        />
      </Canvas>
      <div onClick={onGlobalClick} style={{ position:'absolute', top:12, left:14, zIndex:5, cursor:'pointer',
        background: globalActive ? 'rgba(228,245,238,.92)' : 'rgba(255,255,255,.65)',
        backdropFilter:'blur(16px) saturate(180%)', WebkitBackdropFilter:'blur(16px) saturate(180%)',
        borderRadius:12, padding:'10px 16px',
        border: globalActive ? '2px solid #0d6e4f' : '1px solid rgba(255,255,255,.7)',
        boxShadow: globalActive ? '0 4px 20px rgba(13,110,79,.2), inset 0 1px 0 rgba(255,255,255,.9)' : '0 4px 16px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9)',
        transition:'all .2s ease' }}>
        <div style={{ fontSize:13, fontWeight:700, color: globalActive ? '#0d6e4f' : '#1a2332', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Küresel Operasyonlar</div>
        <div style={{ fontSize:11, fontWeight:500, color: globalActive ? '#0d6e4f' : '#5a6b7f', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{countries.length} ülke · {countries.reduce((s,c)=>s+c.fc,0)} tesis</div>
      </div>
    </div>
  );
}
