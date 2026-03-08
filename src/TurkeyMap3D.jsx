import { useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { geoMercator } from 'd3-geo';
import geoData from './turkey-provinces.json';

const projection = geoMercator().center([35.5, 39.5]).scale(80).translate([0, 0]);
const ORBIT_TARGET = new THREE.Vector3(-1.5, 0, 1.5);


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

function CityMarker({ city, maxQty, isSel, isHov, showLabel, acFn, fmt, onSelect, onHover, onHoverEnd }) {
  const [x, y] = projection([city.lng, city.lat]);
  const color = acFn(city.a);
  const ref = useRef();
  const ringRef = useRef();

  // All markers: silo cylinder (min size for small cities)
  const ratio = city.q / maxQty;
  const radius = Math.max(0.1, ratio * 0.5);
  const height = Math.max(0.18, ratio * 2.2);
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

  // --- Silo marker (cylinder) ---
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

// Premium wireframe globe — hollow, only continent outlines + subtle grid
function SpinGlobe() {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.25;
  });

  const { grid, continents } = useMemo(() => {
    const R = 1.0;
    const segs = 64;
    const gPts = [];
    // Latitude circles
    for (const deg of [-60, -30, 0, 30, 60]) {
      const r = Math.cos(deg * Math.PI / 180) * R;
      const yy = Math.sin(deg * Math.PI / 180) * R;
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2;
        const a2 = ((i + 1) / segs) * Math.PI * 2;
        gPts.push(Math.cos(a1)*r, yy, Math.sin(a1)*r, Math.cos(a2)*r, yy, Math.sin(a2)*r);
      }
    }
    // Longitude great-circles
    for (let lng = 0; lng < 180; lng += 30) {
      const t = lng * Math.PI / 180;
      for (let i = 0; i < segs; i++) {
        const p1 = (i / segs) * Math.PI;
        const p2 = ((i + 1) / segs) * Math.PI;
        gPts.push(
          Math.sin(p1)*Math.cos(t)*R, Math.cos(p1)*R, Math.sin(p1)*Math.sin(t)*R,
          Math.sin(p2)*Math.cos(t)*R, Math.cos(p2)*R, Math.sin(p2)*Math.sin(t)*R
        );
      }
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPts, 3));

    // Continent outlines — simplified lat/lng paths
    const CR = 1.004;
    const ll = (lat, lng) => {
      const phi = (90 - lat) * Math.PI / 180;
      const th = lng * Math.PI / 180;
      return [Math.cos(th)*Math.sin(phi)*CR, Math.cos(phi)*CR, Math.sin(th)*Math.sin(phi)*CR];
    };
    const paths = [
      // North America west coast → south
      [[68,-168],[62,-150],[57,-136],[50,-125],[45,-124],[38,-122],[32,-117],[28,-112],[22,-105]],
      // North America east coast
      [[68,-58],[62,-65],[55,-60],[48,-55],[44,-66],[40,-74],[35,-80],[30,-82],[25,-80],[22,-90]],
      // North America arctic
      [[68,-168],[71,-155],[72,-130],[72,-100],[70,-80],[68,-58]],
      // Central America → South America west
      [[22,-105],[18,-95],[15,-87],[10,-84],[8,-77],[5,-77],[0,-80],[-5,-81],[-10,-78],[-18,-72],[-30,-72],[-40,-73],[-48,-75],[-55,-68]],
      // South America east
      [[-55,-68],[-48,-65],[-40,-60],[-32,-52],[-25,-45],[-18,-40],[-10,-37],[-3,-34],[0,-50],[5,-52],[8,-60],[10,-67],[10,-75],[8,-77]],
      // Europe west coast
      [[36,-8],[39,-9],[43,-9],[48,-5],[51,2],[54,6],[57,8],[60,5],[63,5],[66,14],[70,26]],
      // Europe south coast → Turkey
      [[36,-8],[37,-2],[39,0],[42,3],[44,8],[44,13],[41,15],[39,20],[37,27],[41,29],[42,35]],
      // Africa west
      [[36,-8],[32,-10],[25,-15],[18,-17],[12,-17],[6,-8],[4,5],[2,10],[-2,10],[-8,13],[-20,12],[-28,16],[-34,18]],
      // Africa east
      [[-34,18],[-34,27],[-28,33],[-18,38],[-8,42],[2,42],[8,45],[12,44],[18,40],[22,38],[28,34],[30,32],[34,35],[37,36]],
      // Russia north
      [[70,26],[68,45],[65,60],[63,80],[62,100],[64,120],[66,140],[67,160],[66,175]],
      // Asia south coast
      [[42,35],[38,48],[30,48],[25,57],[22,60],[20,67]],
      // India
      [[20,67],[23,72],[20,76],[14,77],[8,77],[10,73],[16,74],[20,67]],
      // Southeast Asia + China coast
      [[22,60],[25,68],[28,72],[30,80],[28,90],[22,100],[18,107],[10,106],[4,103],[-2,105],[-6,106],[-8,115]],
      [[18,107],[22,114],[28,120],[32,122],[36,128],[40,130],[44,135],[48,140],[52,140],[56,137],[60,142],[64,155],[66,175]],
      // Japan
      [[31,131],[34,132],[36,136],[39,140],[42,141],[44,145]],
      // Australia
      [[-24,114],[-18,122],[-14,130],[-12,136],[-17,141],[-22,148],[-28,153],[-34,151],[-38,146],[-38,140],[-35,136],[-32,128],[-28,115],[-24,114]],
      // Britain
      [[50,-5],[52,-3],[55,-2],[58,-3],[58,-6],[55,-7],[51,-6],[50,-5]],
      // New Zealand
      [[-37,175],[-40,173],[-42,172],[-45,167],[-46,168]],
    ];
    const cPts = [];
    paths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const a = ll(path[i][0], path[i][1]);
        const b = ll(path[i+1][0], path[i+1][1]);
        cPts.push(...a, ...b);
      }
    });
    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPts, 3));
    return { grid: gridGeo, continents: cGeo };
  }, []);

  return (
    <group ref={groupRef}>
      {/* Subtle grid lines */}
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#0d6e4f" transparent opacity={0.08} />
      </lineSegments>
      {/* Continent outlines — prominent */}
      <lineSegments geometry={continents}>
        <lineBasicMaterial color="#0d6e4f" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

export default function TurkeyMap3D({ cities, maxQty, sel, hov, onSelect, onHover, onHoverEnd, acFn, fmt, yurtdisi }) {
  const ydActive = sel === 'Yurtdışı';
  return (
    <div style={{ height: 450, overflow: 'hidden', background: 'linear-gradient(180deg,#f0f4f8,#f5f7fa)', borderRadius: '0 0 16px 16px', position: 'relative' }}>
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
      {/* 3D Mini Globe — Yurtdışı */}
      {yurtdisi && (
        <div
          onClick={() => onSelect('Yurtdışı')}
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', transition: 'all .2s ease',
          }}
        >
          <div style={{
            width: 68, height: 68, borderRadius: '50%', overflow: 'hidden',
            background: ydActive ? 'rgba(228,245,238,.95)' : 'rgba(240,244,248,.92)',
            border: ydActive ? '2px solid #0d6e4f' : '1.5px solid #e2e7ee',
            boxShadow: ydActive ? '0 4px 16px rgba(13,110,79,.25)' : '0 4px 16px rgba(0,0,0,.1)',
            backdropFilter: 'blur(12px)',
          }}>
            <Canvas camera={{ position: [0, 0, 2.6], fov: 40 }} gl={{ alpha: true }} dpr={[1, 2]} style={{ width: '100%', height: '100%', background: 'transparent' }}>
              <SpinGlobe />
            </Canvas>
          </div>
          <div style={{
            background: ydActive ? 'rgba(228,245,238,.95)' : 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(12px)',
            border: ydActive ? '2px solid #0d6e4f' : '1.5px solid #e2e7ee',
            borderRadius: 10, padding: '6px 12px',
            boxShadow: ydActive ? '0 4px 16px rgba(13,110,79,.2)' : '0 4px 16px rgba(0,0,0,.07)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ydActive ? '#0d6e4f' : '#1a2332', lineHeight: 1.2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Dünya</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: ydActive ? '#0d6e4f' : '#5a6b7f' }}>{yurtdisi.fc} tesis · {yurtdisi.q > 1e6 ? (yurtdisi.q/1e6).toFixed(1)+'M' : yurtdisi.q > 1e3 ? (yurtdisi.q/1e3).toFixed(0)+'K' : yurtdisi.q} ton</div>
          </div>
        </div>
      )}
    </div>
  );
}
