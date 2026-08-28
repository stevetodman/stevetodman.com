# Word Expedition generated artwork provenance

Built-in image_gen tool. Generated 2026-08-28. No CLI/API fallback.

Original production derivatives were `expedition-sprites.webp` (1254x1254, alpha retained),
`forest-clearing.webp` and `expedition-world.webp` (1200x800). Mechanical WebP
compression/resizing only; no scene edits. Atlas crop viewports explicitly use
preserveAspectRatio=none to avoid neighboring sprites bleeding into letterboxes.

Selected outputs:
- expedition-sprites.png: 1254x1254 RGBA. Alpha min0 max255 (ImageMagick identify verified). Original atlas is not a mathematically equal-cell layout; do NOT crop as four equal rows without inspecting. All16 requested sprites present, visual style coherent. Custom row boundaries around y0/330/654/954/1254 should be visually checked. Column boundaries around x0/314/628/942/1254.
- forest-clearing.png:1536x1024 RGB. Visually inspected: character-free quiet foreground, readable rich golden forest edges.
- expedition-world.png:1536x1024 RGB. Visually inspected: forest left, clear route valley center, purple-gold citadel right.

A targeted atlas layout edit was attempted but rejected: produced RGB painted checkerboard. Do NOT use generated_images/exec-9c6f9a16-cec3-4343-b60b-e9db84339910.png.

## Original atlas prompt
Use case: stylized-concept. Asset type: production transparent sprite atlas for premium mobile children's vocabulary RPG Word Expedition.
Create exactly ONE square 2048x2048 PNG, genuinely transparent background with alpha, a perfectly regular 4-column by 4-row atlas (16 equal square cells, no drawn grid). Each sprite centered inside its own cell with at least 12% padding; same visual scale, baseline and character placement for all adventurers, nothing crosses cells. This is NOT a UI mockup. No text, labels, logos or watermarks anywhere.
Style across every sprite: polished hand-painted 2.5D storybook mobile game illustration, expressive rounded adventurers, painterly subtle material texture, crisp clean readable silhouettes, warm golden light from upper left, deep petrol dark contours and shadows, forest emerald, parchment and restrained violet accents. Charming, inviting, adventurous, age9. Orthographic-ish three quarter side/front view appropriate for combat.
ROW1 cells left to right: full body boy adventurer Luke, short brown hair, slight smile facing slightly right, empty hands and hands separated from body for later weapon overlay. Exactly same pose, face, body scale in all4 cells, outfits only change: (1)starter teal tunic with teal cape brown boots; (2)forest green hooded ranger cloak and tunic brown boots; (3)silver guardian chainmail/tabard armor over teal tunic brown boots; (4)purple star mantle/cape over teal tunic brown boots.
ROW2 same precise pose, baseline and scale, full-body girl adventurer Samantha, dark brown tied-back hair, friendly smile, facing slightly right, empty hands, arms separated for weapon overlay. Four outfit variants left to right identical descriptions and color palette to ROW1: starter teal, forest green hood, silver guardian mail, purple star mantle.
ROW3 left to right4 standalone friendly fantasy enemies facing slightly left: (1)round moss creature with sprout and gentle face, (2)expressive violet floating wisp, (3)ancient blue-grey stone sentinel with mint rune and rounded blocky features, (4)regal purple dusk guardian boss with elegant gold crown and soft purple mist. Charming not frightening. Fully isolated transparent background, each fits own cell.
ROW4 left to right4 isolated weapons, all similarly placed and angled diagonally UP-RIGHT and uniformly sized: (1)starter steel short sword with leather brown hilt, (2)copper sword with rounded copper blade, (3)luminous pale-blue crescent moon blade with teal handle, (4)golden star wand with five-point golden star head. Nothing else.
CRITICAL: Exactly16 sprites.4 equal rows and4 equal columns. Transparent cell gutters and background, NO checkerboard drawn. NO ground shadow discs. Whole bodies and whole weapons visible, no cropping, no overlap. Clean production cutout edges and alpha.

## Forest prompt
Use case: illustration-story. Asset type: background-only forest combat clearing for a premium children's mobile vocabulary RPG. Create one wide landscape image1536x1024.
A beautiful inviting mossy forest clearing framed by ancient rounded blue-grey stone ruins, ferns and lush emerald foliage, with a small distant mountain castle softly visible beyond the trees. Rich detailed framing along far left and right and upper corners, but the middle and lower half are quiet gently lit grassy ground with subtle texture and generous visual breathing room where two combat characters will later be overlaid by code. Nothing occupies the central foreground. Ground plane level across the bottom.
Style: polished hand-painted 2.5D storybook mobile game illustration, painterly subtle textures, rounded shapes, warm golden shafts of sunlight from upper left, deep petrol shadow colors, forest emerald, warm parchment light, restrained violet flowers. Visually consistent with expressive rounded storybook RPG characters, not pixel art, not flat vector, not photorealism. Delightful rich atmosphere and premium craft.
NO characters, enemies, weapons, objects in foreground, UI, labels, path nodes, text, logo or watermark. Landscape scene only.

## World prompt
Use case: illustration-story. Asset type: background-only expedition world map for a premium children's mobile vocabulary RPG. One wide landscape1536x1024 image.
An inviting panoramic illustrated expedition island: lush forest and rounded moss-covered ruins on the left, a winding sunny grassy valley in the middle, rounded blue stone hills and a distant purple-and-gold citadel to the right. Warm welcoming sky and distant landscape layers. A clear central sweeping grass corridor gradually climbs from left to right, giving room for accessible route markers later overlaid in code. Show an expansive connected magical world with readable regions, beautiful edge details and a deliberately uncluttered central sweep. Slightly elevated three-quarter storybook world-map perspective. No literal map parchment border.
Style: premium polished hand-painted2.5D storybook mobile game illustration, painterly subtle textures, rounded shapes, warm golden light upper left, deep petrol shadows, forest emerald, parchment gold and restrained violet in the citadel. Friendly adventurous mood for9yearolds. Coherent with a mossy golden forest clearing and rounded fantasy adventurers. Not photorealistic, not vector, not pixel art.
NO characters, enemies, text, numbers, labels, markers, UI, path nodes, logos or watermark. Environment artwork only.

## Rejected targeted edit prompt
Use case: precise-object-edit. Edit this transparent sprite atlas. Preserve ALL16 existing sprites exactly: same characters, identity, faces, outfits, poses, style, colors, foes and weapons, same order.
CHANGE ONLY THE LAYOUT/SCALING: make it a rigorously aligned regular4x4 square atlas. Every sprite must fit entirely within its equal-size cell with generous empty transparent gutters. Shrink all sprites to roughly72% of their current per-cell size and recenter. Ensure top row bottoms do NOT cross into row2; row2 bottoms do NOT cross into row3; row3 foes fully fit inside row3; row4 weapons fully inside row4. Center every sprite in its cell. Keep consistent body scale and baseline for the eight adventurer variants. No object crosses cell boundaries or touches outer canvas edge.
If output2048x2048, exact cell edges0,512,1024,1536,2048. Each sprite should remain inside its cell inset64px on ALL sides. Blank gutters must have actual alpha0. Genuine transparent PNG background, not black, white or checkerboard. NO drawn grid or numbers. Preserve everything else, especially polished2.5D storybook style and all details.


## Fiercer monster replacement — August 28, 2026

Original version (superseded by the transparent cutouts below): built-in image generation, using the original atlas as the monster-identity and style reference. `monster-sprites.webp` is a separate 2x2 atlas; hero and gear art is unchanged. Order: Bramble Imp, Gloom Wisp, Rune Sentinel, Word Keeper. The original RGB background was dark forest green and the UI feathered the outer cell edges into the battle scene.

Prompt: Redesign the four monsters as ugly, snarling, formidable fantasy foes, facing left: warty moss-and-bark troll with crooked teeth and root claws; angular purple-blue spectral creature; cracked-stone golem with craggy jaw and rune fists; ragged purple owl sorcerer with hooked beak, talons and gold crown. Polished painterly 3D fantasy style; age appropriate for ten-year-olds, no blood or gore. Four equal cells in a 2x2 square grid, no heroes, weapons, labels or text.

Background correction: Replace every checkerboard pixel with a flat very dark forest green #143727 while preserving the four monsters. Transparent-background attempts returned RGB checkerboards and were rejected for production. Only mechanical WebP encoding was performed after generation.


## Expanded equipment — August 28, 2026

Original version, superseded by the alpha cleanup below: built-in image generation; selected 1536x1024 RGB source, encoded mechanically as `extra-gear.webp`. Six columns and three rows, separate from the original hero/gear atlas. This version used black-background screen blending and feathered shop edges.

Prompt: Exactly 18 isolated polished painterly 3D fantasy equipment icons on pure black, 6 columns by 3 rows, complete items centered with margins and no labels. Row 1: oak staff, iron axe, hunter bow, frost spear, ember hammer, thunder blade. Row 2: crystal wand, dragon blade, void scythe, iron shield, ember buckler, crystal shield. Row 3: thunder shield, dragon shield, void shield, oak charm, frost charm, sun charm. Weapons point diagonally up-right; shields face forward; charms upright. Family-friendly, no blood or gore.

## Hero attack poses — August 28, 2026

Original version, superseded by the alpha cleanup below: built-in image generation, reference: original expedition atlas. `hero-poses.webp`
is the selected 1536x1024 RGB black-background sheet (24 poses, 270398 bytes),
mechanically WebP-encoded at quality 88. Screen compositing is used during battle;
this is not alpha transparency. The first painted-checkerboard output was rejected.
Explicit crop windows in game-art.js preserve full capes and extended arms;
the generated columns are not uniformly spaced. Existing idle art is unchanged.

### Initial prompt
Use case: stylized-concept. Asset type: production 2D game hero animation sprite sheet.
Reference image: existing game atlas, use ONLY the boy and girl in its first two rows as identity, outfit and rendering references. Generate NEW attack body poses, not copies of standing poses.
Create one landscape 1536x1024 sheet, exactly SIX equal columns and FOUR equal rows (24 sprites), each cell 256x256, transparent background with actual alpha, NO grid lines, labels, weapons, effects, monsters or ground.
Columns 1-3 are Luke (short tousled brown hair): wind-up, contact, recovery. Columns 4-6 are Samantha (high brown ponytail): wind-up, contact, recovery.
Row 1: teal starter cloak/tunic, brown boots. Row 2: green forest hood/cloak. Row 3: silver guardian shoulder/mail armor over teal. Row 4: purple/gold star mantle over teal. Preserve reference costume details and childlike chibi proportions.
All face screen RIGHT, same scale, full body entirely inside its cell, feet at y=238 within each cell, head near y=20. Empty near-side weapon hand held in a fist (we overlay equipment in code).
Wind-up: bent knees, torso twisted back, weapon fist near right shoulder at cell x=165 y=110.
Contact: strong forward lunge, front knee bent, back leg extended, near arm extended toward enemy, weapon fist at x=204 y=135. Head lowered slightly, determined expression.
Recovery: torso regaining balance, feet apart, weapon fist returning to x=175 y=155, cloak following through.
Clear changes in elbows, knees, torso and facial intent across all three poses; no rigid standing-body rotations. Consistent framing and lighting across cells. Charming detailed painted fantasy game art matching reference. No text, no watermark.

### Selected background correction prompt
Use case: background-extraction. Edit target: this 24-character attack pose sprite sheet. Change ONLY the checkerboard background to solid pure black #000000. Preserve every character, pose, outfit, size, position and all 24 sprites exactly. No checkerboard, no gray squares, no shadow, no text. The output will use screen compositing in a dark forest game, so all empty space must be completely black. Keep 1536x1024 dimensions.

## Crisp monster cutouts — August 28, 2026

User reported a muddy dark disc around the monster. The circular CSS mask has
been removed. Current `monster-sprites.webp` is 1254x1254 RGBA, produced by
built-in image generation followed by **user-approved Adobe background removal**
(request 3b565a8c-3aab-47c2-98d7-430008e646be). Adobe retained all four monsters.
Alpha was verified before and after mechanical WebP encoding (quality 92):
range 0–255, transparent corners and gutters. No pixel editing, resizing or
sharpening filters were applied in code. The brighter generated source had a
painted checkerboard; only the Adobe cutout, not that RGB source, ships.

Prompt:
Use case: background-extraction. Edit target: attached monster sprite atlas. Remove the entire dark green background and return a TRANSPARENT PNG with actual RGBA alpha: every background pixel has alpha=0, not a painted checkerboard, not a solid-color replacement. Four complete isolated monster cutouts in their existing 2x2 layout. Preserve exactly these four monsters, their positions, silhouettes, colors, eyes, textures, claws, horns, feathers and sharp edges. Preserve all edge details with crisp antialiasing. NO circular feathering, no vignette, no backdrop, no ground, no halo, no borders, no fake transparency pattern. Make the faces and body surfaces slightly more clearly lit so they read on a dark forest, with sharp detailed outlines. All four monsters fully visible inside their own square cell with safe margins. Output a true transparent sprite sheet suitable for direct compositing over game scenery.


## Hero and equipment alpha cleanup — August 28, 2026

Current production files:
- `expedition-sprites.webp`: 1254x1254 RGBA; eight standing heroes and four starter weapons. The unused original monster row is now empty padding. The separate fierce monster atlas is unchanged.
- `extra-gear.webp`: 1536x1024 RGBA; all 18 equipment items retained.
- `hero-poses.webp`: 1536x1024 RGBA; all 24 attack poses retained.

Mode: reference edits with the built-in image generation tool for standing-atlas edge repair and removal of unused sprites, followed by user-approved Adobe background removal. Extra equipment and attack poses used Adobe background removal directly, without redesign. Initial cutouts that retained colored edge contamination were rejected. The selected standing-atlas edit outputs were `exec-dfc8e75b-d5ce-473f-8f06-f4e67b1bf2d5.png` and `exec-8998f2a8-86f0-4510-95bb-61d6cd68d928.png`.

Selected Adobe cutout request IDs:
- Standing heroes and starter gear: `5331b1bd-742b-4649-af03-309203c22955`.
- Extra gear: `99103982-8db2-49ef-9e25-15020c20f95d`.
- Attack poses: `75b6c253-8d2c-40bf-ad14-55d2fa364c63`.

Each selected PNG was mechanically encoded as WebP, quality 92, with alpha retained and verified (0–255). No semantic pixel edits, sharpening, or background-removal filters were applied in code. The CSS screen blending and circular gear feathering are removed. Explicit item metadata now maps each sprite to its own cell, grip, size, tilt and reach; equipment preserves its proportions and follows each hero/outfit's pose attachment points. A small SVG grip mask lets the existing hand show over the handle. Standing-atlas row boundaries are now 0/330/654/946/1254; the empty third row prevents old foliage from bleeding below Samantha's boots.

A code-native SVG preview was rendered and inspected on a forest-colored background for both heroes with swords, bow, hammer, shield and charm. This is asset/composition preflight, not a browser or physical-device check.

### Standing-atlas edge repair prompt
Use case: precise-object-edit. Asset type: existing 4x4 game sprite atlas edge repair. Edit target: attached atlas. Repair ONLY the red/magenta/yellow/cyan checkerboard and speckled edge contamination around all 16 sprites. Preserve the exact identities, faces, poses, outfits, weapon designs, colors, full silhouettes, positions, sizes and layout. The top two rows are Luke and Samantha in four outfits; their open hands, elbow and body positions must remain identical for game attachment coordinates. Bottom row swords and wand must retain their exact angles and proportions. Do not redesign or rearrange anything. Reconstruct clean, crisp antialiased edges without colored halos. Replace all empty background with flat pure WHITE #FFFFFF, including gaps inside hands and equipment; no checkerboard, shadows, glow discs, gradients or text. Preserve legitimate gold stars and magic ornamentation, but remove colored garbage beyond the actual silhouette. Output 1254x1254 with unchanged original sprite placement; we will remove the white background in a separate production cutout pass.

### Unused monster row removal prompt
Use case: precise-object-edit. Edit target: repaired sprite atlas. Remove ONLY the four unused monster sprites in the third row (the moss creature, purple wisp, stone golem, purple owl, between approximately y=654 and y=950). Replace their complete silhouettes and particles with pure white background. Preserve ALL eight heroes in the top two rows and ALL four weapons in the bottom row exactly: same positions, dimensions, poses, colors, hands, sharp edges and complete boots. Do not crop or move any remaining sprite. The third row must be entirely empty white padding separating the heroes from the weapons. Preserve 1254x1254 dimensions. No text or checkerboard. Do not alter the monsters used in our game: these are old unused atlas sprites only.
