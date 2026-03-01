import { useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { geoMercator } from 'd3-geo';
import geoData from './turkey-provinces.json';

const projection = geoMercator().center([35.5, 39.5]).scale(80).translate([0, 0]);
const ORBIT_TARGET = new THREE.Vector3(-1.5, 0, 1.5);
const SMALL_THRESH = 0.03;

function geoToShapes(feature) {
  const coords = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  const shapes = [];
  coords.forEach(polygon => {
    const outer = polygon[0];
    if (outer.length < 3) return;
    const shape = new THREE.Shape();
    outer.forEach(([lng, lat], i) => {
      const [x, y] = projection([lng, lat]);
      if (i === 0) shape.moveTo(x, -y);
      else shape.lineTo(x, -y);
    });
    shape.closePath();
    polygon.slice(1).forEach(hole => {
      if (hole.length < 3) return;
      const hp = new THREE.Path();
      hole.forEach(([lng, lat], i) => {
        const [x, y] = projection([lng, lat]);
        if (i === 0) hp.moveTo(x, -y);
        else hp.lineTo(x, -y);
      });
      hp.closePath();
      shape.holes.push(hp);
    });
    shapes.push(shape);
  });
  return shapes;
}

const EXT = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1 };

function MapSurface() {
  const geo = useMemo(() => {
    const geoms = [];
    geoData.features.forEach(f => {
      const shapes = geoToShapes(f);
      shapes.forEach(s => {
        try {
          const g = new THREE.ExtrudeGeometry(s, EXT);
          geoms.push(g);
        } catch (e) { /* skip invalid shapes */ }
      });
    });
    if (geoms.length === 0) return new THREE.BoxGeometry(1, 1, 1);
    const merged = geoms.length === 1 ? geoms[0] : (() => {
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
      <meshStandardMaterial color="#e0f2e9" metalness={0.08} roughness={0.75} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ProvinceBorders() {
  const lines = useMemo(() => {
    const pts = [];
    geoData.features.forEach(f => {
      const coords = f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
      coords.forEach(polygon => {
        const ring = polygon[0];
        for (let i = 0; i < ring.length - 1; i++) {
          const [x1, y1] = projection(ring[i]);
          const [x2, y2] = projection(ring[i + 1]);
          pts.push(x1, 0.18, y1, x2, 0.18, y2);
        }
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#0d6e4f" opacity={0.25} transparent linewidth={1} />
    </lineSegments>
  );
}

function CityMarker({ city, maxQty, isSel, isHov, isSmall, showLabel, acFn, fmt, onSelect, onHover, onHoverEnd }) {
  const [x, y] = projection([city.lng, city.lat]);
  const color = acFn(city.a);
  const ref = useRef();
  const ringRef = useRef();

  // Small markers: just a dot
  const dotRadius = 0.08;
  // Normal markers: cylinder
  const radius = Math.max(0.12, (city.q / maxQty) * 0.5);
  const height = Math.max(0.25, (city.q / maxQty) * 2.2);
  const pos = [x, 0.16, y];

  useFrame((state) => {
    if (ref.current) {
      const target = isSel ? 1.15 : (isHov ? 1.08 : 1);
      ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.1);
      ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, target, 0.1);
    }
    if (ringRef.current && isSel) {
      ringRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      ringRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
  });

  // --- Small marker (dot) ---
  if (isSmall && !isSel) {
    return (
      <group position={pos}>
        <mesh
          ref={ref}
          position={[0, dotRadius, 0]}
          onClick={e => { e.stopPropagation(); onSelect(city.n); }}
          onPointerOver={e => { e.stopPropagation(); onHover(city.n); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { onHoverEnd(); document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[dotRadius, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHov ? 0.4 : 0.1} />
        </mesh>
        {isHov && (
          <Html position={[0, dotRadius * 2 + 0.2, 0]} center style={{ pointerEvents: 'none', transform: 'translate(-50%,-100%)' }}>
            <div style={{
              background: 'rgba(255,255,255,.98)',
              border: '1.5px solid #e2e7ee',
              borderRadius: 10,
              padding: '10px 14px',
              boxShadow: '0 6px 20px rgba(0,0,0,.15)',
              whiteSpace: 'nowrap',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3, color: '#1a2332' }}>{city.n}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 12, color: '#5a6b7f', marginBottom: 2 }}>{fmt(city.q)} ton</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color }}>{city.a} gün FIFO</div>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, fontStyle: 'italic', marginTop: 3 }}>Detay icin tiklayin</div>
            </div>
          </Html>
        )}
      </group>
    );
  }

  // --- Normal marker (cylinder) ---
  return (
    <group position={pos}>
      {isSel && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[radius + 0.12, radius + 0.2, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh
        ref={ref}
        position={[0, height / 2, 0]}
        onClick={e => { e.stopPropagation(); onSelect(city.n); }}
        onPointerOver={e => { e.stopPropagation(); onHover(city.n); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHoverEnd(); document.body.style.cursor = 'default'; }}
      >
        <cylinderGeometry args={[radius, radius * 0.85, height, 20]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSel ? 0.95 : (isHov ? 0.88 : 0.8)}
          emissive={color}
          emissiveIntensity={isSel ? 0.3 : (isHov ? 0.15 : 0.05)}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <sphereGeometry args={[radius * 0.4, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* Default label: only city name, visible based on zoom rank */}
      {(showLabel || isSel) && (
        <Html position={[0, height + 0.35, 0]} center style={{ pointerEvents: 'none', transform: 'translate(-50%,-100%)' }}>
          <div style={{
            background: 'rgba(255,255,255,.95)',
            backdropFilter: 'blur(8px)',
            padding: '3px 8px',
            borderRadius: 7,
            border: isSel ? '2px solid ' + color : '1px solid rgba(0,0,0,.1)',
            boxShadow: '0 2px 10px rgba(0,0,0,.12)',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#1a2332',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              lineHeight: 1.3,
            }}>{city.n}</div>
          </div>
        </Html>
      )}

      {/* Hover tooltip: name + ton + FIFO */}
      {(isHov && !isSel) && (
        <Html position={[0, height + 0.8, 0]} center style={{ pointerEvents: 'none', transform: 'translate(-50%,-100%)' }}>
          <div style={{
            background: 'rgba(255,255,255,.98)',
            border: '1.5px solid #e2e7ee',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 8px 28px rgba(0,0,0,.18)',
            whiteSpace: 'nowrap',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            backdropFilter: 'blur(12px)',
            minWidth: 120,
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: '#1a2332' }}>{city.n}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: '#5a6b7f', marginBottom: 2 }}>{fmt(city.q)} ton</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color, marginBottom: 2 }}>{city.a} gün FIFO</div>
            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, fontStyle: 'italic', marginTop: 3 }}>Detay icin tiklayin</div>
          </div>
        </Html>
      )}

      {/* Selected tooltip: full details */}
      {isSel && (
        <Html position={[0, height + 0.9, 0]} center style={{ pointerEvents: 'none', transform: 'translate(-50%,-100%)' }}>
          <div style={{
            background: 'rgba(255,255,255,.98)',
            border: '2px solid ' + color,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 8px 28px rgba(0,0,0,.18)',
            whiteSpace: 'nowrap',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            backdropFilter: 'blur(12px)',
            minWidth: 140,
          }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 5, color: '#1a2332' }}>{city.n}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 14, color: '#5a6b7f', marginBottom: 3 }}>{fmt(city.q)} ton</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: '#5a6b7f', marginBottom: 3 }}>₺{fmt(city.v)}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color, marginBottom: 3 }}>{city.a} gün FIFO</div>
            <div style={{ fontSize: 12, color: '#8e9bb3', fontWeight: 500, marginTop: 4 }}>{city.fc} tesis · {city.wc} depo</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Tracks camera distance and computes how many labels to show
function ZoomTracker({ onZoomChange }) {
  const { camera } = useThree();
  const prevCount = useRef(-1);
  useFrame(() => {
    const dist = camera.position.distanceTo(ORBIT_TARGET);
    let count;
    if (dist > 18) count = 5;
    else if (dist > 14) count = 8;
    else if (dist > 10) count = 14;
    else count = 999;
    if (count !== prevCount.current) {
      prevCount.current = count;
      onZoomChange(count);
    }
  });
  return null;
}

function Scene({ cities, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt }) {
  const [labelCount, setLabelCount] = useState(5);

  // Sort cities by quantity descending, assign rank
  const rankedCities = useMemo(() => {
    const sorted = [...cities].sort((a, b) => b.q - a.q);
    return sorted.map((c, i) => ({ ...c, _rank: i }));
  }, [cities]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 15, 8]} intensity={0.9} />
      <directionalLight position={[-5, 10, -8]} intensity={0.3} />
      <ZoomTracker onZoomChange={setLabelCount} />
      <MapSurface />
      <ProvinceBorders />
      {rankedCities.map(c => (
        <CityMarker
          key={c.n}
          city={c}
          maxQty={maxQty}
          isSel={sel === c.n}
          isHov={hov === c.n}
          isSmall={(c.q / maxQty) < SMALL_THRESH}
          showLabel={c._rank < labelCount}
          acFn={acFn}
          fmt={fmt}
          onSelect={onSelect}
          onHover={onHover}
          onHoverEnd={onHoverEnd}
        />
      ))}
    </>
  );
}

export default function TurkeyMap3D({ cities, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt }) {
  return (
    <div style={{ height: 450, overflow: 'hidden', background: 'linear-gradient(180deg,#f0f4f8,#f5f7fa)', borderRadius: '0 0 16px 16px' }}>
      <Canvas
        camera={{ position: [-1.5, 9, 15], fov: 45, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          cities={cities}
          maxQty={maxQty}
          sel={sel}
          hov={hov}
          onSelect={onSelect}
          onHover={onHover}
          onHoverEnd={onHoverEnd}
          acFn={acFn}
          fmt={fmt}
        />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.3}
          dampingFactor={0.06}
          enableDamping={true}
          target={[-1.5, 0, 1.5]}
        />
      </Canvas>
    </div>
  );
}
