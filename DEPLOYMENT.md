# AP Health IQ — Deployment Guide

## Architecture

```
[Vercel]              [Railway / Render]      [RunPod GPU]
React Frontend  →  →  FastAPI + SQLite   →  →  Ollama llama3
ap-health.vercel.app   railway.app             runpod.net:11434
```

## Step 1 — Backend on Railway (free tier)

1. Push the `backend/` folder to a GitHub repo.
2. Go to https://railway.app → New Project → Deploy from GitHub.
3. Select the repo, set root directory to `backend/`.
4. Railway auto-detects `nixpacks.toml` and `requirements.txt`.
5. Add environment variables:
   - `OLLAMA_BASE_URL` = your RunPod Ollama URL
   - `OLLAMA_MODEL` = `llama3:latest` (or `ap-health:latest` after fine-tuning)
   - `FRONTEND_URL` = `https://your-app.vercel.app`
6. Upload the dataset file `Dataset for Disease Tracking_HDS.xlsx` to `/app/`.
7. Deploy. Railway gives you a URL like `https://ap-health-api.up.railway.app`.

## Step 2 — Frontend on Vercel

1. Push the `Health_Data_Smart_FE_BE/health-compass-ai-main/` folder to a GitHub repo.
2. Go to https://vercel.com → New Project → Import Git Repository.
3. Vercel detects Vite. Set:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL` = `https://ap-health-api.up.railway.app`
5. Deploy. Vercel gives you `https://ap-health-iq.vercel.app`.

## Step 3 — Ollama on RunPod (cloud GPU)

1. Go to https://runpod.io → Deploy → Choose template "Ollama".
2. Select RTX 3080 (~$0.34/hr).
3. SSH or use web terminal:
   ```bash
   ollama pull llama3:latest
   ollama serve --host 0.0.0.0
   ```
4. Note the public IP/URL (e.g. `https://abc123.proxy.runpod.net`).
5. Set this as `OLLAMA_BASE_URL` in Railway env vars.

## Step 4 — Fine-tuned Model (optional, recommended)

Follow `backend/ai/README_FINETUNE.md`:
1. Run `python -m ai.prepare_training_data` to generate `training_data.jsonl`.
2. Open `backend/ai/finetune_unsloth.ipynb` in Google Colab.
3. Train for 3 epochs (~1.5 hours on T4).
4. Download `ap-health-q4.gguf`, upload to RunPod.
5. `ollama create ap-health -f Modelfile`.
6. Update `OLLAMA_MODEL` to `ap-health:latest`.

## Cost Summary (for the demo)

| Service | Cost |
|---------|------|
| Vercel (Hobby) | Free |
| Railway ($5 credit) | ~$0 for demo |
| RunPod GPU (1 hour for demo) | ~$0.34 |
| Google Colab T4 (fine-tuning) | Free |
| **Total** | **~$0.34** |

## Local Demo Mode (no internet)

If demo venue has poor internet:
1. Run all three locally — Ollama + FastAPI + frontend
2. PWA caches the field dashboard for offline use
3. The CitizenPortal and StateDashboard need backend connection

## Health Checks

After deployment, verify:
- `https://ap-health-api.../health` → 200 OK
- `https://ap-health-api.../api/districts/all` → returns 29 districts
- `https://ap-health-api.../api/ai/status` → `ollama_available: true`
- `https://ap-health-iq.vercel.app/login` → 5-role + Citizen login screen
