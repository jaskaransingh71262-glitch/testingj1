import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data");
const UPLOADS = path.join(DATA, "uploads");
const OUTPUTS = path.join(DATA, "outputs");
for (const dir of [DATA, UPLOADS, OUTPUTS]) fs.mkdirSync(dir, { recursive: true });

const app = express();
const port = process.env.PORT || 10000;
const workerSecret = process.env.WORKER_SECRET || "";
const jobs = new Map();
const upload = multer({ dest: UPLOADS, limits: { fileSize: 12 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOADS));
app.use("/outputs", express.static(OUTPUTS));

app.get("/health", (_req,res)=>res.json({ok:true, service:"ai-product-studio-backend", engine:"flux-worker"}));

app.post("/api/jobs", upload.single("image"), (req,res)=>{
  if (!req.file) return res.status(400).json({error:"image is required"});
  const id=randomUUID();
  const job={
    id,status:"queued",createdAt:Date.now(),
    imagePath:req.file.path,
    prompt:String(req.body.prompt||""),
    style:String(req.body.style||""),
    background:String(req.body.background||""),
    lighting:String(req.body.lighting||"")
  };
  jobs.set(id,job);
  res.status(202).json({jobId:id,status:"queued"});
});

app.get("/api/jobs/:id",(req,res)=>{
  const job=jobs.get(req.params.id);
  if(!job) return res.status(404).json({error:"job not found"});
  res.json({
    jobId:job.id,status:job.status,
    imageUrl:job.outputPath ? "/outputs/"+path.basename(job.outputPath) : null,
    error:job.error||null
  });
});

app.get("/api/worker/jobs/next",(req,res)=>{
  if(workerSecret && req.get("x-worker-secret")!==workerSecret) return res.status(401).json({error:"unauthorized"});
  const job=[...jobs.values()].find(x=>x.status==="queued");
  if(!job) return res.status(204).end();
  job.status="processing";
  res.json({
    jobId:job.id,
    imageUrl:"/uploads/"+path.basename(job.imagePath),
    prompt:job.prompt,
    style:job.style,
    background:job.background,
    lighting:job.lighting
  });
});

app.post("/api/worker/jobs/:id/complete",(req,res)=>{
  if(workerSecret && req.get("x-worker-secret")!==workerSecret) return res.status(401).json({error:"unauthorized"});
  const job=jobs.get(req.params.id);
  if(!job) return res.status(404).json({error:"job not found"});
  const {imageBase64, mimeType="image/png"}=req.body||{};
  if(!imageBase64) return res.status(400).json({error:"imageBase64 is required"});
  const ext=mimeType.includes("jpeg")?"jpg":"png";
  const outputPath=path.join(OUTPUTS,job.id+"."+ext);
  fs.writeFileSync(outputPath,Buffer.from(imageBase64,"base64"));
  job.status="completed";
  job.outputPath=outputPath;
  job.completedAt=Date.now();
  res.json({ok:true,imageUrl:"/outputs/"+path.basename(outputPath)});
});

app.post("/api/worker/jobs/:id/fail",(req,res)=>{
  if(workerSecret && req.get("x-worker-secret")!==workerSecret) return res.status(401).json({error:"unauthorized"});
  const job=jobs.get(req.params.id);
  if(!job) return res.status(404).json({error:"job not found"});
  job.status="failed"; job.error=String(req.body?.error||"worker failed");
  res.json({ok:true});
});

setInterval(()=>{
  const cutoff=Date.now()-6*60*60*1000;
  for(const [id,j] of jobs) if(j.createdAt<cutoff) jobs.delete(id);
},10*60*1000);

app.listen(port,()=>console.log("AI Product Studio backend listening on "+port));
