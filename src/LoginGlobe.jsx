import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import topoData from './world-110m.json';

const geoData = feature(topoData, topoData.objects.countries);
const R = 2; // küre yarıçap

// Tiryaki tesis şehirleri — hub: ana dağıtım merkezi
const CITIES = [
  { name: 'İstanbul', lat: 41.01, lng: 28.98, hub: true },
  { name: 'Mersin', lat: 36.81, lng: 34.64, hub: true },
  { name: 'Gaziantep', lat: 37.07, lng: 37.38 },
  { name: 'Konya', lat: 37.87, lng: 32.48 },
  { name: 'Bandırma', lat: 40.35, lng: 27.97 },
  { name: 'Samsun', lat: 41.29, lng: 36.33 },
  // Kuzey Amerika
  { name: 'New Orleans', lat: 29.95, lng: -90.07, hub: true },
  { name: 'Montreal', lat: 45.50, lng: -73.57 },
  { name: 'Chicago', lat: 41.88, lng: -87.63 },
  { name: 'Vancouver', lat: 49.28, lng: -123.12 },
  // Orta Doğu
  { name: 'Baghdad', lat: 33.31, lng: 44.37 },
  { name: 'Basra', lat: 30.51, lng: 47.81 },
  // Afrika
  { name: 'Accra', lat: 5.56, lng: -0.19 },
  { name: 'Khartoum', lat: 15.59, lng: 32.53 },
  { name: 'Lagos', lat: 6.52, lng: 3.38 },
  // Avrupa
  { name: 'Bucharest', lat: 44.43, lng: 26.10 },
  { name: 'Brussels', lat: 50.85, lng: 4.35 },
  { name: 'Antwerp', lat: 51.22, lng: 4.40 },
  // Güney Amerika
  { name: 'São Paulo', lat: -23.55, lng: -46.63 },
  // Asya
  { name: 'Mumbai', lat: 19.08, lng: 72.88 },
  { name: 'Singapore', lat: 1.35, lng: 103.82 },
];

// Ticaret akış yolları — tüm dünyaya mal taşınıyor
const ARCS = [
  // İstanbul hub → dünya
  [0, 6], [0, 7], [0, 9], [0, 12], [0, 15], [0, 16], [0, 18], [0, 19], [0, 20],
  // Mersin hub → Orta Doğu + Afrika
  [1, 10], [1, 11], [1, 13], [1, 14],
  // Gaziantep → Irak
  [2, 10], [2, 11],
  // Kuzey Amerika iç
  [6, 7], [6, 8], [7, 9],
  // Afrika iç
  [12, 14],
  // Avrupa
  [16, 17],
];

// Lat/Lng → 3D küre koordinatı
function llv(lat, lng, r = R) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// Arc eğrisi
function createArc(p1, p2, segs = 64) {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(R + p1.distanceTo(p2) * 0.3);
  return new THREE.QuadraticBezierCurve3(p1, mid, p2).getPoints(segs);
}

// ═══════ Kıta çizgileri (GeoJSON → küre üzerinde line segments) ═══════
function ContinentOutlines() {
  const geo = useMemo(() => {
    const pts = [];
    geoData.features.forEach(f => {
      const coords = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      coords.forEach(poly => {
        const ring = poly[0];
        let prev = null;
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          // Antimeridyen atlama tespiti
          if (prev && Math.abs(lng - prev[0]) > 170) { prev = ring[i]; continue; }
          const p = llv(lat, lng, R * 1.002); // küre yüzeyinin hemen üstü
          if (prev) {
            const pp = llv(prev[1], prev[0], R * 1.002);
            pts.push(pp.x, pp.y, pp.z, p.x, p.y, p.z);
          }
          prev = ring[i];
        }
      });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return <lineSegments geometry={geo}><lineBasicMaterial color="#0d6e4f" transparent opacity={0.18} /></lineSegments>;
}

// ═══════ İnce wireframe grid (ultra hafif) ═══════
function WireGlobe() {
  return (
    <mesh>
      <sphereGeometry args={[R, 24, 16]} />
      <meshBasicMaterial color="#0d6e4f" wireframe transparent opacity={0.04} />
    </mesh>
  );
}

// ═══════ Atmosfer glow — tek katman, basit, hafif ═══════
function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[R * 1.12, 48, 32]} />
      <meshBasicMaterial color="#e4f5ee" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ═══════ Tesis ikonu — silo/depo şekli (hub: büyük, normal: küçük) ═══════
function FacilityIcon({ position, hub }) {
  const ref = useRef();
  const ringRef = useRef();
  const col = hub ? '#2dd4a0' : '#60a5fa';
  const s = hub ? 1 : 0.6;

  useFrame(({ clock }) => {
    if (ref.current) {
      // Küre yüzeyine dik durması için — pozisyon vektörüne bak
      const pos = new THREE.Vector3(...position);
      ref.current.lookAt(pos.clone().multiplyScalar(2));
      // Hub pulse
      const sc = hub ? s * (1 + Math.sin(clock.elapsedTime * 1.5) * 0.12) : s;
      ref.current.scale.setScalar(sc);
    }
    if (ringRef.current && hub) {
      const phase = (clock.elapsedTime % 2.5) / 2.5;
      ringRef.current.scale.setScalar(1 + phase * 3);
      ringRef.current.material.opacity = 0.35 * (1 - phase);
    }
  });

  return (
    <group position={position}>
      <group ref={ref}>
        {/* Silo gövdesi (silindir) */}
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.05, 8]} />
          <meshBasicMaterial color={col} />
        </mesh>
        {/* Silo çatısı (koni) */}
        <mesh position={[0, 0.055, 0]}>
          <coneGeometry args={[0.022, 0.025, 8]} />
          <meshBasicMaterial color={col} />
        </mesh>
        {/* Taban platformu */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color={col} transparent opacity={0.3} />
        </mesh>
      </group>
      {/* Halo */}
      <mesh>
        <sphereGeometry args={[hub ? 0.06 : 0.04, 12, 8]} />
        <meshBasicMaterial color={col} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* Hub pulse ring */}
      {hub && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.055, 32]} />
          <meshBasicMaterial color={col} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ═══════ Stok akış konvoyu — kargo parçacıkları arc boyunca akar ═══════
const CONVOY_COUNT = 4; // konvoydaki parçacık sayısı
const CONVOY_GAP = 0.06; // aralarındaki mesafe
function GlowArc({ points, color, delay }) {
  const lineRef = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    g.computeBoundingSphere();
    return g;
  }, [points]);

  // Konvoy parçacıkları ref'leri
  const convoyRefs = useRef([]);
  const haloRefs = useRef([]);

  useFrame(({ clock }) => {
    const speed = 0.18;
    const t = ((clock.elapsedTime * speed + delay) % 1.4); // 1.4 → boşluk bırak

    // Her konvoy parçacığını güncelle
    for (let i = 0; i < CONVOY_COUNT; i++) {
      const particleT = t - i * CONVOY_GAP;
      const mesh = convoyRefs.current[i];
      const halo = haloRefs.current[i];
      if (!mesh || !halo) continue;

      if (particleT < 0 || particleT > 1) {
        mesh.visible = false;
        halo.visible = false;
        continue;
      }
      mesh.visible = true;
      halo.visible = true;

      const pos = curve.getPointAt(Math.min(1, Math.max(0, particleT)));
      mesh.position.copy(pos);
      halo.position.copy(pos);

      // Lider parçacık parlak, arkadakiler sönük (kuyruklu yıldız efekti)
      const fade = 1 - (i / CONVOY_COUNT) * 0.7;
      const edgeFade = Math.sin(particleT * Math.PI); // kenarlar sönük
      mesh.material.opacity = 0.95 * fade * edgeFade;
      halo.material.opacity = 0.25 * fade * edgeFade;

      // Lider büyük, kuyruk küçülür
      const s = 1 - i * 0.15;
      mesh.scale.setScalar(s);
      halo.scale.setScalar(s);
    }

    if (lineRef.current) lineRef.current.material.dashOffset -= 0.002;
  });

  return (
    <group>
      {/* Arc çizgisi — dashed */}
      <line ref={lineRef} geometry={geo}>
        <lineDashedMaterial color={color} transparent opacity={0.3} dashSize={0.08} gapSize={0.06} />
      </line>
      {/* Sabit glow çizgi */}
      <line geometry={geo}>
        <lineBasicMaterial color={color} transparent opacity={0.08} />
      </line>
      {/* Konvoy parçacıkları — kargo akışı */}
      {Array.from({ length: CONVOY_COUNT }).map((_, i) => (
        <group key={i}>
          {/* Çekirdek: küçük parlak küp (kargo) */}
          <mesh ref={el => { convoyRefs.current[i] = el; }} visible={false}>
            <boxGeometry args={[0.035, 0.02, 0.02]} />
            <meshBasicMaterial color={i === 0 ? '#fff' : color} transparent opacity={0.95} />
          </mesh>
          {/* Halo glow */}
          <mesh ref={el => { haloRefs.current[i] = el; }} visible={false}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ═══════ Warp Stars — normal: nokta, animasyonda: ışık çizgisi ═══════
function WarpStars() {
  const ref = useRef();
  const COUNT = 500;
  // Orijinal pozisyonları sakla
  const { geo, origins } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const orig = [];
    for (let i = 0; i < COUNT; i++) {
      const r = 6 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      orig.push({ x, y, z, r });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geo: g, origins: orig };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const loginAnim = typeof window !== 'undefined' && window._tyroLoginAnim;
    const warpT = typeof window !== 'undefined' ? (window._tyroWarpProgress || 0) : 0;
    const mat = ref.current.material;
    const pos = ref.current.geometry.attributes.position;

    if (loginAnim && warpT > 0) {
      // Warp: yıldızlar kameraya doğru çekilir (z küçülür) + büyür
      mat.size = 0.02 + warpT * 0.15;
      mat.opacity = 0.3 + warpT * 0.5;
      for (let i = 0; i < COUNT; i++) {
        const o = origins[i];
        // Z ekseninde kameraya çek
        pos.setZ(i, o.z - warpT * o.z * 0.8);
        // Hafif yanlara yay (speed line efekti)
        pos.setX(i, o.x * (1 + warpT * 0.3));
        pos.setY(i, o.y * (1 + warpT * 0.3));
      }
      pos.needsUpdate = true;
    } else {
      mat.size = 0.02;
      mat.opacity = 0.3;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.02} color="#c4d5e8" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// ═══════ Mouse parallax state (module-level) ═══════
const _mouse = { x: 0, y: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', e => {
    _mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
    _mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
}

// ═══════ Ana sahne ═══════
function Scene() {
  const groupRef = useRef();
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);

  const cityPositions = useMemo(() =>
    CITIES.map(c => ({ ...c, pos: llv(c.lat, c.lng) })), []);

  const arcData = useMemo(() =>
    ARCS.map(([i, j], idx) => ({
      points: createArc(cityPositions[i].pos, cityPositions[j].pos),
      color: idx % 3 === 0 ? '#2dd4a0' : idx % 3 === 1 ? '#60a5fa' : '#8b5cf6',
      delay: idx * 0.11,
    })), [cityPositions]);

  const animStartRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const loginAnim = typeof window !== 'undefined' && window._tyroLoginAnim;

    if (loginAnim && animStartRef.current === 0) animStartRef.current = t;
    const elapsed = loginAnim ? t - animStartRef.current : 0;

    // Warp progress'i global'e yaz (WarpStars okur)
    if (typeof window !== 'undefined') window._tyroWarpProgress = loginAnim ? Math.min(1, elapsed / 2.5) : 0;

    if (!loginAnim) {
      // Normal: yavaş dönüş + mouse parallax
      targetRotY.current = t * 0.06 + _mouse.x * 0.15;
      targetRotX.current = _mouse.y * 0.08;
      groupRef.current.rotation.y += (targetRotY.current - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (targetRotX.current - groupRef.current.rotation.x) * 0.05;
    } else {
      // ═══════ SİNEMATİK VERSE GEÇİŞ ═══════

      // Faz 1 (0-1s): Motor çalışıyor — spin yavaşça hızlanır + titreşim
      const shake = elapsed < 2 ? Math.sin(elapsed * 30) * 0.003 * Math.min(1, elapsed) : 0;
      const spinSpeed = elapsed < 1 ? 0.06 + elapsed * 1.5
                      : elapsed < 2 ? 1.56 + (elapsed - 1) * 2  // hızlanma devam
                      : 3.56; // max hız
      groupRef.current.rotation.y += spinSpeed * 0.016;
      groupRef.current.rotation.x = shake; // titreşim

      // Faz 2 (1-2.5s): Zoom — yavaş başla, dramatik hızlan
      if (state.camera) {
        let zTarget;
        if (elapsed < 1) zTarget = 4.8;
        else if (elapsed < 2) zTarget = 4.8 - (elapsed - 1) * 1.5;
        else zTarget = 3.3 - (elapsed - 2) * 3;
        state.camera.position.z += (Math.max(0.3, zTarget) - state.camera.position.z) * 0.06;
      }

      // Faz 2 (0.5-2.5s): Parlaklık pulse — kıtalar, arc'lar parlar
      groupRef.current.traverse(child => {
        if (!child.material) return;
        if (child.material._origOpacity === undefined) child.material._origOpacity = child.material.opacity;
        if (child.material._origColor === undefined && child.material.color) child.material._origColor = child.material.color.clone();

        if (elapsed > 0.3 && elapsed < 2.5) {
          const pulse = Math.sin((elapsed - 0.3) * Math.PI * 1.2) * 0.4;
          child.material.opacity = Math.min(1, child.material._origOpacity + Math.max(0, pulse));
        }
        // Faz 3 (2.5s+): Beyaz ışığa dönüşüm
        if (elapsed > 2.2) {
          const fade = Math.min(1, (elapsed - 2.2) * 1.5);
          if (child.material.color && child.material._origColor) {
            child.material.color.copy(child.material._origColor).lerp(new THREE.Color('#ffffff'), fade);
          }
          child.material.opacity = Math.max(0, child.material._origOpacity * (1 - fade * 0.8));
        }
      });
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={0.3} color="#2dd4a0" />
      <WarpStars />
      <group ref={groupRef} position={[1.2, -0.2, 0]}> {/* sağa + hafif aşağı kaydır */}
        <WireGlobe />
        <AtmosphereGlow />
        <ContinentOutlines />
        {cityPositions.map((c, i) => (
          <FacilityIcon key={i} position={c.pos.toArray()} hub={c.hub} />
        ))}
        {arcData.map((a, i) => (
          <GlowArc key={i} points={a.points} color={a.color} delay={a.delay} />
        ))}
      </group>
    </>
  );
}

export default function LoginGlobe() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0.6, 4.8], fov: 42 }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
