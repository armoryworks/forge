---
title: AI fleet — heavier-tier test plan (beefy box)
type: delivery
status: pending
id: ai-fleet-beefy-box-tests
updated: 2026-07-07
---

# Heavier-tier AI test plan (run on the beefy box)

Tier 0 is validated on the 26 GB dev box (see README). This runbook takes a beefier box through the
Medium/Large classes + multi-instance topology, and feeds measured numbers back into
`AiHardwareAdvisor`. Deploy is the normal stack (`setup.sh` guards apt-Docker) or just the AI slice.

## Target box (named 2026-07-08): AMD 16-core / 64 GB RAM / Radeon RX 9070 XT (16 GB VRAM)

This IS the researched top tier (64 GB + consumer GPU). **AMD-specific setup — ROCm, not CUDA:**

```bash
# The stock ollama/ollama image is CPU/NVIDIA. AMD GPU accel needs the ROCm variant + device maps:
docker run -d --name forge-ai -p 127.0.0.1:11434:11434 \
  --device /dev/kfd --device /dev/dri \
  -v ollamadata:/root/.ollama ollama/ollama:rocm
# If the RDNA4 card isn't auto-detected, try: -e HSA_OVERRIDE_GFX_VERSION=<per ROCm docs for gfx12>
# Compose equivalent: image ollama/ollama:rocm + devices: [/dev/kfd, /dev/dri] on the forge-ai service.
```

**Expected VRAM fits (16 GB, Q4_K_M):**
- `gemma3:4b` (3.3 GB) + embedder — trivially all-GPU, blistering.
- `gemma3:12b` (~8 GB weights) — **fully in VRAM**, the sweet spot; likely the assistant default for this tier.
- `gemma3:27b` (~17 GB weights) — just over 16 GB → partial offload (most layers GPU, spillover to system RAM).
  Still interactive; record the GPU/CPU split from `ollama ps`.
- Concurrency: 4b + 12b co-resident fit VRAM together (~11.5 GB) — the interesting multi-model case.

## 0. Characterize the box (fills in the tier)
```bash
free -h; nproc; nvidia-smi || echo CPU-only          # record RAM / cores / GPU+VRAM
```

## 1. Bring up the AI slice + models by tier
```bash
docker compose --profile ai up -d forge-ai
docker exec forge-ai ollama pull all-minilm:l6-v2    # embedder (always)
docker exec forge-ai ollama pull gemma3:4b           # Small  (baseline vs dev box)
docker exec forge-ai ollama pull gemma3:12b          # Medium (~8 GB disk / ~10 GB resident)
docker exec forge-ai ollama pull gemma3:27b          # Large  (~17 GB disk / 16-24 GB resident; GPU strongly preferred)
```

## 2. Measure per class (feeds ClassFootprint in AiHardwareAdvisor.cs)
For each model: run a prompt, then record residency + speed.
```bash
docker exec forge-ai ollama run gemma3:12b "Summarize double-entry bookkeeping in 3 sentences." --verbose
docker exec forge-ai ollama ps        # RESIDENT size + CPU/GPU split — the number the advisor estimates
```
Record: resident RAM (vs advisor: Small 4 GB / Medium 9 GB / Large 22 GB), eval tokens/sec, load time.

## 3. Concurrency (the DistributeThreshold check)
Keep two models resident (`OLLAMA_MAX_LOADED_MODELS=2` on the container env), run prompts against
both, watch `ollama ps` + `free -h`. Question: at what combined residency does the box degrade?
Compare against `DistributeThresholdMb` (24 GB).

## 4. Multi-instance topology taste (fleet proper)
Second Ollama container = one-box "fleet of two":
```bash
docker run -d --name forge-ai-2 -p 127.0.0.1:11435:11434 -v ollamadata2:/root/.ollama ollama/ollama
docker exec forge-ai-2 ollama pull gemma3:4b
```
Point one Forge capability at each (`Ai__BaseUrl` per service is the seam; per-capability base URLs
are the orchestrator-phase work). Record isolation behavior (one model saturating ≠ starving the other).

## 5. Point Forge at the best model + quality pass
```bash
# .env: AI_MODEL=gemma3:12b (or 27b on GPU) → docker compose up -d forge-api
```
Re-run the live checks from the dev box: accounting explain narrative quality, RAG answer quality
w/ live stock facts, tokens/sec acceptable for interactive use?

## 6. Feed results back
- Update `AiHardwareAdvisor.ClassFootprint` + `DistributeThresholdMb` with MEASURED numbers (cite this doc).
- Record the box's tier verdict in the README (like the Tier-0 entry).
- Decide: is Medium good enough for the assistant that Large is a GPU-only luxury? (Drives the
  default `AI_MODEL` recommendation per deployment tier.)
