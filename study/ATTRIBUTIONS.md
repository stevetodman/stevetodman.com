# StudyHub Attributions

## Word Expedition battle audio

Battle effects use a deliberately small **12-clip** local sample bank so mobile Safari has little to fetch or decode. Eleven shipped samples are **CC0 1.0 / public domain**; the Bramble Troll cue is original project-generated synthesis. All non-boss clips are trimmed to **150–400 ms**; the Word Keeper cue is about **1.55 seconds** so the real animal vocalization retains its natural attack and decay. All clips are mono **22.05 kHz**, **48 kbps MP3**, and loudness-normalized. Decoding begins on the same user gesture that unlocks the shared iPhone/desktop AudioContext. Until a sample is decoded—or if fetch/decode ever fails—the existing Web Audio synthesizer plays immediately instead, so audio can never delay a learning interaction.

No scream, flesh-impact, or gunshot recording is selected or shipped.

Sources (CC0/public-domain material does not require attribution, but exact provenance is recorded):

- **rubberduck — 80 CC0 RPG SFX** (OpenGameArt, CC0 1.0): `blade_01.ogg`, `blade_02.ogg`, `blade_03.ogg`, `item_gem_01.ogg`, and `wood_02.ogg` — blade/spear/scythe, magic, and wood/axe layers. Source: https://opengameart.org/content/80-cc0-rpg-sfx
- **Kenney — RPG Audio** (CC0 1.0): `Audio/chop.ogg` — staff/wood contact. Source: https://kenney.nl/assets/rpg-audio
- **artisticdude — Swishes Sound Pack** (OpenGameArt, CC0 1.0): `swishes/swish-7.wav` — bow/whoosh. Source: https://opengameart.org/content/swishes-sound-pack
- **rubberduck — 100 CC0 SFX #2** (OpenGameArt, CC0 1.0): `sfx100v2_metal_04.ogg` — hammer/metal impact. Source: https://opengameart.org/content/100-cc0-sfx-2
- **rubberduck — 80 CC0 creature SFX** (OpenGameArt, CC0 1.0): `cute_05.ogg`, `eat_02.ogg`, and `roar_03.ogg` — the remaining short creature effects use these kid-safe families. `scream_*` files from the source pack are intentionally not used. Source: https://opengameart.org/content/80-cc0-creature-sfx
- **Bramble Troll** — `troll.mp3` is original project-generated audio synthesized from low irregular harmonics, filtered noise, wood-strain transients, and a muted earth-impact layer. It contains no recorded voice, scream, flesh impact, or third-party source audio.
- **Word Keeper boss** — `owl.mp3` is a minimally processed excerpt of the real male-lion recording **“Lion raring-sound1TamilNadu178.ogg”** on Wikimedia Commons. The uploader identifies it as their own recording and releases it into the public domain worldwide. The shipped cue uses only excerpt selection, high/low-pass filtering, loudness normalization, short fades, mono conversion, resampling to 22.05 kHz, and MP3 encoding. **No pitch shifting, oscillator, synthesized harmonic layer, or generated animal voice is used.** Source: https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg

The final MP3 files live under `study/unit-1/sfx/`; there are no runtime third-party audio requests. Word/sentence audio remains the browser speech synthesizer.

## Word Expedition game artwork

Word Expedition uses generated raster artwork for characters, equipment, monsters,
and scenery, displayed from WebP atlases through SVG crop viewports. Artwork was
created for this project with OpenAI's built-in image generation; Adobe background
removal produced the transparent character and equipment cutouts. Source prompts,
selected outputs, and processing details are recorded in
`study/unit-1/assets/PROVENANCE.md`.

Route markers, interface shapes, and combat effects are code-generated SVG/CSS.
The retired SVG character renderers have been removed. No stock-image source
is used for the expedition artwork.

## 50 States map geometry

The SVG state geometry used by the **50 States Challenge** and reused by **Pin Sprint** was traced to the following source chain:

1. WebsiteBeaver, **Interactive and Responsive SVG Map of US States and Capitals** (2016), tutorial/repository by David Marcus:  
   https://websitebeaver.com/how-to-make-an-interactive-and-responsive-svg-map-of-us-states-capitals  
   https://github.com/WebsiteBeaver/interactive-and-responsive-svg-map-of-us-states-capitals
2. The WebsiteBeaver tutorial states that its starting United States SVG came from Wikipedia. Its embedded SVG metadata names `Republican_Party_presidential_primaries_results,_2016.svg`, and the state path geometry matches the geometry embedded in this project.
3. Wikimedia Commons, **Republican Party presidential primaries results, 2016.svg**:  
   https://commons.wikimedia.org/wiki/File:Republican_Party_presidential_primaries_results,_2016.svg

Wikimedia credits the map to **Ali Zifan, JCRules, Magog the Ogre, Nizolan & Spesh531**, identifies `Blank US Map (states only).svg` as its map source, and licenses the file under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**:

https://creativecommons.org/licenses/by-sa/4.0/

The WebsiteBeaver repository's surrounding tutorial/code is published under the MIT License. The state geometry used here has been extracted, reformatted, embedded in application data, styled for the StudyHub games, and reused to render map-derived application icons. To avoid under-attributing the recovered source, this project treats that map geometry and those map-derived renderings as CC BY-SA-derived material unless better upstream provenance is established.

This attribution/license notice applies to the identified map-derived material; it does not relicense unrelated application code or other site content.

## 50 States application icons

`study/icons/us-states-180.png`, `us-states-192.png`, `us-states-512.png`, and `us-states-maskable-512.png` were generated by this project from the 50 States map artwork. Because they incorporate the map geometry described above, retain this attribution notice when redistributing those icons.
