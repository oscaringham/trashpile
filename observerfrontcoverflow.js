const COVER_IMAGES = [
  "observercoverflow/mag-cover-1.jpg",
  "observercoverflow/mag-cover-2.jpg",
  "observercoverflow/mag-cover-3.jpg",
  "observercoverflow/mag-cover-4.jpg",
  "observercoverflow/mag-cover-5.jpg",
  "observercoverflow/new-review-cover-1.jpg",
  "observercoverflow/new-review-cover-2.jpg",
  "observercoverflow/new-review-cover-3.jpg",
  "observercoverflow/observer-cover-2.jpg",
  "observercoverflow/observer-cover-3.jpg",
  "observercoverflow/observer-cover-4.jpg",
  "observercoverflow/observer-cover-5.jpg",
  "observercoverflow/observer-cover-6.jpg",
  "observercoverflow/observer-cover-7.jpg",
];
const FIRST_COVER = "observercoverflow/observer-cover-7.jpg";

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const orderedImages = [
  FIRST_COVER,
  ...shuffle(COVER_IMAGES.filter((src) => src !== FIRST_COVER)),
];
const COVER_COUNT = orderedImages.length;
const stage = document.getElementById("coverflowStage");

if (!stage) {
  throw new Error("Missing #coverflowStage element");
}

const covers = Array.from({ length: COVER_COUNT }, (_, i) => {
  const card = document.createElement("article");
  card.className = "cover";
  card.setAttribute("aria-hidden", "true");

  const img = document.createElement("img");
  img.src = orderedImages[i];
  img.alt = "";
  img.loading = i < 3 ? "eager" : "lazy";
  img.decoding = "async";

  card.appendChild(img);
  stage.appendChild(card);
  return card;
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function layoutCovers() {
  const stageRect = stage.getBoundingClientRect();
  const docMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const globalScroll = window.scrollY / docMaxScroll;

  // Sweep center index from before first card to after last card to fully animate in/out.
  const centerIndex = lerp(-1.5, COVER_COUNT + 1.5, globalScroll);

  const isMobile = window.matchMedia("(max-width: 980px)").matches;
  const isSmallMobile = window.matchMedia("(max-width: 981px)").matches;

  const centerX = isMobile ? stageRect.width * 0.5 : stageRect.width * 0.9;
  const centerY = stageRect.height * 0.5;
  const radius = Math.min(stageRect.width, stageRect.height) * (isMobile ? 0.45 : 0.58);

  for (let i = 0; i < covers.length; i += 1) {
    const cover = covers[i];

    // t in [-1,1] is on-arc, outside means off the visible semicircle region.
    const t = (i - centerIndex) / 2.1;
    const visibleStrength = clamp(1 - Math.abs(t), 0, 1);
    const theta = clamp(t, -1, 1) * (Math.PI / 2);

    // Desktop: left-opening arc. Small mobile: horizontal arc that runs left-to-right.
    let x = isSmallMobile
      ? centerX + Math.sin(theta) * radius
      : centerX - Math.cos(theta) * radius;
    let y = isSmallMobile
      ? stageRect.height * 0.9 - Math.cos(theta) * radius
      : centerY + Math.sin(theta) * radius;

    const scale = 0.45 + visibleStrength * 0.9;
    const rotationY = t * -38;
    const zIndex = Math.round(visibleStrength * 1000) + 10;
    const coverRect = cover.getBoundingClientRect();
    const coverWidth = coverRect.width || 220;
    const coverHeight = coverRect.height || 300;

    // Keep start/end cards fully off-screen before entering and after exiting the arc.
    if (t < -1) {
      const extra = (-1 - t) * Math.min(stageRect.width, stageRect.height) * 0.35;
      if (isSmallMobile) {
        x = -coverWidth - extra;
      } else {
        y = -coverHeight - extra;
      }
    } else if (t > 1) {
      const extra = (t - 1) * Math.min(stageRect.width, stageRect.height) * 0.35;
      if (isSmallMobile) {
        x = stageRect.width + coverWidth + extra;
      } else {
        y = stageRect.height + coverHeight + extra;
      }
    }

    cover.style.left = `${x}px`;
    cover.style.top = `${y}px`;
    cover.style.transform = `translate(-50%, -50%) scale(${scale}) rotateY(${rotationY}deg)`;
    cover.style.opacity = "1";
    cover.style.zIndex = `${zIndex}`;
    cover.style.pointerEvents = "auto";
  }

  requestAnimationFrame(layoutCovers);
}

requestAnimationFrame(layoutCovers);
