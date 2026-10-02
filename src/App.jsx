import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../enterprise.css";

gsap.registerPlugin(ScrollTrigger);

const F40_EMBED =
  "https://sketchfab.com/models/ee082e412b0a4b2090e8492117841e95/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_watermark=0&ui_stop=0&ui_snapshots=0";

const specs = [
  ["ENGINE", "2.9 L twin-turbo V8"],
  ["POWER", "478 PS"],
  ["TRANSMISSION", "5-speed manual"],
  ["DRIVE", "Rear-wheel drive"],
  ["ERA", "1987 — 1992"],
  ["BODY", "Two-seat berlinetta"],
];

function F40Viewer({ compact = false }) {
  return (
    <div className={compact ? "f40-frame compact" : "f40-frame"}>
      <iframe
        title="Ferrari F40 interactive 3D model"
        src={F40_EMBED}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
      <div className="frame-vignette" />
      <div className="frame-grid" />
    </div>
  );
}

function App() {
  const root = useRef(null);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("01");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-kicker,.hero-title,.hero-copy,.hero-actions", {
        y: 35,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 45,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });

      gsap.utils.toArray(".story-panel").forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => setActive(String(i + 1).padStart(2, "0")),
          onEnterBack: () => setActive(String(i + 1).padStart(2, "0")),
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  };

  return (
    <div className="f40-site" ref={root}>
      <header className="f40-nav">
        <button className="brand" onClick={() => scrollTo("#top")} aria-label="Go to top">
          <span>V</span>
          VECARZ / F40
        </button>
        <nav className={menu ? "nav-links open" : "nav-links"}>
          <button onClick={() => scrollTo("#story")}>THE CAR</button>
          <button onClick={() => scrollTo("#specs")}>SPECS</button>
          <button onClick={() => scrollTo("#experience")}>EXPERIENCE</button>
          <button onClick={() => scrollTo("#contact")}>CONTACT</button>
        </nav>
        <button className="menu-button" onClick={() => setMenu((v) => !v)} aria-label="Toggle menu">
          <span /><span />
        </button>
      </header>

      <aside className="chapter-rail" aria-label="Page chapters">
        {["01", "02", "03", "04"].map((n) => (
          <button key={n} className={active === n ? "active" : ""} onClick={() => scrollTo(["#top", "#story", "#specs", "#experience"][Number(n) - 1])}>
            <i />{n}
          </button>
        ))}
      </aside>

      <main id="top">
        <section className="f40-hero">
          <F40Viewer />
          <div className="hero-noise" />
          <div className="hero-content">
            <div className="hero-kicker">FERRARI F40 / 1987—1992 / DIGITAL OBJECT 001</div>
            <h1 className="hero-title">NO<br /><span>COMPROMISE.</span></h1>
            <p className="hero-copy">
              A digital study of the F40 — raw proportions, twin-turbo power and the mechanical character that defined an era.
            </p>
            <div className="hero-actions">
              <button className="solid-button" onClick={() => scrollTo("#story")}>ENTER THE CAR <b>↓</b></button>
              <button className="ghost-button" onClick={() => scrollTo("#specs")}>VIEW SPECIFICATION</button>
            </div>
          </div>
          <div className="hero-meta">
            <span>INTERACTIVE 3D</span>
            <span>120.2K TRIANGLES</span>
            <span>SCROLL / EXPLORE</span>
          </div>
          <div className="hero-side">F40</div>
        </section>

        <section className="manifesto reveal" id="story">
          <div className="eyebrow">01 / THE CAR</div>
          <div>
            <h2>Built before<br /><em>digital filters.</em></h2>
            <p>
              The F40 is presented here as the hero object, not decoration. The 3D viewer is the interface: rotate it, inspect the silhouette, then move through the story around it.
            </p>
          </div>
          <div className="manifesto-number">01</div>
        </section>

        <section className="story-section">
          <div className="story-sticky">
            <F40Viewer compact />
            <div className="story-label">F40 / EXTERIOR STUDY</div>
          </div>
          <div className="story-panels">
            <article className="story-panel reveal">
              <span>01 / PROPORTION</span>
              <h3>Low. Wide.<br />Purposeful.</h3>
              <p>The wedge silhouette, exposed details and enormous rear wing turn the car into an object you can read from every angle.</p>
            </article>
            <article className="story-panel reveal">
              <span>02 / POWER</span>
              <h3>Turbocharged<br />without apology.</h3>
              <p>A 2.9-litre twin-turbo V8 sits behind the cabin. The digital experience keeps the engineering language visible rather than hiding it behind glossy marketing.</p>
            </article>
            <article className="story-panel reveal">
              <span>03 / PHILOSOPHY</span>
              <h3>Nothing added<br />without purpose.</h3>
              <p>Typography, motion, negative space and the model all serve one idea: the machine should remain the loudest element on the page.</p>
            </article>
          </div>
        </section>

        <section className="spec-section" id="specs">
          <div className="eyebrow reveal">02 / SPECIFICATION</div>
          <div className="spec-heading reveal">
            <h2>The numbers<br /><em>behind the myth.</em></h2>
            <p>Core F40 specifications presented as an editorial data sheet.</p>
          </div>
          <div className="spec-grid">
            {specs.map(([label, value]) => (
              <div className="spec reveal" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="experience" id="experience">
          <div className="experience-copy reveal">
            <div className="eyebrow">03 / EXPERIENCE</div>
            <h2>Make the model<br /><em>the navigation.</em></h2>
            <p>Drag to orbit the model. Use the viewer controls to inspect it. Scroll to move through the editorial story. On mobile, the composition collapses into a single focused object.</p>
            <button className="solid-button" onClick={() => scrollTo("#contact")}>START A PROJECT →</button>
          </div>
          <div className="experience-frame reveal">
            <F40Viewer compact />
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-big reveal">
            <div className="eyebrow">04 / NEXT</div>
            <h2>Turn your product<br /><em>into an experience.</em></h2>
          </div>
          <div className="contact-card reveal">
            <span>PROJECT ENQUIRY</span>
            <p>3D product showcase, automotive site, configurator or immersive campaign.</p>
            <a href="mailto:hello@example.com">hello@example.com ↗</a>
          </div>
        </section>
      </main>

      <footer className="f40-footer">
        <span>F40 DIGITAL STUDY</span>
        <span>REACT / GSAP / SKETCHFAB</span>
        <span>2026</span>
      </footer>
    </div>
  );
}

export default App;
