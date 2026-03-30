import { useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import topoData from './world-110m.json';

const geoData = feature(topoData, topoData.objects.countries);
const projection = geoNaturalEarth1().center([20, 10]).scale(22).translate([0, 0]);
const ORBIT_TARGET = new THREE.Vector3(0, 0, 0);

function geoToShapes(feat) {
  const coords = feat.geometry.type === 'Polygon'
    ? [feat.geometry.coordinates]
    : feat.geometry.coordinates;
  const shapes = [];
  coords.forEach(polygon => {
    const outer = polygon[0];
    if (outer.length < 3) return;
    const shape = new THREE.Shape();
    outer.forEach(([lng, lat], i) => {
      const p = projection([lng, lat]);
      if (!p) return;
      if (i === 0) shape.moveTo(p[0], -p[1]);
      else shape.lineTo(p[0], -p[1]);
    });
    shape.closePath();
    polygon.slice(1).forEach(hole => {
      if (hole.length < 3) return;
      const hp = new THREE.Path();
      hole.forEach(([lng, lat], i) => {
        const p = projection([lng, lat]);
        if (!p) return;
        if (i === 0) hp.moveTo(p[0], -p[1]);
        else hp.lineTo(p[0], -p[1]);
      });
      hp.closePath();
      shape.holes.push(hp);
    });
    shapes.push(shape);
  });
  return shapes;
}

const EXT = { depth: 0.08, bevelEnabled: false };

function WorldSurface() {
  const geo = useMemo(() => {
    const geoms = [];
    geoData.features.forEach(f => {
      const shapes = geoToShapes(f);
      shapes.forEach(s => {
        try {
          const g = new THREE.ExtrudeGeometry(s, EXT);
          geoms.push(g);
        } catch (e) { /* skip */ }
      });
    });
    if (geoms.length === 0) return new THREE.BoxGeometry(1, 1, 1);
    const merged = (() => {
      const total = new THREE.BufferGeometry();
      const positions = [], normals = [], indices = [];
      let offset = 0;
      geoms.forEach(g => {
        const pos = g.attributes.position.array;
        const nrm = g.attributes.normal.array;
        const idx = g.index ? Array.from(g.index.array) : [];
        for (let i = 0; i < pos.length; i++) positions.push(pos[i]);
        for (let i = 0; i < nrm.length; i++) normals.push(nrm[i]);
        idx.forEach(i => indices.push(i + offset));
        offset += pos.length / 3;
      });
      total.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      total.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      total.setIndex(indices);
      return total;
    })();
    geoms.forEach(g => g.dispose());
    return merged;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#e0f2e9" metalness={0.05} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CountryBorders() {
  const lines = useMemo(() => {
    const pts = [];
    geoData.features.forEach(f => {
      const coords = f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
      coords.forEach(polygon => {
        const ring = polygon[0];
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = projection(ring[i]);
          const p2 = projection(ring[i + 1]);
          if (!p1 || !p2) continue;
          pts.push(p1[0], 0.1, p1[1], p2[0], 0.1, p2[1]);
        }
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#0d6e4f" transparent opacity={0.2} />
    </lineSegments>
  );
}

function CountryMarker({ country, maxQty, isSel, isHov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon, fN }) {
  const ref = useRef();
  const ringRef = useRef();
  const p = projection([country.lng, country.lat]);
  if (!p) return null;

  const color = acFn(country.a);
  const qr = Math.max(country.q / (maxQty || 1), 0.08);
  const height = 0.3 + qr * 2.5;
  const radius = 0.12 + qr * 0.25;

  useFrame((state) => {
    if (!ref.current) return;
    const target = isSel ? 1.15 : (isHov ? 1.08 : 1.0);
    ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.1);
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, target, 0.1);
    ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, target, 0.1);
    if (ringRef.current) {
      ringRef.current.visible = isSel;
      if (isSel) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
        ringRef.current.scale.set(s, s, s);
      }
    }
  });

  return (
    <group position={[p[0], 0, p[1]]} ref={ref}>
      {/* Invisible hitbox */}
      <mesh position={[0, (height + 0.3) / 2, 0]}
        onClick={e => { e.stopPropagation(); onSelect(country.n); }}
        onPointerOver={e => { e.stopPropagation(); onHover(country.n); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor = 'default'; }}>
        <cylinderGeometry args={[radius * 2.5, radius * 2.5, height + 1, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Selection ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} visible={false}>
        <ringGeometry args={[radius * 2.5, radius * 3.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Silo cylinder */}
      <mesh position={[0, height / 2 + 0.1, 0]}>
        <cylinderGeometry args={[radius, radius * 0.85, height, 12]} />
        <meshStandardMaterial
          color={color} transparent opacity={isSel ? 0.95 : (isHov ? 0.88 : 0.8)}
          emissive={color} emissiveIntensity={isSel ? 0.3 : (isHov ? 0.2 : 0.1)}
          metalness={0.1} roughness={0.6}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, height + 0.1, 0]}>
        <sphereGeometry args={[radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Hover tooltip */}
      {isHov && !isSel && (
        <Html position={[0, height + 0.8, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{
            background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,.1)',
            border: '1px solid rgba(226,231,238,.5)', fontFamily: "'Plus Jakarta Sans',sans-serif"
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2332', marginBottom: 2 }}>{country.n}</div>
            <div style={{ fontSize: 10, color: '#5a6b7f', fontWeight: 500 }}>{fmtTon(country.q)} · FIFO {country.a}g</div>
            <div style={{ fontSize: 9, color: '#8e9bb3', marginTop: 2 }}>Detay icin tiklayin</div>
          </div>
        </Html>
      )}
      {/* Selected tooltip */}
      {isSel && (
        <Html position={[0, height + 0.8, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 12, padding: '10px 14px', boxShadow: '0 6px 24px rgba(0,0,0,.12)',
            border: `1.5px solid ${color}33`, fontFamily: "'Plus Jakarta Sans',sans-serif"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2332', marginBottom: 3 }}>{country.n}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#5a6b7f', fontWeight: 600 }}>
              <span>{fmtTon(country.q)}</span>
              <span style={{ color: '#0d6e4f' }}>₺{fmt(country.v)}</span>
              <span style={{ color }}>{country.a}g FIFO</span>
            </div>
            <div style={{ fontSize: 9, color: '#8e9bb3', marginTop: 3 }}>{country.fc} tesis · {country.wc} depo</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ZoomTracker({ countries, onVisibleCount }) {
  const { camera } = useThree();
  const lastCount = useRef(999);
  useFrame(() => {
    const dist = camera.position.distanceTo(ORBIT_TARGET);
    const c = dist > 22 ? 5 : dist > 16 ? 10 : dist > 12 ? 20 : 999;
    if (c !== lastCount.current) { lastCount.current = c; onVisibleCount(c); }
  });
  return null;
}

function Scene({ countries, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon, fN }) {
  const [visCount, setVisCount] = useState(5);
  const sorted = useMemo(() => [...countries].sort((a, b) => b.q - a.q), [countries]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 12, 5]} intensity={0.6} />
      <directionalLight position={[-5, 8, -3]} intensity={0.3} />
      <WorldSurface />
      <CountryBorders />
      <ZoomTracker countries={countries} onVisibleCount={setVisCount} />
      {sorted.slice(0, visCount).map(c => (
        <CountryMarker
          key={c.n} country={c} maxQty={maxQty}
          isSel={sel === c.n} isHov={hov === c.n}
          onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd}
          acFn={acFn} fmt={fmt} fmtTon={fmtTon} fN={fN}
        />
      ))}
    </>
  );
}

export default function WorldMap3D({ countries, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt, fmtTon, fN }) {
  return (
    <div style={{ height: 450, overflow: 'hidden', background: 'linear-gradient(180deg,#eef3f8,#f5f7fa)', borderRadius: '0 0 16px 16px', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 14, 28], fov: 42, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          countries={countries} maxQty={maxQty}
          sel={sel} hov={hov}
          onSelect={onSelect} onHover={onHover} onHoverEnd={onHoverEnd}
          acFn={acFn} fmt={fmt} fmtTon={fmtTon} fN={fN}
        />
        <OrbitControls
          enablePan={true} enableZoom={true} enableRotate={true}
          minDistance={6} maxDistance={50}
          minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 2.3}
          dampingFactor={0.06} enableDamping={true}
          target={[0, 0, 0]}
        />
      </Canvas>
      {/* Title overlay */}
      <div style={{
        position: 'absolute', top: 12, left: 14, zIndex: 5,
        background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 10, padding: '6px 12px', border: '1px solid rgba(226,231,238,.4)',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2332', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Küresel Operasyonlar</div>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#5a6b7f', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{countries.length} ülke · {countries.reduce((s, c) => s + c.fc, 0)} tesis</div>
      </div>
    </div>
  );
}
