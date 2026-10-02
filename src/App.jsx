import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { create } from "zustand";
import "./enterprise.css";

gsap.registerPlugin(ScrollTrigger);

const BMW_MODEL_URL = "https://raw.githubusercontent.com/coopercodes/bmwGLB/main/bmw_m4_competition_m_package.glb";

const useSceneStore = create((set) => ({
  paint: "#c7c9ce",
  hotspot: "Powertrain",
  setPaint: (paint) => set({ paint }),
  setHotspot: (hotspot) => set({ hotspot }),
}));

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
  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)];
}

function BMW({ exploded = false }) {
  const { scene } = useGLTF(BMW_MODEL_URL);
  const group = useRef();
  const paint = useSceneStore((s) => s.paint);

  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m?.color && /white/i.test(m.name || "")) {
          m.color.set(paint);
          m.metalness = 0.8;
          m.roughness = 0.18;
        }
      });
    });
  }, [scene, paint]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += (0.10 - group.current.rotation.y) * delta;
    group.current.position.y = -0.7 + Math.sin(state.clock.elapsedTime * 0.8) * 0.018;
  });

  return (
    <group ref={group} position={[0, 0, 0]} scale={exploded ? 2.45 : 2.65}>
      <primitive object={scene} castShadow receiveShadow />
    </group>
  );
}

function BMWScene({ scrollProgress = 0, reducedMotion = false }) {
  const root = useRef();
  const target = useRef(0);

  useFrame(({ pointer }, delta) => {
    if (!root.current) return;
    const mouseX = reducedMotion ? 0 : pointer.x * 0.07;
    const mouseY = reducedMotion ? 0 : pointer.y * 0.045;
    target.current += ((scrollProgress * 0.45) - target.current) * Math.min(1, delta * 2.5);
    root.current.rotation.y += (target.current + mouseX - root.current.rotation.y) * 0.04;
    root.current.rotation.x += (mouseY - root.current.rotation.x) * 0.04;
    root.current.position.z = -scrollProgress * 0.45;
  });

  return <group ref={root}><BMW exploded={scrollProgress > 0.58} /></group>;
}

function Globe({ dark }) {
  const globe = useRef();
  const points = useMemo(() => offices.map((o) => latLon(o.lat, o.lon)), []);
  useFrame((_, delta) => { if (globe.current) globe.current.rotation.y += delta * 0.07; });
  return (
    <group ref={globe}>
      <mesh><sphereGeometry args={[2, 48, 48]} /><meshStandardMaterial color={dark ? "#0c1018" : "#e6ebf1"} wireframe roughness={0.7} /></mesh>
      {points.map((p, i) => <mesh key={offices[i].city} position={p}><sphereGeometry args={[0.075, 12, 12]} /><meshStandardMaterial color="#8b7cff" emissive="#5c4dff" emissiveIntensity={2} /></mesh>)}
    </group>
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const heroRef = useRef(null);
  const setPaint = useSceneStore((s) => s.setPaint);
  const paint = useSceneStore((s) => s.paint);
  const hotspot = useSceneStore((s) => s.hotspot);
  const setHotspot = useSceneStore((s) => s.setHotspot);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    document.title = "Apex Enterprise 3D — Product Intelligence";
    const ctx = gsap.context(() => {
      if (!reducedMotion) {
        gsap.from(".reveal", { y: 28, opacity: 0, duration: .7, stagger: .07, ease: "power3.out" });
        gsap.utils.toArray(".story-step").forEach((el) => gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 72%", end: "bottom 30%", toggleActions: "play reverse play reverse" },
          y: 24, opacity: 0, duration: .55, ease: "power2.out"
        }));
      }
    }, heroRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(window.scrollY / max);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const storyProgress = Math.min(1, Math.max(0, scrollProgress * 3));

  return (
    <div className={dark ? "enterprise dark" : "enterprise light"} ref={heroRef}>
      <header className="enterprise-nav">
        <a className="wordmark" href="#top"><span>A</span> APEX ENTERPRISE</a>
        <nav aria-label="Primary"><a href="#product">PRODUCT</a><a href="#global">GLOBAL</a><a href="#trust">TRUST</a><a href="#cases">CASES</a></nav>
        <button className="theme-btn" onClick={() => setDark((v) => !v)}>{dark ? "LIGHT" : "DARK"}</button>
      </header>

      <aside className="progress" aria-label="Page progress"><span style={{ height: Math.max(8, scrollProgress * 100) + "%" }} /><small>01—05</small></aside>

      <main id="top">
        <section className="enterprise-hero">
          <div className="hero-copy">
            <p className="kicker reveal">PRODUCT INTELLIGENCE / ENTERPRISE 3D</p>
            <h1 className="reveal">Complex products.<br /><em>Clear decisions.</em></h1>
            <p className="hero-lead reveal">A credible digital experience for CTOs, procurement teams and partners — where 3D demonstrates the product instead of distracting from it.</p>
            <div className="cta-row reveal"><a className="cta primary" href="#contact">Book demo</a><a className="cta secondary" href="#product">Explore product</a></div>
            <div className="hero-trust reveal"><span>SECURE BY DESIGN</span><span>WCAG 2.1 AA</span><span>PERFORMANCE LED</span></div>
          </div>
          <div className="hero-canvas" aria-label="Interactive BMW M4 3D product scene">
            <Canvas camera={{ position: [0, .1, 4.2], fov: 38 }} dpr={[1, 1.5]} shadows>
              <ambientLight intensity={dark ? .3 : .7}/><directionalLight position={[4,6,3]} intensity={dark ? 2.8 : 4} castShadow/><pointLight position={[-4,2,-3]} intensity={dark ? 3.5 : 2} color="#8b7cff"/>
              <Suspense fallback={null}><Environment preset={dark ? "night" : "city"}/><BMWScene scrollProgress={storyProgress} reducedMotion={reducedMotion}/><ContactShadows position={[0,-.2,0]} opacity={.4} scale={8} blur={2}/></Suspense>
              <OrbitControls target={[0,-.2,0]} minDistance={2.6} maxDistance={5.5} enablePan={false}/>
            </Canvas>
            <div className="scene-caption">BMW M4 / PRODUCT VIEW / SCROLL TO ANALYZE</div>
          </div>
        </section>

        <section className="story" id="product">
          <div className="story-sticky">
            <div className="story-canvas">
              <Canvas camera={{ position: [0,.15,4.4], fov: 40 }} dpr={[1,1.4]}>
                <ambientLight intensity={.5}/><directionalLight position={[4,5,4]} intensity={3}/><Suspense fallback={null}><Environment preset="studio"/><BMWScene scrollProgress={storyProgress} reducedMotion={reducedMotion}/></Suspense><OrbitControls target={[0,-.2,0]} enablePan={false}/>
              </Canvas>
            </div>
            <div className="story-stage-label">SCROLL-DRIVEN PRODUCT STORY</div>
          </div>
          <div className="story-copy">
            <article className="story-step"><span>01 / ORIENTATION</span><h2>See the product before you commit.</h2><p>HTML content remains visible to search engines and assistive technology while the model gives teams an immediate spatial reference.</p></article>
            <article className="story-step"><span>02 / ENGINEERING</span><h2>Reveal the systems that matter.</h2><p>The scene responds to scroll progress so the experience can move from exterior context toward engineering detail without a sudden animation.</p></article>
            <article className="story-step"><span>03 / DECISION</span><h2>Turn interaction into evidence.</h2><p>Hotspots, specifications and configuration controls answer the questions that normally require a sales call.</p></article>
          </div>
        </section>

        <section className="section product-explorer">
          <div className="section-heading"><span>PRODUCT EXPLORER</span><h2>Inspect. Configure. Decide.</h2></div>
          <div className="explorer-grid">
            <div className="explorer-view"><Canvas camera={{position:[0,.15,4.5],fov:42}} dpr={[1,1.4]}><ambientLight intensity={.5}/><directionalLight position={[4,5,4]} intensity={3}/><Suspense fallback={null}><Environment preset="studio"/><BMWScene reducedMotion={reducedMotion}/></Suspense><OrbitControls target={[0,-.2,0]} /></Canvas></div>
            <div className="explorer-controls">
              {["Powertrain","Aerodynamics","Cockpit"].map((item,i)=><button className={hotspot===item?"hotspot active":"hotspot"} key={item} onClick={()=>setHotspot(item)}><span>0{i+1}</span><b>{item}</b><small>{item==="Powertrain"?"503 HP performance architecture":item==="Aerodynamics"?"Airflow-led exterior design":"Driver-focused digital interface"}</small></button>)}
              <div className="variant"><span>VARIANT / FINISH</span><div>{["#c7c9ce","#17191d","#6473a8","#a52d37","#e2e2df"].map(c=><button className={paint===c?"paint active":"paint"} style={{background:c}} key={c} onClick={()=>setPaint(c)} aria-label={"Choose finish "+c}/>)}</div></div>
            </div>
          </div>
        </section>

        <section className="section global" id="global">
          <div className="section-heading"><span>GLOBAL PRESENCE</span><h2>Operational context, in one view.</h2></div>
          <div className="global-grid"><div className="globe"><Canvas camera={{position:[0,0,5.3],fov:42}}><ambientLight intensity={.5}/><pointLight position={[4,4,4]} intensity={3} color="#8b7cff"/><Globe dark={dark}/></Canvas></div><div className="data-panel">{offices.map(o=><div className="office" key={o.city}><span>{o.city}</span><b>{o.metric}</b></div>)}<div className="live"><small>PLATFORM AVAILABILITY</small><strong>99.98%</strong><span>rolling 30-day view</span></div></div></div>
        </section>

        <section className="section trust" id="trust">
          <div className="section-heading"><span>TRUST CENTER</span><h2>Enterprise credibility, visible.</h2></div>
          <div className="trust-grid"><div className="trust-card"><strong>ISO 27001</strong><span>Information security framework</span></div><div className="trust-card"><strong>SOC 2</strong><span>Security and availability controls</span></div><div className="trust-card"><strong>SSO / OAUTH</strong><span>Enterprise identity integration</span></div><div className="trust-card"><strong>WAF + CSP</strong><span>Modern application protection</span></div></div>
          <div className="logos" aria-label="Client logo placeholders"><span>CLIENT / A</span><span>CLIENT / B</span><span>PARTNER / C</span><span>PARTNER / D</span></div>
        </section>

        <section className="section cases" id="cases">
          <div className="section-heading"><span>CASE STUDIES</span><h2>3D with a measurable job.</h2></div>
          <div className="case-grid"><a href="#contact" className="case"><span>01 / PRODUCT</span><h3>Configuration without the guesswork.</h3><p>Show variants, materials and engineering context before a buyer talks to sales.</p><b>Read case →</b></a><a href="#contact" className="case"><span>02 / DATA</span><h3>Global operations with spatial context.</h3><p>Put locations, capacity and service metrics into a single visual system.</p><b>Read case →</b></a><a href="#contact" className="case"><span>03 / PARTNERS</span><h3>A digital layer for technical sales.</h3><p>Give partners a fast, consistent way to demonstrate complex systems.</p><b>Read case →</b></a></div>
        </section>

        <section className="section contact" id="contact">
          <div><span className="kicker">CONTACT SALES</span><h2>Make your product easier to understand.</h2><p>Tell us what customers need to explain, compare or configure. The first step is an interaction plan, not a 3D model.</p></div>
          <form onSubmit={(e)=>{e.preventDefault();setSubmitted(true)}}><label>Name<input required placeholder="Your name"/></label><label>Work email<input required type="email" placeholder="you@company.com"/></label><label>Company<input required placeholder="Company name"/></label><label>What should the experience explain?<textarea required rows="4" placeholder="Product, data, workflow, technical system..."/></label><button className="cta primary" type="submit">{submitted?"REQUEST RECEIVED ✓":"Book demo →"}</button></form>
        </section>
      </main>

      <div className="sticky-cta"><a href="#contact">Book a demo</a></div>
      <footer className="footer"><span>APEX ENTERPRISE 3D</span><span>React · R3F · GSAP · Zustand</span><span>© 2026</span></footer>
    </div>
  );
}
export default App;