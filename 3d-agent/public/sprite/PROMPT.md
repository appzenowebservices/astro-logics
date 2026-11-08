# Nischal sprite sheets — exact generation prompt

Paste one of the prompts below into the image model, then run the two scripts
at the bottom to wire the sheet into `src/ar/assets/nischal.js`.

## 1. Character (must stay identical in every sheet)

Chibi cartoon man, about 3.5 heads tall with an oversized head. Messy short
black curly hair, thick black beard and moustache, round black-framed glasses,
dark brown eyes, medium-brown skin, friendly open smile. Outfit: red-and-black
plaid flannel shirt with an open collar and sleeves rolled to the forearms,
dark blue jeans, brown shoes. Flat 2D vector-cartoon style, thick dark
outline, simple cel shading, no gradients, no texture noise.

## 2. Sheet rules (must always hold)

1. One PNG sprite sheet with a **transparent background (alpha channel)** — no
   white, black or coloured backdrop, no shadow, no floor.
2. **Strict grid**: equal square cells, frames fill left→right, then
   top→bottom. Nothing may cross a cell border.
3. Every frame: character centred horizontally, **feet on the same baseline**,
   **exactly the same scale** in all frames, full body inside its cell with
   ~10% margin on all sides.
4. **Unused cells stay fully transparent** — no placeholder marks.
5. No text, numbers, labels, watermarks, grid lines, borders or props.
6. Same character and palette in every frame — only the pose changes.
7. Square canvas: 1024×1024 (preferred) or 1280×1280.

## 3. Copy-paste prompts

### Idle — `nischal-idle-trimmed.png` (5×5 grid, 24 frames)

```
Character sprite sheet of a chibi cartoon man, arranged in a strict 5-column
by 5-row grid of equal square cells on a 1024x1024 PNG with a transparent
background. Character: messy short black curly hair, thick black beard and
moustache, round black-framed glasses, dark brown eyes, medium-brown skin,
friendly open smile; red-and-black plaid flannel shirt with open collar and
sleeves rolled to the forearms, dark blue jeans, brown shoes. Flat 2D vector
cartoon style, thick dark outline, simple cel shading, no gradients.
24 frames, read left to right then top to bottom (the 25th cell, bottom-right,
is left fully transparent): a gentle idle loop — breathing, subtle weight
shifts, a blink, one small hand gesture, then back to rest.
Every frame: same scale and colours, centred horizontally, feet on the same
baseline, full body with a 10% margin inside its cell, no limb crossing any
cell border. Transparent background, no shadow, no floor, no text, no
watermark, no grid lines, no borders.
```

### Walk — `nischal-walk-trimmed.png` (5×5 grid, 22 frames)

```
Character sprite sheet of a chibi cartoon man, arranged in a strict 5-column
by 5-row grid of equal square cells on a 1024x1024 PNG with a transparent
background. Character: messy short black curly hair, thick black beard and
moustache, round black-framed glasses, dark brown eyes, medium-brown skin,
friendly smile; red-and-black plaid flannel shirt with open collar and sleeves
rolled to the forearms, dark blue jeans, brown shoes. Flat 2D vector cartoon
style, thick dark outline, simple cel shading, no gradients.
22 frames, read left to right then top to bottom (the last three cells stay
fully transparent): a clean side-view walking cycle facing right, two full
steps per loop, opposite arm swing, steady head and torso, heel-to-toe feet.
Every frame: same scale and colours, feet on the same baseline, full body with
a 10% margin inside its cell, no limb crossing any cell border. Transparent
background, no shadow, no floor, no text, no watermark, no grid lines.
```

### Dance — `nischal-dance-trimmed.png` (5×5 grid, 25 frames)

```
Character sprite sheet of a chibi cartoon man, arranged in a strict 5-column
by 5-row grid of equal square cells on a 1024x1024 PNG with a transparent
background. Character: messy short black curly hair, thick black beard and
moustache, round black-framed glasses, dark brown eyes, medium-brown skin,
big happy smile; red-and-black plaid flannel shirt with open collar and
sleeves rolled to the forearms, dark blue jeans, brown shoes. Flat 2D vector
cartoon style, thick dark outline, simple cel shading, no gradients.
25 frames, read left to right then top to bottom: an upbeat front-view dance
loop — clapping, waving both hands, step-touch side to side, hip sway, small
hops, then back to the first pose so it loops seamlessly.
Every frame: same scale and colours, centred horizontally, feet on the same
baseline, full body with a 10% margin inside its cell, no limb crossing any
cell border. Transparent background, no shadow, no floor, no text, no
watermark, no grid lines.
```

## 4. After generation (wire it into the AR page)

```sh
# a) if the model returned an opaque flat background (black OR white):
node scripts/key-bg.mjs public/sprite/<file>.png public/sprite/<file>.png 18

# b) measure the grid: frames used + the content crop to paste in
node scripts/measure-sprite.mjs public/sprite/<file>.png <cols> <rows>
```

Paste `cols`, `rows`, `frames` and `crop` into `src/ar/assets/nischal.js`
(keep `fps` around 8 for idle, 12 for walk/dance). The billboard reads the
sheet size from the PNG itself, so any square resolution works.

## 5. Known-good reference (current sheets)

| Sheet | Grid | Frames | Crop (x, y, w, h) |
| --- | --- | --- | --- |
| nischal-idle-trimmed.png | 5×5 @1280 | 24 | 70, 15, 103, 228 |
| nischal-walk-trimmed.png | 5×5 @1280 | 22 | 79, 33, 87, 191 |
| nischal-dance-trimmed.png | 5×5 @1024 | 25 | 53, 11, 109, 186 |
