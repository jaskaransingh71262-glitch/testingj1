import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BMW_MODEL_URL = "https://raw.githubusercontent.com/coopercodes/bmwGLB/main/bmw_m4_competition_m_package.glb";

const model = {
  name: "BMW M4 Competition",
  type: "M4 · M Package",
  price: "$89,900",
  power: "503 HP",
  zero: "3.4 s",
  top: "155 MPH",
};

const offices = [
  { city: "London", lat: 51.5, lon: -0.1, metric: "42 projects" },
  { city: "New York", lat: 40.7, lon: -74, metric: "68 projects" },
  { city: "Singapore", lat: 1.3, lon: 103.8, metric: "31 projects" },
  { city: "Bengaluru", lat: 12.9, lon: 77.6, metric: "54 projects" },
  { city: "Tokyo", lat: 35.7, lon: 139.7, metric: "27 projects" },
];

function latLon(lat, lon, radius = 2.05) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function Car({ paint, detail }) {
  const { scene } = useGLTF(BMW_MODEL_URL);
  const group = useRef();

  useEffect(() => {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material?.color && (material.name === "White" || material.name === "white")) {
          material.color.set(paint);
          material.metalness = 0.8;
          material.roughness = 0.18;
        }
      });
    });
  }, [scene, paint]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += (0.12 - group.current.rotation.y) * delta;
    group.current.position.y = -0.72 + Math.sin(state.clock.elapsedTime * 1.1) * 0.025;
  });

  return (
    <group ref={group} scale={detail ? 2.55 : 2.2}>
      <group ref={group} position={[0, -0.72, 0]}>
        <primitive object={scene} castShadow receiveShadow />
      </group>
    </group>
  );
}

function Showroom3D({ paint, dark, reducedMotion }) {
  const group = useRef();

  useFrame(({ pointer }) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.x += (pointer.y * 0.08 - group.current.rotation.x) * 0.035;
    group.current.rotation.z += (-pointer.x * 0.045 - group.current.rotation.z) * 0.035;
  });

  return (
    <group ref={group}>
      <Float speed={1} rotationIntensity={0.035} floatIntensity={0.08}>
        <Car paint={paint} detail />
      </Float>
    </group>
  );
}

function Globe({ dark }) {
  const globe = useRef();
  const points = useMemo(() => offices.map((office) => latLon(office.lat, office.lon)), []);

  useFrame((_, delta) => {
    if (globe.current) globe.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={globe}>
      <mesh>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial color={dark ? "#10131a" : "#e8edf3"} metalness={0.25} roughness={0.65} wireframe />
      </mesh>
      {points.map((position, index) => (
        <mesh key={offices[index].city} position={position}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#8f7cff" emissive="#5e4cff" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const [paint, setPaint] = useState("#c7c9ce");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hotspot, setHotspot] = useState("Powertrain");
  const [submitted, setSubmitted] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    document.title = "Apex Motors — Enterprise 3D Experience";
    const ctx = gsap.context(() => {
      gsap.from(".reveal", { y: 35, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" });
      gsap.utils.toArray(".section").forEach((section) => {
        gsap.from(section.querySelectorAll(".animate-in"), {
          scrollTrigger: { trigger: section, start: "top 78%" },
          y: 45, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out"
        });
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className={dark ? "app theme-dark" : "app theme-light"} ref={heroRef}>
      <header className="nav">
        <a className="brand" href="#top" aria-label="Apex Motors home">
          <span className="brand-mark">A</span>
          APEX / DIGITAL
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#explorer">EXPLORER</a>
          <a href="#global">GLOBAL</a>
          <a href="#cases">CASES</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <button className="theme-toggle" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">
          {dark ? "LIGHT" : "DARK"}
        </button>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow reveal">ENTERPRISE 3D EXPERIENCE</p>
            <h1 className="reveal">Make complex products <span>understandable.</span></h1>
            <p className="lead reveal">A premium digital platform where interactive 3D helps customers explore, compare and decide — without getting in the way.</p>
            <div className="actions reveal">
              <a className="primary" href="#explorer">Explore the product ↗</a>
              <a className="secondary" href="#contact">Book a demo</a>
            </div>
            <div className="metric-row reveal">
              <div><b>60 FPS</b><small>PERFORMANCE TARGET</small></div>
              <div><b>5</b><small>GLOBAL OFFICES</small></div>
              <div><b>AA</b><small>ACCESSIBILITY</small></div>
            </div>
          </div>

          <div className="hero-stage" aria-label="Interactive 3D BMW product viewer">
            <Canvas camera={{ position: [0, 0.15, 4.15], fov: 38 }} shadows dpr={[1, 1.5]}>
              <ambientLight intensity={dark ? 0.32 : 0.72} />
              <directionalLight position={[4, 6, 3]} intensity={dark ? 3 : 4} castShadow />
              <pointLight position={[-4, 2, -3]} intensity={dark ? 4 : 2} color="#8272ff" />
              <Suspense fallback={null}>
                <Showroom3D paint={paint} dark={dark} reducedMotion={reducedMotion} />
                <ContactShadows position={[0, -0.15, 0]} opacity={0.42} scale={8} blur={2} />
                <Environment preset={dark ? "night" : "city"} />
              </Suspense>
              <OrbitControls minDistance={2.5} maxDistance={5.5} target={[0, -0.25, 0]} enablePan={false} />
            </Canvas>
            <div className="stage-label">BMW M4 / INTERACTIVE PRODUCT VIEW</div>
            <div className="stage-control">
              <button onClick={() => setReducedMotion((v) => !v)}>{reducedMotion ? "MOTION OFF" : "MOTION ON"}</button>
            </div>
          </div>
        </section>

        <section className="section explorer" id="explorer">
          <div className="section-intro animate-in">
            <p className="eyebrow">PRODUCT EXPLORER</p>
            <h2>Inspect what matters.</h2>
            <p>Rotate the model, zoom into the product and use focused hotspots to understand the engineering behind it.</p>
          </div>
          <div className="explorer-grid">
            <div className="explorer-stage animate-in">
              <Canvas camera={{ position: [0, 0.2, 4.5], fov: 42 }} dpr={[1, 1.4]}>
                <ambientLight intensity={0.55} />
                <directionalLight position={[4, 5, 4]} intensity={3} />
                <Suspense fallback={null}><Showroom3D paint={paint} dark={dark} reducedMotion={reducedMotion} /></Suspense>
                <OrbitControls target={[0, -0.25, 0]} enablePan={false} />
              </Canvas>
            </div>
            <div className="hotspots animate-in">
              {["Powertrain", "Aerodynamics", "Cockpit"].map((item, i) => (
                <button key={item} className={hotspot === item ? "hotspot active" : "hotspot"} onClick={() => setHotspot(item)}>
                  <span>0{i + 1}</span><b>{item}</b><small>{item === "Powertrain" ? "503 HP twin-turbo performance" : item === "Aerodynamics" ? "Airflow-led exterior design" : "Driver-focused digital controls"}</small>
                </button>
              ))}
              <div className="material-box">
                <span>FINISH</span>
                <div className="swatches">
                  {["#c7c9ce", "#15171b", "#5c6b9b", "#a52d37", "#e4e4df"].map((color) => (
                    <button key={color} className={paint === color ? "swatch active" : "swatch"} style={{ background: color }} onClick={() => setPaint(color)} aria-label={"Select paint " + color} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section global" id="global">
          <div className="section-intro animate-in">
            <p className="eyebrow">GLOBAL NETWORK</p>
            <h2>One platform. Global reach.</h2>
            <p>Live-style operational data can sit beside the 3D story, giving decision-makers context instead of visual noise.</p>
          </div>
          <div className="global-grid">
            <div className="globe-stage animate-in">
              <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[4, 4, 4]} intensity={3} color="#8272ff" />
                <Globe dark={dark} />
              </Canvas>
            </div>
            <div className="office-list animate-in">
              {offices.map((office) => (
                <div className="office" key={office.city}><span>{office.city}</span><b>{office.metric}</b></div>
              ))}
              <div className="live-metric"><small>PLATFORM STATUS</small><strong>99.98%</strong><span>service availability · rolling 30 days</span></div>
            </div>
          </div>
        </section>

        <section className="section cases" id="cases">
          <div className="section-intro animate-in">
            <p className="eyebrow">CASE STUDIES</p>
            <h2>Depth where it earns its place.</h2>
          </div>
          <div className="case-grid">
            <article className="case-card case-a animate-in"><span>01 / PRODUCT</span><h3>Turn configuration into confidence.</h3><p>Interactive product visualization reduces the gap between technical detail and purchase intent.</p></article>
            <article className="case-card case-b animate-in"><span>02 / DATA</span><h3>Give global operations a spatial story.</h3><p>3D geography creates an intuitive layer for offices, performance and regional metrics.</p></article>
            <article className="case-card case-c animate-in"><span>03 / BRAND</span><h3>Make the experience memorable.</h3><p>Motion and depth become storytelling tools instead of decoration.</p></article>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="contact-copy animate-in">
            <p className="eyebrow">CONTACT / DEMO</p>
            <h2>Build a 3D experience with a job to do.</h2>
            <p>Tell us what customers need to understand, compare or configure. We will map the interaction before adding the polygons.</p>
          </div>
          <form className="contact-form animate-in" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <label>Name<input required name="name" placeholder="Your name" /></label>
            <label>Work email<input required type="email" name="email" placeholder="you@company.com" /></label>
            <label>What are you building?<textarea required name="message" rows="4" placeholder="Product explorer, data platform, digital twin..." /></label>
            <button className="primary" type="submit">{submitted ? "REQUEST RECEIVED ✓" : "Request a demo →"}</button>
          </form>
        </section>
      </main>

      <footer className="footer"><span>APEX / ENTERPRISE 3D PLATFORM</span><span>React · Three.js · GSAP</span><span>© 2026</span></footer>
    </div>
  );
}

export default App;
