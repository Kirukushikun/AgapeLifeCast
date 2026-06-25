Output Aspect Ratio — Full Behavior Prompt (Operator Console + Preview Screens)

Context
LifeCast is a church presentation software. The operator console has two preview screens side by side — Preview (staged/queued) and Live (currently on projector). Both screens visually reflect exactly what the projector output looks like, including any pillar or letterbox bars. The Output section in the Properties Panel has one setting: Aspect Ratio, which defines the shape of the physical projector or display.

Output Aspect Ratio
The Aspect Ratio setting represents the shape of the physical output screen — not the shape of individual slide content. It is a session-level setting. Options are 16:9, 4:3, 1:1, and 9:16.

When content ratio ≠ output ratio, the content is centered and fitted inside the output shape and the remaining space becomes bars:

Pillarboxing — content narrower than output (e.g. 1:1 slide on 16:9 projector → left and right bars)
Letterboxing — content wider than output (e.g. 16:9 slide on 1:1 square screen → top and bottom bars)
No bars — content ratio matches output ratio exactly
Preview Screen Structure
Each preview screen (Preview and Live) is built from three layers:


.preview-screen          ← outer shell, fixed size, flex centering, dark background
  └── .screen-ambient    ← ambient blur layer
  └── .screen-slide      ← the actual slide content box (16:9 / 1:1 / etc.)
.preview-screen is the projector frame — a flex container that fills its column. It has a dark background and uses align-items: center and justify-content: center to keep .screen-slide centered. It does not have a fixed aspect ratio itself. It represents the physical monitor boundaries.

.screen-slide is the slide content area. It always has:


aspect-ratio: 16/9; /* changes dynamically based on Output Aspect Ratio */
width: 100%;
max-height: 100%;
With both width: 100% and max-height: 100% set, the browser automatically resolves the correct size:

If the slide fits within the container at full width → it fills the width, height is ratio-derived
If the derived height exceeds the container → height is capped, width shrinks proportionally to preserve ratio
This means the slide always fits inside the preview screen regardless of the ratio selected — it never overflows.

.screen-ambient fills the entire .preview-screen including all bar spaces (pillar or letterbox). It is absolutely positioned with a negative inset to bleed slightly beyond the container, inherits the background from .preview-screen, and applies a blur + dim filter:


.screen-ambient {
  position: absolute;
  inset: -40px;
  background: inherit;
  filter: blur(28px) brightness(0.35) saturate(1.4);
  z-index: 0;
  pointer-events: none;
}
This gives the pillar and letterbox bar spaces a soft ambient glow matching the slide theme — not plain black bars. The .screen-slide sits on z-index: 1 above it.

Aspect Ratio Change Behavior
When the operator selects a different Aspect Ratio in the Output panel:

The aspect-ratio CSS property on both #slide-preview and #slide-live updates simultaneously
Both preview screens reshape to reflect the new output ratio
The ambient layer automatically fills whatever bar space remains around the resized slide
No other layout changes — .preview-screen containers stay the same size

// Both screens always update together — they represent the same physical output
slideEls.forEach(el => { el.style.aspectRatio = ratio; });
The operator always sees the live output shape accurately in both screens. If the projector is square (1:1) and a 16:9 song slide is queued, the operator sees the 16:9 content centered inside a square preview with ambient fill on top and bottom — exactly what the projector shows.

Slide Thumbnails (Left Panel)
The slide thumbnail list on the left shows thumbnails of individual slide content. Thumbnails do not change ratio when the Output Aspect Ratio changes — they always render at their native content ratio because they represent the slide itself, not the output.

Thumbnails use transform: scale() to render at full resolution and scale down as one unit. This prevents text inside thumbnails from reflowing or becoming illegible at small sizes — the text renders at full size and is simply scaled down visually. Do not use font-size reduction or width constraints on the inner content of thumbnails.


.slide-thumb-inner {
  width: 1280px;   /* full render size */
  height: 720px;
  transform: scale(0.156);  /* scale to fit thumbnail container */
  transform-origin: top left;
}
The outer .slide-thumb wrapper is sized to the scaled-down dimensions using the same aspect ratio as the slide content.

Summary
Element	Ratio source	Changes when Output ratio changes
.screen-slide (Preview)	Output Aspect Ratio	Yes
.screen-slide (Live)	Output Aspect Ratio	Yes
.screen-ambient	Fills remaining space automatically	Yes (implicit)
Slide thumbnails	Native slide content ratio	No
The live output window (Output/Live.jsx) mirrors the same structure — it is always the configured Output Aspect Ratio shape, content is fitted inside it, and ambient blur fills any bar spaces.