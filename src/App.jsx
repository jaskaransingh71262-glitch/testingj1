import React,{useEffect,useRef,useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import "../enterprise.css";
gsap.registerPlugin(ScrollTrigger);

const MODEL="https://sketchfab.com/models/ee082e412b0a4b2090e8492117841e95/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_watermark=0";
const data=[["478","PS","POWER"],["324","KM/H","TOP SPEED"],["1,100","KG","DRY"],["4.1","SEC","0—100 KM/H"]];
const scenes=[
 {n:"01",tag:"THE ARRIVAL",title:"A MACHINE
WITHOUT
PERMISSION.",copy:"Turn the screen into a runway. The F40 arrives slowly, then takes over the entire frame."},
 {n:"02",tag:"THE SHAPE",title:"EVERY LINE
HAS A
REASON.",copy:"A silhouette designed around speed. No ornament. No apology."},
 {n:"03",tag:"THE HEART",title:"TWO TURBOS.
EIGHT
CYLINDERS.",copy:"The numbers are impressive. The feeling is the point."}
];

function Model({className=""}){return <div className={"model "+className}><iframe title="Interactive Ferrari F40" src={MODEL} allow="autoplay;fullscreen;xr-spatial-tracking" allowFullScreen/><div className="model-glow"/><div className="model-vignette"/></div>}

function App(){
 const root=useRef(null);const [menu,setMenu]=useState(false);const [active,setActive]=useState(0);const [mode,setMode]=useState("SCULPTURE");
 useEffect(()=>{const ctx=gsap.context(()=>{
   gsap.to(".opening",{yPercent:-100,duration:1.5,delay:.4,ease:"power4.inOut"});
   gsap.from(".arrival-copy>*",{y:70,opacity:0,duration:1.2,delay:1.5,stagger:.1,ease:"power4.out"});
   gsap.utils.toArray(".scene").forEach((el,i)=>ScrollTrigger.create({trigger:el,start:"top 48%",end:"bottom 48%",onEnter:()=>setActive(i),onEnterBack:()=>setActive(i)}));
   gsap.utils.toArray(".scene-title").forEach(el=>gsap.from(el,{y:120,opacity:0,duration:1.1,ease:"power4.out",scrollTrigger:{trigger:el,start:"top 82%"}}));
   gsap.to(".runway",{xPercent:-18,scrollTrigger:{trigger:".hero2",start:"top bottom",end:"bottom top",scrub:1}});
   gsap.to(".giant-f40",{scale:1.18,yPercent:8,scrollTrigger:{trigger:".hero2",start:"top top",end:"bottom top",scrub:1}});
   gsap.utils.toArray(".stat-big").forEach(el=>gsap.from(el,{scale:.7,opacity:0,duration:1,scrollTrigger:{trigger:el,start:"top 85%"}}));
 },root);return()=>ctx.revert()},[]);
 const go=id=>{document.querySelector(id)?.scrollIntoView({behavior:"smooth"});setMenu(false)};
 return <div className="rebuilt-f40" ref={root}>
  <div className="opening"><span>F40</span><small>1987 / MARANELLO / DIGITAL EXPERIENCE</small></div>
  <header className="neo-nav">
   <button className="neo-mark" onClick={()=>go("#home")}><strong>F</strong><span>F40<br/><i>ARCHIVE</i></span></button>
   <div className="neo-center">MARANELLO <b>×</b> 1987</div>
   <button className="neo-menu" onClick={()=>setMenu(!menu)}>{menu?"CLOSE":"EXPLORE"} <span>☰</span></button>
   {menu&&<div className="neo-panel"><button onClick={()=>go("#machine")}>01 / THE MACHINE</button><button onClick={()=>go("#shape")}>02 / THE SHAPE</button><button onClick={()=>go("#heart")}>03 / THE HEART</button><button onClick={()=>go("#data")}>04 / THE DATA</button><button onClick={()=>go("#studio")}>05 / STUDIO</button></div>}
  </header>

  <aside className="scene-nav">{scenes.map((s,i)=><button className={active===i?"on":""} key={s.n} onClick={()=>go(["#machine","#shape","#heart"][i])}><b>{s.n}</b><span>{s.tag}</span></button>)}</aside>

  <main id="home">
   <section className="hero2" id="machine">
    <div className="giant-f40"><Model/></div>
    <div className="red-light"/><div className="grid-floor"/>
    <div className="arrival-copy"><small>FERRARI F40 / DIGITAL ARCHIVE 001</small><h1>THE<br/><em>ICON</em><br/>ARRIVES.</h1><p>Move your cursor. Drag the machine. Scroll into the story.</p><button onClick={()=>go("#shape")}>ENTER EXPERIENCE <b>↓</b></button></div>
    <div className="hero2-edge"><span>1987—1992</span><span>INTERACTIVE 3D</span><span>120.2K TRIANGLES</span></div>
    <div className="scroll-word">FERRARI</div>
   </section>

   <section className="scene shape" id="shape">
    <div className="scene-media"><Model/></div>
    <div className="scene-copy"><span className="scene-tag">02 / THE SHAPE</span><h2 className="scene-title">EVERY LINE<br/><i>HAS A REASON.</i></h2><p>Forget the brochure. Study the object. Rotate it until the silhouette makes sense.</p><div className="hotspot-list"><button><i>01</i> WEDGE SILHOUETTE</button><button><i>02</i> REAR WING</button><button><i>03</i> AIR INTAKES</button></div></div>
   </section>

   <section className="scene heart" id="heart">
    <div className="heart-bg">V8</div>
    <div className="heart-copy"><span className="scene-tag">03 / THE HEART</span><h2 className="scene-title">TWO TURBOS.<br/><i>EIGHT CYLINDERS.</i></h2><p>The F40 doesn't whisper. Its engineering is part of the visual language.</p><button className="outline-action" onClick={()=>go("#data")}>OPEN ENGINE STORY →</button></div>
    <div className="engine-model"><Model/></div>
   </section>

   <section className="data-scene" id="data">
    <div className="data-header"><span>04 / THE DATA</span><p>THE MACHINE, REDUCED TO FOUR NUMBERS.</p></div>
    <div className="stat-wall">{data.map(([n,u,l])=><div className="stat-big" key={l}><strong>{n}</strong><em>{u}</em><span>{l}</span></div>)}</div>
    <div className="data-line"><span>F40</span><i/></div>
   </section>

   <section className="studio" id="studio">
    <div className="studio-top"><span>05 / THE STUDIO</span><span>DIGITAL OBJECT / 001</span></div>
    <div className="studio-title"><span>THE</span><em>OBJECT</em><span>IS</span><em>ALIVE.</em></div>
    <div className="studio-layout"><Model className="studio-model"/><div className="studio-panel"><small>VIEW MODE</small><div className="mode-tabs">{["SCULPTURE","DETAIL","NIGHT"].map(x=><button className={mode===x?"selected":""} onClick={()=>setMode(x)} key={x}>{x}</button>)}</div><p>{mode==="SCULPTURE"?"Explore the full silhouette in its cleanest form.":mode==="DETAIL"?"Get close. Inspect the proportions, surfaces and mechanical attitude.":"A darker interpretation for the machine after sunset."}</p><div className="studio-meta"><span>MODEL</span><b>FERRARI F40</b><span>FORMAT</span><b>WEBGL / GLTF</b></div></div></div>
   </section>

   <section className="final-rebuild">
    <div className="final-model"><Model/></div><div className="final-overlay"><small>END OF ARCHIVE</small><h2>STILL<br/><em>UNFORGETTABLE.</em></h2><button onClick={()=>go("#home")}>REPLAY ↑</button></div>
    <footer><span>F40 DIGITAL ARCHIVE</span><span>VECARZ / 2026</span><span>BACK TO TOP ↑</span></footer>
   </section>
  </main>
 </div>
}
export default App;