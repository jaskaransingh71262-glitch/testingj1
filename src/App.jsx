import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../enterprise.css";

gsap.registerPlugin(ScrollTrigger);

const F40_EMBED="https://sketchfab.com/models/ee082e412b0a4b2090e8492117841e95/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_watermark=0&ui_stop=0&ui_snapshots=0";
const specs=[["2.9","LITRE V8","TWIN TURBO"],["478","PS","MAX POWER"],["324","KM/H","TOP SPEED"],["1,100","KG","DRY WEIGHT"]];
const chapters=["THE MACHINE","THE ENGINE","THE NUMBERS","THE EXPERIENCE"];

function Viewer({className=""}){return <div className={"machine-view "+className}><iframe title="Ferrari F40 3D" src={F40_EMBED} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen/><div className="machine-shade"/><div className="scanline"/></div>}

function App(){
 const root=useRef(null); const [menu,setMenu]=useState(false); const [chapter,setChapter]=useState(0); const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const ctx=gsap.context(()=>{
   gsap.to(".intro-curtain",{yPercent:-100,duration:1.25,delay:.35,ease:"power4.inOut",onComplete:()=>setLoaded(true)});
   gsap.from(".hero-kicker,.hero-title,.hero-description,.hero-buttons",{y:55,opacity:0,duration:1.15,delay:1.1,stagger:.1,ease:"power4.out"});
   gsap.from(".hero-number,.hero-bottom",{opacity:0,duration:1,delay:1.5});
   gsap.utils.toArray(".mega-reveal").forEach(el=>gsap.from(el,{y:90,opacity:0,duration:1,ease:"power4.out",scrollTrigger:{trigger:el,start:"top 82%"}}));
   gsap.to(".hero-car-word",{xPercent:-28,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:1}});
   gsap.to(".machine-hero",{scale:1.12,yPercent:7,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:1}});
   gsap.utils.toArray(".chapter").forEach((el,i)=>ScrollTrigger.create({trigger:el,start:"top 50%",end:"bottom 50%",onEnter:()=>setChapter(i),onEnterBack:()=>setChapter(i)}));
 },root);return()=>ctx.revert()},[]);
 const go=id=>{document.querySelector(id)?.scrollIntoView({behavior:"smooth"});setMenu(false)};
 return <div className="f40-site big-site" ref={root}>
   <div className="intro-curtain"><span>F40</span><small>AN UNFILTERED DIGITAL EXPERIENCE</small></div>
   <header className="big-nav">
    <button className="big-logo" onClick={()=>go("#top")}><b>F</b><span>FERRARI<br/><i>F40 / DIGITAL</i></span></button>
    <div className="nav-center"><span>MARANELLO</span><span>1987</span><span>01—04</span></div>
    <button className="nav-menu" onClick={()=>setMenu(!menu)}>{menu?"CLOSE":"MENU"} <i><b/><b/></i></button>
    {menu&&<div className="menu-panel"><button onClick={()=>go("#machine")}>THE MACHINE</button><button onClick={()=>go("#engine")}>THE ENGINE</button><button onClick={()=>go("#numbers")}>THE NUMBERS</button><button onClick={()=>go("#experience")}>EXPERIENCE</button></div>}
   </header>
   <div className="chapter-dots">{chapters.map((x,i)=><button key={x} className={chapter===i?"active":""} onClick={()=>go(["#machine","#engine","#numbers","#experience"][i])}><span>0{i+1}</span><i/></button>)}</div>
   <main id="top">
    <section className="hero" id="machine">
      <Viewer className="machine-hero"/>
      <div className="hero-gradient"/>
      <div className="hero-copy-big">
       <div className="hero-kicker">FERRARI / F40 / DIGITAL ARCHIVE 001</div>
       <h1 className="hero-title">THE<br/><em>UNFORGIVING</em><br/>MACHINE.</h1>
       <p className="hero-description">There are cars designed to be comfortable. And then there is the F40.</p>
       <div className="hero-buttons"><button className="big-button" onClick={()=>go("#engine")}>DISCOVER THE MACHINE <b>↘</b></button><button className="line-button" onClick={()=>go("#numbers")}>EXPLORE DATA</button></div>
      </div>
      <div className="hero-number">F40<small>01</small></div>
      <div className="hero-bottom"><span>DRAG / ROTATE / EXPLORE</span><span>SCROLL TO ENTER</span><span>1987—1992</span></div>
      <div className="hero-car-word">FERRARI</div>
    </section>

    <section className="chapter engine chapter" id="engine">
      <div className="chapter-index mega-reveal">02 / THE ENGINE</div>
      <div className="engine-layout">
       <div className="engine-copy mega-reveal"><p className="red-label">RAW POWER / NO FILTER</p><h2>THE TURBOS<br/><em>WAKE UP.</em></h2><p>Two turbochargers. Eight cylinders. Nothing between the driver and the machine except a thin shell of carbon fibre.</p><button className="text-arrow" onClick={()=>go("#numbers")}>READ THE NUMBERS <b>→</b></button></div>
       <div className="engine-orbit mega-reveal"><Viewer/><div className="orbit-ring one"/><div className="orbit-ring two"/><span className="orbit-caption">2.9L / V8 / TWIN TURBO</span></div>
      </div>
    </section>

    <section className="numbers chapter" id="numbers">
      <div className="numbers-top"><div className="chapter-index">03 / THE NUMBERS</div><p>Figures from the machine that made the legend.</p></div>
      <div className="numbers-title mega-reveal">NOT<br/><em>NUMBERS.</em><span>WEAPON.</span></div>
      <div className="stat-grid">{specs.map(([n,l,s])=><div className="stat mega-reveal" key={l}><strong>{n}</strong><span>{l}</span><small>{s}</small></div>)}</div>
      <div className="speed-line"><i/></div>
    </section>

    <section className="manifest chapter">
      <div className="manifest-bg">F40</div>
      <div className="manifest-inner">
       <p className="red-label">NO COMFORT. NO COMPROMISE.</p>
       <h2 className="mega-reveal">BUILT FOR<br/><em>THE BRAVE.</em></h2>
       <p className="manifest-text mega-reveal">The F40 was created as a celebration of speed, simplicity and engineering. This experience treats it the same way: remove the noise, leave the machine.</p>
      </div>
    </section>

    <section className="experience-big chapter" id="experience">
      <div className="experience-top"><div className="chapter-index">04 / EXPERIENCE</div><span>THE OBJECT IS THE INTERFACE</span></div>
      <div className="experience-word mega-reveal">TOUCH<br/><em>THE ICON.</em></div>
      <div className="experience-view mega-reveal"><Viewer/><div className="viewer-hint">INTERACTIVE 3D <span>◉</span> DRAG TO ROTATE</div></div>
      <div className="experience-footer"><span>120.2K TRIANGLES</span><span>CC ATTRIBUTION MODEL</span><span>WEBGL EXPERIENCE</span></div>
    </section>

    <section className="finale chapter">
      <div className="finale-bg">F40</div>
      <div className="finale-content mega-reveal"><p className="red-label">THE END IS THE BEGINNING</p><h2>NOTHING<br/><em>COMPARES.</em></h2><button className="big-button" onClick={()=>go("#top")}>RESTART EXPERIENCE ↑</button></div>
      <div className="finale-footer"><span>F40 DIGITAL ARCHIVE</span><span>VECARZ / 2026</span></div>
    </section>
   </main>
 </div>
}
export default App;
