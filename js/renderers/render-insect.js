/**
 * render-insect.js
 * SVG renderer for insect and crustacean body plans.
 * Handles: mosquito, damselfly, blue crab, rock lobster.
 *
 * Body plan axis is HORIZONTAL (head=left, abdomen=right).
 * Scores drive: segment count, limb count, wing size, eye cluster, color.
 */
'use strict';

function renderInsect(scores, svgEl, species) {
  const W = 200, H = 180;
  const cx = W / 2, cy = H / 2;
  const isCrab     = species === 'blue-crab'    || species === 'rock-lobster';
  const isDamsel   = species === 'damselfly';
  const isMosquito = species === 'mosquito';

  // Pull trait values (normalizedScore 0–100 → 0–1)
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  // ── Body geometry ──────────────────────────────────────────────────────
  const segCount   = isCrab ? 5 : isDamsel ? 4 : 3;
  const bodyW      = isCrab ? 52 : isDamsel ? 72 : 60;
  const bodyH      = isCrab ? 28 : isDamsel ? 10 : 14;
  const segW       = bodyW / segCount;
  const bodyX      = cx - bodyW / 2;
  const bodyY      = cy;

  // Pallette
  const { primary, accent, highlight } = (() => {
    if (isMosquito) return { primary:'hsl(38,35%,28%)', accent:'hsl(50,60%,55%)', highlight:'hsl(0,0%,82%)' };
    if (isDamsel)   return { primary:'hsl(200,75%,42%)', accent:'hsl(50,90%,65%)', highlight:'hsl(0,0%,92%)' };
    if (isCrab)     return { primary:'hsl(210,72%,44%)', accent:'hsl(35,90%,60%)', highlight:'hsl(190,80%,75%)' };
    return           { primary:'hsl(30,55%,42%)', accent:'hsl(25,80%,60%)', highlight:'hsl(40,60%,80%)' };
  })();

  const wingHue  = isDamsel ? (1 - n('bodyBlue')) * 40 + 200 : 210;
  const wingCol  = `hsla(${wingHue},60%,65%,0.55)`;
  const bodyDark = shadeHSL(primary, -18);

  let svg = `<defs>
    <radialGradient id="bgrd" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse cx="${cx}" cy="${cy+6}" rx="${bodyW*0.55}" ry="6" fill="rgba(0,0,0,0.22)"/>`;

  // ── WINGS ──────────────────────────────────────────────────────────────
  if (!isCrab) {
    const wingSpan = isDamsel ? 38 + n('wingLength') * 20 : 28 + n('wingVenation') * 12;
    const wingW    = isDamsel ? 18 + n('wingSpotSize') * 8 : 12;
    // Forewings (upper)
    for (const side of [-1, 1]) {
      const tipX = cx + side * wingSpan;
      const tipY = cy - 25 - wingSpan * 0.3;
      svg += `<path d="M ${cx},${cy-8} Q ${tipX*0.7+cx*0.3},${tipY+10} ${tipX},${tipY}"
        stroke="${wingCol}" stroke-width="1" fill="${wingCol}"/>`;
      if (isDamsel) {
        // Hindwings
        svg += `<path d="M ${cx+side*8},${cy-6} Q ${tipX*0.65+cx*0.35},${tipY+20} ${tipX-side*6},${tipY+14}"
          stroke="${wingCol}" stroke-width="0.8" fill="hsla(${wingHue},55%,70%,0.45)"/>`;
        // Wing spot (optix gene)
        const spotSz = 5 + n('wingSpotSize') * 12;
        svg += `<ellipse cx="${tipX - side*6}" cy="${tipY+8}" rx="${spotSz*0.6}" ry="${spotSz*0.4}"
          fill="hsla(${wingHue+20},70%,30%,0.8)"/>`;
      }
    }
  }

  // ── CARAPACE or Segments ───────────────────────────────────────────────
  if (isCrab) {
    // Wide flat carapace
    const cW = 60 + n('carapaceWidth') * 20, cH = 30;
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${cW/2}" ry="${cH/2}"
      fill="${primary}" stroke="${bodyDark}" stroke-width="1.2"/>`;
    // Texture lines
    for (let i = 1; i < 4; i++) {
      svg += `<line x1="${cx - cW/2 + cW*i/4}" y1="${cy - cH/2 + 4}"
             x2="${cx - cW/2 + cW*i/4}" y2="${cy + cH/2 - 4}"
             stroke="${bodyDark}" stroke-width="0.6" opacity="0.5"/>`;
    }
  } else {
    // Segmented thorax + abdomen
    for (let s = 0; s < segCount; s++) {
      const sx = bodyX + s * segW;
      const isHead = s === 0;
      const rw = isHead ? segW * 0.85 : segW * 0.9;
      const rh = isHead ? bodyH * 1.2 : bodyH * (1 - s * 0.08);
      const hue = isHead ? shadeHSL(primary, 10) : shadeHSL(primary, -s * 6);
      svg += `<ellipse cx="${sx + segW/2}" cy="${bodyY}" rx="${rw/2}" ry="${rh/2}"
        fill="${hue}" stroke="${bodyDark}" stroke-width="0.8" opacity="0.95"/>`;
    }
    // Abdomen taper
    const lastX = bodyX + segCount * segW;
    svg += `<ellipse cx="${lastX + 8}" cy="${bodyY}" rx="7" ry="${bodyH/2.5}"
      fill="${shadeHSL(primary,-12)}" stroke="${bodyDark}" stroke-width="0.7"/>`;
    svg += `<ellipse cx="${lastX + 18}" cy="${bodyY}" rx="4" ry="${bodyH/3.5}"
      fill="${shadeHSL(primary,-20)}" stroke="${bodyDark}" stroke-width="0.7"/>`;
  }

  // ── LEGS ───────────────────────────────────────────────────────────────
  const legPairs = isCrab ? 4 : 3;
  const legLen   = isCrab ? 22 : isDamsel ? 14 : 16;
  const legColor = shadeHSL(primary, -20);
  for (let p = 0; p < legPairs; p++) {
    const lx = isCrab ? cx + (p - 1.5) * 14 : bodyX + segW * (p + 0.5) + segW / 2;
    const ly = isCrab ? cy + 12 : bodyY + bodyH/2;
    for (const side of [-1, 1]) {
      const angle = isCrab ? 80 + p * 5 : 70 + p * 8;
      const rad   = (angle * Math.PI) / 180;
      const kx = lx + side * Math.cos(rad) * legLen * 0.45;
      const ky = ly + Math.sin(rad) * legLen * 0.45;
      const tx = lx + side * Math.cos(rad + 0.3) * legLen;
      const ty = ly + Math.sin(rad + 0.3) * legLen;
      svg += `<line x1="${f(lx)}" y1="${f(ly)}" x2="${f(kx)}" y2="${f(ky)}"
        stroke="${legColor}" stroke-width="${isCrab?1.8:1.2}" stroke-linecap="round"/>`;
      svg += `<line x1="${f(kx)}" y1="${f(ky)}" x2="${f(tx)}" y2="${f(ty)}"
        stroke="${legColor}" stroke-width="${isCrab?1.4:0.9}" stroke-linecap="round"/>`;
    }
  }

  // ── CLAWS for crab/lobster ─────────────────────────────────────────────
  if (isCrab) {
    const chelaRad = 8 + n('chelaSize') * 12;
    for (const side of [-1, 1]) {
      const cx2 = cx + side * 42, cy2 = cy;
      svg += `<circle cx="${f(cx2)}" cy="${f(cy2)}" r="${f(chelaRad)}"
        fill="${accent}" stroke="${shadeHSL(accent,-20)}" stroke-width="1.2"/>`;
      // Claw pincer
      svg += `<path d="M ${f(cx2+side*chelaRad*0.7)},${f(cy2-5)} Q ${f(cx2+side*chelaRad*1.6)},${f(cy2-12)} ${f(cx2+side*chelaRad*1.4)},${f(cy2-2)}"
        stroke="${shadeHSL(accent,-30)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      svg += `<path d="M ${f(cx2+side*chelaRad*0.7)},${f(cy2+5)} Q ${f(cx2+side*chelaRad*1.6)},${f(cy2+12)} ${f(cx2+side*chelaRad*1.4)},${f(cy2+2)}"
        stroke="${shadeHSL(accent,-30)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }
  }

  // ── ANTENNAE ───────────────────────────────────────────────────────────
  if (!isCrab) {
    const aLen = isMosquito ? 24 + n('proboscisLength') * 10 : 20;
    const headX = bodyX + segW / 2;
    for (const side of [-1, 1]) {
      svg += `<line x1="${f(headX)}" y1="${f(bodyY - bodyH/2)}"
        x2="${f(headX + side*aLen*0.4)}" y2="${f(bodyY - bodyH/2 - aLen)}"
        stroke="${legColor}" stroke-width="0.9" stroke-linecap="round"/>`;
    }
    if (isMosquito) {
      // Proboscis
      svg += `<line x1="${f(headX-segW/2)}" y1="${f(bodyY)}"
        x2="${f(headX - segW/2 - 18 - n('proboscisLength')*8)}" y2="${f(bodyY+3)}"
        stroke="${legColor}" stroke-width="1.5" stroke-linecap="round"/>`;
      // Proboscis tip
      svg += `<circle cx="${f(headX - segW/2 - 20 - n('proboscisLength')*8)}" cy="${f(bodyY+3)}"
        r="1.5" fill="${shadeHSL(primary, 20)}"/>`;
    }
  } else {
    // Long antennae for lobster
    for (const side of [-1, 1]) {
      svg += `<path d="M ${f(cx+side*20)},${f(cy-14)} Q ${f(cx+side*40)},${f(cy-40)} ${f(cx+side*55)},${f(cy-55)}"
        stroke="${legColor}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    }
  }

  // ── COMPOUND EYES ──────────────────────────────────────────────────────
  if (!isCrab) {
    const headX = bodyX + segW / 2;
    for (const side of [-1, 1]) {
      const ex = headX + side * (bodyH/2 - 1);
      const ey = bodyY - 2;
      const er = isDamsel ? 5 + n('bodyBlue') * 2 : 4;
      svg += `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(er)}" fill="${accent}" opacity="0.95"/>`;
      svg += `<circle cx="${f(ex + side*1.2)}" cy="${f(ey - 1.5)}" r="${f(er*0.4)}" fill="rgba(255,255,255,0.7)"/>`;
      svg += `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(er*0.5)}" fill="#0a0a10"/>`;
      // Hex pattern for compound eye
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        svg += `<circle cx="${f(ex + Math.cos(a)*er*0.65)}" cy="${f(ey + Math.sin(a)*er*0.65)}" r="1"
          fill="${shadeHSL(accent, 15)}" opacity="0.4"/>`;
      }
    }
  } else {
    // Crab eye stalks
    for (const side of [-1, 1]) {
      svg += `<line x1="${f(cx+side*14)}" y1="${f(cy-12)}" x2="${f(cx+side*18)}" y2="${f(cy-22)}"
        stroke="${legColor}" stroke-width="1.5"/>`;
      svg += `<circle cx="${f(cx+side*18)}" cy="${f(cy-22)}" r="3.5" fill="${accent}"/>`;
      svg += `<circle cx="${f(cx+side*18)}" cy="${f(cy-22)}" r="1.8" fill="#0a0a10"/>`;
    }
  }

  // ── COLOR OVERLAY (body iridescence for damselfly) ─────────────────────
  if (isDamsel && n('bodyBlue') > 0.5) {
    svg += `<ellipse cx="${cx}" cy="${bodyY}" rx="${bodyW/2-4}" ry="${bodyH/2-2}"
      fill="hsla(${200+n('bodyBlue')*30},80%,55%,0.35)" filter="url(#glow)"/>`;
  }

  // ── BODY SIZE overlay ─────────────────────────────────────────────────
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#bgrd)"/>`;

  svgEl.innerHTML = svg;
}

function shadeHSL(color, lightDelta) {
  if (color.startsWith('hsl(')) {
    const m = color.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    if (m) return `hsl(${m[1]},${m[2]}%,${Math.min(90,Math.max(10,+m[3]+lightDelta))}%)`;
  }
  return color;
}
function f(n) { return parseFloat(n.toFixed(1)); }
