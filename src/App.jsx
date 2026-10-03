import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import "../enterprise.css";

const MODEL_URL = "https://sceneview.github.io/models/platforms/ferrari_f40.glb";

const specs = [
  ["478", "HP", "Twin-turbo V8"],
  ["324", "KM/H", "Top speed"],
  ["1,100", "KG", "Dry weight"],
  ["4.1", "SEC", "0—100 km/h"]
];

const hotspots = [
  { p: [1.25, 0.35, 0.45], title: "WIDE STANCE", copy: "A low, aggressive footprint built around the F40 silhouette." },
  { p: [-0.95, 0.42, 0.35], title: "TWIN TURBO V8", copy: "The engine is the centre of the story: compact, brutal and purposeful." },
  { p: [0.15, 0.65, -1.2], title: "REAR WING", copy: "A defining piece of the aerodynamic profile." }
];

function CameraDirector({ progress }) {
  const ref = useRef();
  useFrame((state) => {
    const p = progress.current;
    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(4.8, -4.2, p),
      THREE.MathUtils.lerp(2.0, 1.0, p),
      THREE.MathUtils.lerp(5.6, 4.2, p)
    );
    ref.current.position.lerp(target, 0.055);
    ref.current.lookAt(
      THREE.MathUtils.lerp(0, 0.25, p),
      THREE.MathUtils.lerp(0.35, 0.15, p),
      THREE.MathUtils.lerp(0, -0.15, p)
    );
    state.camera.position.copy(ref.current.position);
    state.camera.quaternion.copy(ref.current.quaternion);
  });
  return <perspectiveCamera ref={ref} makeDefault fov={34} position={[4.8, 2, 5.6]} />;
}

function F40({ color, detail, progress }) {
  const { scene } = useGLTF(MODEL_URL);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clone.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => {
        if (!mat) return;
        const name = (mat.name || obj.name || "").toLowerCase();
        if (/paint|body|red|ferrari|car/.test(name)) {
          mat.color.set(color);
          mat.metalness = 0.72;
          mat.roughness = 0.2;
          mat.clearcoat = 1;
          mat.clearcoatRoughness = 0.08;
        }
        if (/glass|window|windshield/.test(name)) {
          mat.transparent = true;
          mat.opacity = 0.72;
          mat.roughness = 0.05;
          mat.metalness = 0.35;
        }
      });
    });
  }, [clone, color]);

  return (
    <group scale={detail ? 1.15 : 1} rotation={[0, progress.current * Math.PI * 0.5, 0]}>
      <primitive object={clone} />
      {hotspots.map((h) => (
        <Html key={h.title} position={h.p} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="hotspot"><span /><div><b>{h.title}</b><small>{h.copy}</small></div></div>
        </Html>
      ))}
    </group>
  );
}

function Showroom({ color, detail, progress }) {
  return (
    <Canvas dpr={[1, 1.75]} shadows gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 9, 22]} />
      <ambientLight intensity={0.35} />
      <spotLight position={[4, 7, 5]} intensity={180} angle={0.45} penumbra={1} castShadow />
      <spotLight position={[-5, 2, -3]} intensity={110} color="#e51b23" angle={0.5} penumbra={1} />
      <pointLight position={[1, 1, 4]} intensity={40} color="#fff2dc" />
      <Suspense fallback={<Html center><div className="loader">LOADING MACHINE</div></Html>}>
        <Environment preset="city" environmentIntensity={0.75} />
        <CameraDirector progress={progress} />
        <Float speed={0.7} rotationIntensity={0.04} floatIntensity={0.08}>
          <F40 color={color} detail={detail} progress={progress} />
        </Float>
        <ContactShadows position={[0, -0.72, 0]} opacity={0.5} scale={10} blur={2.8} far={4} />
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate />
    </Canvas>
  );
}

export default function App() {
  const progress = useRef(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [menu, setMenu] = useState(false);
  const [color, setColor] = useState("#b80f17");
  const [detail, setDetail] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max ? window.scrollY / max : 0;
      progress.current = value;
      setScrollPercent(value);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(() => setLoaded(true), 900);
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, []);

  const go = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  };

  return (
    <div className="f40-site">
      <div className="grain" />
      <header className="topbar">
        <button className="brand" onClick={() => go("#hero")}><b>F40</b><span>DIGITAL<br/>ARCHIVE</span></button>
        <div className="top-center">MARANELLO <i>×</i> 1987</div>
        <button className="menu-button" onClick={() => setMenu(!menu)}>{menu ? "CLOSE" : "MENU"} <span>☰</span></button>
        {menu && <nav className="menu-panel">
          <button onClick={() => go("#hero")}>00 / ARRIVAL</button>
          <button onClick={() => go("#story")}>01 / THE MACHINE</button>
          <button onClick={() => go("#data")}>02 / THE NUMBERS</button>
          <button onClick={() => go("#studio")}>03 / THE STUDIO</button>
        </nav>}
      </header>
      <div className="progress-line"><span style={{ transform: `scaleX(${scrollPercent})` }} /></div>

      <section className="hero" id="hero">
        <div className="hero-canvas"><Showroom color={color} detail={detail} progress={progress} /></div>
        <div className="hero-copy">
          <small>FERRARI F40 / DIGITAL ARCHIVE 001</small>
          <h1>THE<br/><em>ICON</em><br/>ARRIVES.</h1>
          <p>A living 3D object. Drag it. Scroll around it. Change the light. Get closer.</p>
          <button onClick={() => go("#story")}>ENTER THE MACHINE <b>↓</b></button>
        </div>
        <div className="hero-meta"><span>1987—1992</span><span>NATIVE WEBGL / GLB</span><span>REAL-TIME MATERIALS</span></div>
        <div className="hero-number">40</div>
      </section>

      <section className="story" id="story">
        <div className="story-intro"><span>01 / THE MACHINE</span><h2>NOT A<br/><i>POSTER.</i><br/>A PRESENCE.</h2><p>The model is now native WebGL, so the camera, materials, lighting and interaction belong to the experience.</p></div>
        <div className="story-card"><div className="card-kicker">LIVE CONTROL</div><strong>SCROLL<br/>BECOMES<br/>CAMERA.</strong><small>Every movement through the page changes the machine's point of view.</small></div>
      </section>

      <section className="numbers" id="data">
        <div className="numbers-head"><span>02 / THE NUMBERS</span><p>FOUR NUMBERS. ONE LEGEND.</p></div>
        <div className="spec-grid">{specs.map(([n,u,l]) => <article key={l}><strong>{n}</strong><em>{u}</em><span>{l}</span></article>)}</div>
      </section>

      <section className="facts" id="facts" aria-labelledby="f40-facts-title">
        <div className="facts-label">FERRARI F40 / THE STORY</div>
        <div className="facts-grid">
          <div>
            <h2 id="f40-facts-title">A ROAD CAR<br/><em>BUILT LIKE A<br/>STATEMENT.</em></h2>
          </div>
          <div className="facts-copy">
            <p>The Ferrari F40 was introduced in 1987 to celebrate Ferrari's 40th anniversary. Its longitudinal 90-degree twin-turbo V8 produces 478 hp, while Ferrari lists a top speed of 324 km/h.</p>
            <p>The F40's lightweight philosophy, composite bodywork and aerodynamic form made it one of the defining performance cars of its era. This interactive archive brings those details into a real-time 3D experience for the modern web.</p>
            <div className="facts-source">SPECIFICATIONS: FERRARI OFFICIAL HISTORY / 1987 F40</div>
          </div>
        </div>
      </section>

      <section className="studio" id="studio">
        <div className="studio-head"><span>03 / THE STUDIO</span><span>INTERACTIVE MATERIAL LAB</span></div>
        <div className="studio-grid">
          <div className="studio-canvas"><Showroom color={color} detail={detail} progress={progress} /></div>
          <div className="controls">
            <small>CONFIGURE THE OBJECT</small>
            <h2>MAKE IT<br/><em>YOURS.</em></h2>
            <p>Native material control replaces the embed. Switch the body finish and inspect the sculpture at a closer scale.</p>
            <div className="swatches">{["#b80f17","#111111","#e7e2d8","#153f55"].map(c => <button key={c} aria-label={c} style={{ background: c }} className={color === c ? "active" : ""} onClick={() => setColor(c)} />)}</div>
            <button className={detail ? "detail active" : "detail"} onClick={() => setDetail(!detail)}>{detail ? "EXIT DETAIL VIEW" : "ENTER DETAIL VIEW"} <b>→</b></button>
          </div>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-word">F40</div>
        <div className="manifesto-copy"><small>THE END OF THE ARCHIVE</small><h2>STILL<br/><em>UNFORGETTABLE.</em></h2><button onClick={() => go("#hero")}>REPLAY EXPERIENCE ↑</button></div>
      </section>
      {!loaded && <div className="boot"><strong>F40</strong><span>INITIALIZING DIGITAL ARCHIVE</span></div>}
    </div>
  );
}

useGLTF.preload(MODEL_URL);
