import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Clone, ContactShadows, Environment, Float, OrbitControls, useGLTF } from "@react-three/drei";

const BMW_MODEL_URL = "https://raw.githubusercontent.com/coopercodes/bmwGLB/main/bmw_m4_competition_m_package.glb";

const cars = [
  { id: "vxr", name: "BMW M4 Competition", type: "BMW M4 · M Package", price: "$89,900", power: "612 HP", zero: "3.4 s", top: "198 MPH", color: "#c7c9ce" },
  { id: "r8", name: "BMW M4 Competition", type: "BMW M4 · M Package", price: "$124,500", power: "741 HP", zero: "2.8 s", top: "211 MPH", color: "#5f8cff" },
  { id: "gt", name: "BMW M4 Competition", type: "BMW M4 · M Package", price: "$106,200", power: "668 HP", zero: "3.0 s", top: "204 MPH", color: "#292b31" }
];

function Car({ paint }) {
  const group = useRef();
  const { scene } = useGLTF(BMW_MODEL_URL);

  useEffect(() => {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material?.name === "White" && material.color) {
          material.color.set(paint);
          material.metalness = 0.72;
          material.roughness = 0.2;
        }
      });
    });
  }, [scene, paint]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += (0.22 - group.current.rotation.y) * delta;
    }
  });

  return (
    <group ref={group} position={[0, -0.85, 0]} scale={1.65}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

function Showroom({ paint, dark, motion }) {
  const group = useRef();

  useFrame(({ pointer }) => {
    if (group.current && motion) {
      group.current.rotation.x += (pointer.y * 0.12 - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (-pointer.x * 0.07 - group.current.rotation.z) * 0.04;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.18}>
        <Car paint={paint} accent={dark ? "#9c82ff" : "#70d8ff"} />
      </Float>
    </group>
  );
}

function App() {
  const [selected, setSelected] = useState(0);
  const [paint, setPaint] = useState(cars[0].color);
  const [dark, setDark] = useState(true);
  const [motion, setMotion] = useState(true);

  const car = cars[selected];
  const paints = ["#c7c9ce", "#17191d", "#6b78a8", "#a52d37", "#e2e2df"];

  useEffect(() => {
    document.title = car.name + " — Apex Motors";
  }, [car]);

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          <span className="brand-mark">A</span>
          APEX MOTORS
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#models">MODELS</a>
          <a href="#configure">CONFIGURE</a>
          <a href="#technology">TECHNOLOGY</a>
        </nav>

        <button
          className="secondary"
          onClick={() => setDark((value) => !value)}
          aria-label="Toggle showroom theme"
        >
          {dark ? "DAY" : "NIGHT"}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="copy">
            <p className="eyebrow">DIGITAL SHOWROOM / 2026</p>
            <h1>
              Performance,
              <br />
              <span className="gradient">sculpted in 3-D.</span>
            </h1>

            <p className="lead">
              Explore a new generation of performance vehicles. Move your cursor
              to influence the car, switch models, and configure the finish in
              real time.
            </p>

            <div className="actions">
              <a className="primary" href="#models">Explore models ↗</a>
              <a className="secondary" href="#configure">
                Configure {car.name}
              </a>
            </div>

            <div className="specs hero-specs">
              <div className="spec"><b>{car.power}</b><span>POWER</span></div>
              <div className="spec"><b>{car.zero}</b><span>0–60 MPH</span></div>
              <div className="spec"><b>{car.top}</b><span>TOP SPEED</span></div>
            </div>
          </div>

          <div className="stage">
            <Canvas
              shadows
              camera={{ position: [5, 2.6, 6], fov: 38 }}
              dpr={[1, 1.6]}
            >
              <ambientLight intensity={dark ? 0.35 : 0.7} />
              <directionalLight position={[4, 6, 3]} intensity={dark ? 2.8 : 4} castShadow />
              <pointLight position={[-4, 2, -3]} intensity={dark ? 5 : 2} color="#806cff" />

              <Suspense fallback={null}>
                <Showroom paint={paint} dark={dark} motion={motion} />
                <ContactShadows position={[0, -0.12, 0]} opacity={0.45} scale={8} blur={2} />
                <Environment preset={dark ? "night" : "city"} />
              </Suspense>

              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>

            <div className="panel">
              <small>SELECTED MODEL</small>
              <h3>{car.name}</h3>
              <p>{car.type}</p>
              <p className="price">{car.price}</p>
            </div>

            <div className="hud">
              <span className="chip">● REAL-TIME 3D</span>
              <span className="chip">PBR LIGHTING</span>
              <button className="chip" onClick={() => setMotion((value) => !value)}>
                {motion ? "MOTION ON" : "MOTION OFF"}
              </button>
            </div>
          </div>
        </section>

        <section className="section" id="models">
          <div className="section-head">
            <div>
              <p className="eyebrow">THE COLLECTION</p>
              <h2>Choose your machine.</h2>
            </div>
            <p>
              Each model is presented as a configurable digital object, ready
              for your next specification.
            </p>
          </div>

          <div className="models">
            {cars.map((item, index) => (
              <button
                className={"model-card " + (index === selected ? "active" : "")}
                key={item.id}
                onClick={() => {
                  setSelected(index);
                  setPaint(item.color);
                }}
                aria-label={"Select " + item.name}
              >
                <div className="model-visual">
                  <div
                    className="mini-car"
                    style={{ background: "linear-gradient(150deg, " + item.color + ", #444)" }}
                  />
                </div>
                <h3>{item.name}</h3>
                <span>{item.type} · {item.price}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section config" id="configure">
          <div className="config-copy">
            <p className="eyebrow">CONFIGURATOR</p>
            <h2>Make it yours.</h2>
            <p>
              Choose a finish and watch the vehicle material update instantly.
              The interface is ready for future wheel, interior and accessory assets.
            </p>

            <div className="swatches" aria-label="Paint colors">
              {paints.map((color) => (
                <button
                  key={color}
                  className={"swatch " + (paint === color ? "active" : "")}
                  style={{ background: color }}
                  onClick={() => setPaint(color)}
                  aria-label={"Paint " + color}
                />
              ))}
            </div>
          </div>

          <div className="specs">
            <div className="spec"><b>{car.price}</b><span>STARTING PRICE</span></div>
            <div className="spec"><b>AWD</b><span>DRIVETRAIN</span></div>
            <div className="spec"><b>8-SPD</b><span>TRANSMISSION</span></div>
          </div>
        </section>

        <section className="section" id="technology">
          <div className="section-head">
            <div>
              <p className="eyebrow">PLATFORM</p>
              <h2>Built to scale.</h2>
            </div>
            <p>
              React + Three.js architecture with progressive asset loading,
              accessible controls, reduced-motion support and CMS-ready model data.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>APEX MOTORS / DIGITAL EXPERIENCE</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

export default App;

