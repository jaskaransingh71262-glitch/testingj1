# AI Product Studio Render backend

Deploy this directory as a Render Web Service.

Build command:
npm install

Start command:
npm start

Environment variable:
WORKER_SECRET=<random secret>

The web app sends image jobs to POST /api/jobs. A separate FLUX worker polls GET /api/worker/jobs/next and returns generated images to POST /api/worker/jobs/:id/complete.

The Render filesystem is intentionally temporary in this zero-cost architecture. Production persistence can be added later without changing the job protocol.
