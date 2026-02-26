const map = document.querySelector('.bubble-map');
const svg = document.querySelector('.links');
const center = document.getElementById('center-bubble');
const nodes = Array.from(document.querySelectorAll('.bubble.outer'));

function ellipseEdgeDistance(width, height, ux, uy) {
  const a = width / 2;
  const b = height / 2;
  return 1 / Math.sqrt((ux * ux) / (a * a) + (uy * uy) / (b * b));
}

function ensureLines(count) {
  while (svg.children.length < count) {
    svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
  }
  while (svg.children.length > count) {
    svg.removeChild(svg.lastChild);
  }
}

function layout() {
  if (!map || !svg || !center || nodes.length === 0) {
    return;
  }

  const box = map.getBoundingClientRect();
  const cx = box.width / 2;
  const cy = box.height / 2;
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

  const centerRect = center.getBoundingClientRect();
  const cW = centerRect.width;
  const cH = centerRect.height;
  const centerR = Math.max(cW, cH) / 2;

  const meta = nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    const angle = (Number(node.dataset.angle) * Math.PI) / 180;
    return {
      node,
      angle,
      w: rect.width,
      h: rect.height,
      r: Math.max(rect.width, rect.height) / 2,
      x: cx,
      y: cy
    };
  });

  const gap = 4;
  const margin = 10;
  const preferredRadius = box.width * 0.36;
  const maxRadius = box.width * 0.49;
  let bestMeta = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const radius = Math.min(maxRadius, preferredRadius + attempt * 20);
    const trial = meta.map((item) => ({
      ...item,
      x: cx + radius * Math.cos(item.angle),
      y: cy + radius * Math.sin(item.angle)
    }));

    for (let k = 0; k < 100; k += 1) {
      for (let i = 0; i < trial.length; i += 1) {
        for (let j = i + 1; j < trial.length; j += 1) {
          const a = trial[i];
          const b = trial[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const minD = a.r + b.r + gap;
          if (d < minD) {
            const push = (minD - d) / 2;
            const ux = dx / d;
            const uy = dy / d;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }

      trial.forEach((item) => {
        const dx = item.x - cx;
        const dy = item.y - cy;
        const d = Math.hypot(dx, dy) || 0.0001;
        const minCenterD = centerR + item.r + gap;
        if (d < minCenterD) {
          const push = minCenterD - d;
          item.x += (dx / d) * push;
          item.y += (dy / d) * push;
        }

        const tx = cx + radius * Math.cos(item.angle);
        const ty = cy + radius * Math.sin(item.angle);
        item.x += (tx - item.x) * 0.06;
        item.y += (ty - item.y) * 0.06;

        const minX = item.w / 2 + margin;
        const maxX = box.width - item.w / 2 - margin;
        const minY = item.h / 2 + margin;
        const maxY = box.height - item.h / 2 - margin;
        item.x = Math.min(Math.max(item.x, minX), maxX);
        item.y = Math.min(Math.max(item.y, minY), maxY);
      });
    }

    let overlapScore = 0;
    for (let i = 0; i < trial.length; i += 1) {
      const a = trial[i];
      const dcx = a.x - cx;
      const dcy = a.y - cy;
      const centerDist = Math.hypot(dcx, dcy);
      overlapScore += Math.max(0, centerR + a.r + gap - centerDist);

      for (let j = i + 1; j < trial.length; j += 1) {
        const b = trial[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        overlapScore += Math.max(0, a.r + b.r + gap - d);
      }
    }

    if (!bestMeta || overlapScore < bestMeta.score) {
      bestMeta = { items: trial, score: overlapScore };
    }
    if (overlapScore < 0.5) {
      break;
    }
  }

  const finalMeta = bestMeta ? bestMeta.items : meta;

  ensureLines(finalMeta.length);
  const lines = Array.from(svg.querySelectorAll('line'));
  const overlap = 0.6;

  finalMeta.forEach((item, i) => {
    item.node.style.left = `${item.x}px`;
    item.node.style.top = `${item.y}px`;
    item.node.style.transform = 'translate(-50%, -50%)';

    const dx = item.x - cx;
    const dy = item.y - cy;
    const d = Math.hypot(dx, dy) || 0.0001;
    const ux = dx / d;
    const uy = dy / d;

    const from = ellipseEdgeDistance(cW, cH, ux, uy) - overlap;
    const to = ellipseEdgeDistance(item.w, item.h, ux, uy) - overlap;

    const line = lines[i];
    line.setAttribute('x1', cx + from * ux);
    line.setAttribute('y1', cy + from * uy);
    line.setAttribute('x2', item.x - to * ux);
    line.setAttribute('y2', item.y - to * uy);
  });
}

layout();
window.addEventListener('resize', layout);
window.addEventListener('load', layout);
