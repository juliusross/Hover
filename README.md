# Hover — Character Viewer

A small **Vite + TypeScript + vanilla Three.js** app that loads the Mixamo-style humanoid at `public/models/character.glb`, plays its clips, and walks around with WASD.

No React. No React Three Fiber. One entry: `index.html` + `src/main.ts`.

The original [Hover.css](README.hover-css.md) sources (`css/`, `scss/`, `less/`) and demo page (`hover-demo.html`) are still in this repo.

## Preview

![Idle](docs/preview/idle.webp)

![Walk](docs/preview/walk.webp)

![Run](docs/preview/run.webp)

[Demo video](docs/preview/demo.mp4)

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). The GLB is served from `/models/character.glb`.

Production build:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` or arrow keys | Move (walk). Facing follows the move direction (camera-relative). |
| `Shift` (while moving) | Run |
| `Space` | `Regular_Jump` one-shot, then back to Idle / Walk / Run |
| HUD buttons | One-shots: Punch (`Punch_Combo_2`), Hit (`Hit_Reaction`), Listen (`Listening_Gesture`), Dead (`Dead`) |

Movement and animation are updated in the Three.js render loop. Clips are not restarted every frame.

## Animation clips

Inspected from the GLB (13 clips):

| Clip | Duration | Used as |
| --- | --- | --- |
| `restpose` | 0.083s | **Not looped.** Too short to be a usable idle cycle. |
| `Walking` | 1.083s | Walk loop. **Idle** holds this clip paused at `t = 0`. |
| `Running` | 0.708s | Run loop (Shift). Chosen over `RunFast` (0.542s) for a more readable stride at ~5 m/s. |
| `Regular_Jump` | 2.000s | Space one-shot |
| `Punch_Combo_2` | 5.083s | HUD one-shot |
| `Hit_Reaction` | 1.708s | HUD one-shot |
| `Listening_Gesture` | 9.417s | HUD one-shot |
| `Dead` | 3.042s | HUD one-shot; holds last frame. WASD gets back up. |
| `Jump_Over_Obstacle_2` | 1.000s | Listed in HUD; not wired |
| `Jump_with_Arms_Open` | 3.750s | Listed in HUD; not wired |
| `Limping_Walk_1` | 1.625s | Listed in HUD; not wired |
| `RunFast` | 0.542s | Listed in HUD; not wired |
| `Standard_Forward_Charge` | 0.708s | Listed in HUD; not wired |

Idle note: `restpose` is two frames (~0.083s). Looping it flickers, so Idle pauses `Walking` at frame 0 instead of playing `restpose`.

## Performance

The skinned mesh is **~115,730 verts / ~198,220 tris**. That is a heavy character for the web. Desktop should be fine; **mobile and low-power GPUs may struggle** (especially with shadows).

## Project layout

```
index.html
src/main.ts
src/style.css
public/models/character.glb
```

No physics library. The ground is a plane; jump is animation-only.
