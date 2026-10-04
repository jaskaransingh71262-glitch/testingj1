import{useEffect,useRef,useState,forwardRef,useImperativeHandle}from"react";
import"../enterprise.css";

const API_BASE="https://testingj1-3.onrender.com";
const api=(path)=>API_BASE+path;
const demo=[["Opening Image","Wide establishing shot"],["First Discovery","Medium tracking shot"],["The Hook","Close-up"]];
const make=(s)=>demo.map(([title,shot],i)=>({id:i+1,title,shot,duration:"8s",prompt:`Cinematic ${shot.toLowerCase()} for: "${s}". Premium feature-film cinematography, realistic production design, motivated lighting, natural motion, subtle film grain, anamorphic lens characteristics, coherent visual style.`}));

function hashText(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
const CinematicCanvas=forwardRef(function CinematicCanvas({prompt,active},ref){
 const canvasRef=useRef(null),raf=useRef(0),rec=useRef(null),chunks=useRef([]),stream=useRef(null),audio=useRef(null);
 const [videoUrl,setVideoUrl]=useState(null);
 useImperativeHandle(ref,()=>({async render(seconds=8){
   if(rec.current)return null;
   const canvas=canvasRef.current;if(!canvas)return null;
   const videoStream=canvas.captureStream(30);
   let tracks=[...videoStream.getVideoTracks()];
   try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC&&!audio.current){
      const ctx=new AC(),dest=ctx.createMediaStreamDestination(),gain=ctx.createGain(),osc=ctx.createOscillator();
      gain.gain.value=.025;osc.type="sine";osc.frequency.value=52;osc.connect(gain);gain.connect(dest);osc.start();
      audio.current={ctx,dest,gain,osc};
    }
    if(audio.current){audio.current.ctx.resume();tracks=[...tracks,...audio.current.dest.stream.getAudioTracks()]}
   }catch{}
   const combined=new MediaStream(tracks);
   const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(x=>MediaRecorder.isTypeSupported(x))||"";
   const recorder=new MediaRecorder(combined,mime?{mimeType:mime}:{});
   chunks.current=[];
   recorder.ondataavailable=e=>e.data.size&&chunks.current.push(e.data);
   const done=new Promise(resolve=>{recorder.onstop=()=>{const blob=new Blob(chunks.current,{type:recorder.mimeType||"video/webm"});const url=URL.createObjectURL(blob);setVideoUrl(url);resolve(url)}});
   rec.current=recorder;recorder.start(250);
   setTimeout(()=>{if(rec.current){rec.current.stop();rec.current=null}},seconds*1000);
   return done;
 }}),[]);
 useEffect(()=>{
  const c=canvasRef.current;if(!c)return;
  const ctx=c.getContext("2d");const dpr=Math.min(devicePixelRatio||1,2);const w=960,h=540;c.width=w*dpr;c.height=h*dpr;c.style.aspectRatio="16/9";ctx.scale(dpr,dpr);
  const seed=hashText(prompt),variant=seed%5;
  const draw=t=>{
   const time=t/1000;
   const g=ctx.createLinearGradient(0,0,w,h);
   g.addColorStop(0,variant===0?"#08111d":variant===1?"#170914":variant===2?"#10180e":"#080b16");
   g.addColorStop(1,"#020205");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
   const horizon=315+Math.sin(time*.22)*5;
   ctx.fillStyle="rgba(80,100,130,.14)";for(let i=0;i<18;i++){const bw=28+(i%4)*16,bh=55+(i*37)%150,x=i*58-30;ctx.fillRect(x,horizon-bh,bw,bh)}
   ctx.fillStyle="rgba(160,190,220,.18)";for(let i=0;i<30;i++){const x=(i*137+time*22)%w,y=(i*71+time*38)%h;ctx.fillRect(x,y,1,1)}
   if(variant===0||variant===3){ctx.strokeStyle="rgba(170,205,235,.22)";ctx.lineWidth=1;for(let i=0;i<90;i++){const x=(i*83+time*150)%w,y=(i*41+time*210)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+22);ctx.stroke()}}
   const px=480+Math.sin(time*.35)*70,py=horizon-45+Math.sin(time*.7)*3;
   ctx.fillStyle="rgba(0,0,0,.82)";ctx.beginPath();ctx.ellipse(px,py+38,30,52,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px,py-15,16,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="rgba(255,180,85,.15)";ctx.beginPath();ctx.ellipse(px,py+5,85,100,0,0,Math.PI*2);ctx.fill();
   const vign=ctx.createRadialGradient(w/2,h/2,150,w/2,h/2,570);vign.addColorStop(0,"rgba(0,0,0,0)");vign.addColorStop(1,"rgba(0,0,0,.72)");ctx.fillStyle=vign;ctx.fillRect(0,0,w,h);
   ctx.fillStyle="rgba(255,255,255,.7)";ctx.font="12px Arial";ctx.letterSpacing="2px";ctx.fillText("CINEMA AI  /  DIRECTOR'S CUT",28,34);
   ctx.fillStyle="rgba(255,255,255,.55)";ctx.font="14px Arial";ctx.fillText(active?"RENDERING CINEMATIC SHOT":"READY TO RENDER",28,h-28);
   raf.current=requestAnimationFrame(draw);
  };raf.current=requestAnimationFrame(draw);
  return()=>cancelAnimationFrame(raf.current);
 },[prompt,active]);
 return <div className="preview" style={{position:"relative",overflow:"hidden"}}><canvas ref={canvasRef} style={{display:"block",width:"100%",height:"100%"}}/>{videoUrl&&<video src={videoUrl} controls style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}<div className="play">▶</div></div>
});

export default function App(){
 const[story,setStory]=useState(""),[title,setTitle]=useState("Untitled Film"),[scenes,setScenes]=useState([]),[sel,setSel]=useState(0),[mode,setMode]=useState("story"),[status,setStatus]=useState("idle"),[generation,setGeneration]=useState(null),[renderUrl,setRenderUrl]=useState(null);
 const renderer=useRef(null);
 const cur=scenes[sel]||make("A detective arrives at a rain-soaked city")[0];
 async function create(){
  if(!story.trim())return;setStatus("directing");
  try{const r=await fetch(api("/api/cinematic/direct"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,story,sceneCount:3})});if(!r.ok)throw Error();const d=await r.json();setScenes(d.scenes||make(story))}
  catch{setScenes(make(story))}
  setSel(0);setMode("studio");setStatus("ready")
 }
 async function generate(){
  setStatus("generating");setGeneration(null);setRenderUrl(null);
  try{
   if(renderer.current){
    const url=await renderer.current.render(8);setRenderUrl(url);
    const text=cur.prompt.slice(0,180);
    if("speechSynthesis"in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`Scene ${sel+1}. ${text}`);u.rate=.9;u.pitch=.82;window.speechSynthesis.speak(u)}
   }
   setGeneration({mode:"local-render",message:"Rendered locally in your browser. No paid video API required."});setStatus("generated")
  }catch(e){setGeneration({error:e.message||"Local render failed"});setStatus("ready")}
 }
 return <div className="cinema-shell">
 <header className="topbar"><div className="brand"><span className="brand-mark">C</span>CINEMA<span className="brand-dim">/AI</span></div><div className="top-status"><span className="pulse"/> Director workspace</div><button className="ghost-button">My projects</button></header>
 {mode==="story"?<main className="hero"><div className="hero-copy"><div className="eyebrow">AI FILM STUDIO · EARLY BUILD</div><h1>Turn an idea into a<br/><em>cinematic story.</em></h1><p>Describe the movie in your head. The AI Director breaks it into characters, scenes and film-ready shots.</p><div className="story-card"><label>FILM TITLE</label><input value={title} onChange={e=>setTitle(e.target.value)}/><label>YOUR STORY</label><textarea value={story} onChange={e=>setStory(e.target.value)} placeholder="A detective arrives in a rain-soaked city and discovers that the person he is searching for has been dead for ten years..."/><div className="story-footer"><span>{story.length} characters</span><button className="primary-button" onClick={create} disabled={status==="directing"}>{status==="directing"?"Directing…":"Create my film →"}</button></div></div></div><div className="hero-frame"><div className="fake-scene"><div className="moon"/><div className="mountain m1"/><div className="mountain m2"/><div className="road"/><div className="figure"/><div className="frame-caption">SCENE 01 · THE ARRIVAL</div></div></div></main>
 :<main className="studio"><aside className="scene-list"><div className="panel-label">SEQUENCE · {scenes.length} SHOTS</div>{scenes.map((s,i)=><button className={`scene-item ${i===sel?"active":""}`} onClick={()=>{setSel(i);setRenderUrl(null)}} key={s.id}><span className="scene-index">0{i+1}</span><span><strong>{s.title}</strong><small>{s.shot} · {s.duration}</small></span></button>)}<button className="add-shot">+ Add shot</button></aside>
 <section className="director"><div className="director-head"><div><div className="eyebrow">DIRECTOR'S CUT</div><h2>{title}</h2></div><button className="ghost-button" onClick={()=>setMode("story")}>← Change story</button></div>
 <CinematicCanvas ref={renderer} prompt={cur.prompt} active={status==="generating"}/>
 <div className="shot-controls"><div><span className="micro-label">SHOT {String(sel+1).padStart(2,"0")}</span><h3>{cur.shot}</h3></div><button className="generate-button" onClick={generate} disabled={status==="generating"}>{status==="generating"?"Rendering…":status==="generated"?"Render again":"Generate shot"}</button></div>
 <div className="prompt-box"><label>DIRECTOR PROMPT</label><textarea value={cur.prompt} readOnly/>{generation&&<div className="generation-result">{generation.error||generation.message}{renderUrl&&<a href={renderUrl} download={`${title.replace(/\s+/g,"-").toLowerCase()}-shot-${sel+1}.webm`}> Download WebM</a>}</div>}</div>
 <div className="timeline">{scenes.map((s,i)=><button onClick={()=>setSel(i)} className={i===sel?"timeline-shot active":"timeline-shot"} key={s.id}>0{i+1} {s.title}</button>)}</div></section></main>}
 <footer className="footer"><span>Built for cinematic storytelling.</span><span>Local cinematic renderer · no paid generation API.</span></footer></div>
}
