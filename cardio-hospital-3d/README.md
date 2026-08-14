# Cardio Hospital 3D

Standalone Next.js + React Three Fiber vertical slice for the pediatric
cardiology hospital simulation.

## Current slice

- First-person WASD/mouse navigation with physics collision
- Team room modeled from the supplied conference-room reference
- Team huddle staging, wall ECG display, and workstations
- Clinic corridor and examination room modeled from supplied references
- Proximity interaction with the attending and Room 3
- HCM exertional-syncope assignment wired to the immutable case corpus
- Original deterministic clinical core preserved under `src/lib`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in desktop Chrome.

## Status

This is the environment and interaction blockout, not the final character pass.
Photorealistic human assets, facial animation, voice, complete patient interview,
ECG/echo interaction, and formal medical-content verification remain subsequent
vertical-slice increments.
