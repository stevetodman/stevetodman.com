# Workstations

The computer that authored the GitHub handoff is a managed Windows box. It is fine for planning and pull requests. It is not a DCC or Unreal machine.

Do not run Blender, Hunyuan, OptiX, or Unreal on it. Do not treat renders or packages produced there as evidence.

## Roles

| Machine | Role | Runs |
| --- | --- | --- |
| RTX 4090 Windows desktop | DCC and generation | Blender, local Hunyuan3D if installed, OptiX validation, 4K maps, FBX/GLB export |
| MacBook Pro M4 Max 128 GB | Unreal runtime | Unreal Engine 5.8, material instances, lighting, Nanite, packaging, walkthrough evidence |
| This managed Windows PC | Orchestration only | GitHub review, docs, job cards. No GPU claims. |

GitHub is the transfer layer. Commit source and LFS binaries from the 4090 or the Mac. Pull the same branch on the other machine. Do not sneakernet undocumented folders that never land on `stevetodman/stevetodman.com`.

## What each machine is allowed to approve

| Claim | Valid only on |
| --- | --- |
| Mesh scale, UVs, collision, Blender validator | 4090 (or the Mac if Blender is installed there) |
| Hunyuan first-pass GLB | 4090 or hosted Hunyuan, then cleaned on the 4090 |
| Unreal import, lighting, 2560×1440 camera stills | M4 Max |
| Packaged 60 FPS evidence | M4 Max packaged build, per ADR-0002 |
| Layout / circulation review | any machine; numbers live in git |

A 4090 OptiX still is asset QA, not the room benchmark. A still from this PC is a conversation aid, not art.

## Daily loop

1. On this PC: update job cards and review GitHub.
2. On the 4090: `git pull` `agent/aaa-exam-room-benchmark-handoff`, run Blender / Hunyuan, commit LFS, push.
3. On the M4 Max: `git pull`, import to UE 5.8, light, package, push evidence and manifests.

If Git or LFS is missing on a machine, install it there. Do not ZIP the Unreal project around the provenance gate.

## Already-made 4090 assets

PR #22 (`agent/aaa-exam-table-asset`) was validated with RTX 4090 OptiX. Those files stay on that branch until they are seen inside this room from the locked cameras on the Mac.
