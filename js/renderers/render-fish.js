/**
 * render-fish.js — SVG renderer for fish body plans.
 * Handles: coho salmon, arctic charr, orange roughy.
 * Horizontal axis, torpedo body, fins at positions, scale texture, color.
 */
'use strict';

function renderFish(scores, svgEl, species) {
  const W = 200, H = 180;
  const cx = W / 2, cy = H / 2;
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  const isCharr  = species === 'arctic-charr';
  const isRoughy = species === 'orange-roughy';

  const pal = isCharr  ? { p:'hsl(200,48%,40%)', a:'hsl(15,85%,55%)', h:'hsl(30,90%,70%)'  } :
              isRoughy ? { p:'hsl(20,80%,50%)',   a:'hsl(15,70%,38%)', h:'hsl(30,90%,65%)'  } :
                         { p:'hsl(200,42%,45%)',   a:'hsl(10,78%,50%)', h:'hsl(50,70%,72%)'  };

  const bodyLen  = isRoughy ? 80         : 90 + n('bodyLength') * 20;
  const bodyH2   = isRoughy ? 28         : 18 + n('bodyDepth') * 8;
  const bodyX    = cx - bodyLen / 2;
  const spawnRed = isCharr ? 0 : n('spawnColor');
  const bodyCol  = spawnRed > 0.4
    ? `hsl(${10 - spawnRed*8},${60+spawnRed*20}%,${45-spawnRed*10}%)`
    : pal.p;

  const dark = (c, d=18) => {
    const m = c.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    if (m) return `hsl(${m[1]},${m[2]}%,${Math.max(10,+m[3]-d)}%)`;
    return c;
  };

  let svg = `<defs>
    <radialGradient id="fishGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="${pal.h}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${bodyCol}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="bellyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bodyCol}"/>
      <stop offset="100%" stop-color="hsl(0,0%,88%)"/>
    </linearGradient>
  </defs>
  <ellipse cx="${f(cx)}" cy="${f(cy+6)}" rx="${f(bodyLen*0.44)}" ry="6" fill="rgba(0,0,0,0.2)"/>`;

  // ── TAIL FIN ──────────────────────────────────────────────────────────
  const tailX = bodyX + bodyLen + 4;
  svg += `<path d="M ${f(tailX)},${f(cy-bodyH2*0.6)} Q ${f(tailX+20)},${f(cy-bodyH2*1.1)} ${f(tailX+18)},${f(cy)}"
    fill="${dark(pal.a,8)}" stroke="${dark(pal.a,20)}" stroke-width="0.8" opacity="0.85"/>`;
  svg += `<path d="M ${f(tailX)},${f(cy+bodyH2*0.6)} Q ${f(tailX+20)},${f(cy+bodyH2*1.1)} ${f(tailX+18)},${f(cy)}"
    fill="${dark(pal.a,8)}" stroke="${dark(pal.a,20)}" stroke-width="0.8" opacity="0.85"/>`;

  // ── MAIN BODY ─────────────────────────────────────────────────────────
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(bodyLen/2)}" ry="${f(bodyH2)}"
    fill="url(#fishGrad)" stroke="${dark(bodyCol)}" stroke-width="1"/>`;
  // Belly lighter patch
  svg += `<ellipse cx="${f(cx+bodyLen*0.08)}" cy="${f(cy+bodyH2*0.45)}" rx="${f(bodyLen*0.32)}" ry="${f(bodyH2*0.45)}"
    fill="hsl(0,0%,88%)" opacity="0.5"/>`;

  // ── DORSAL FIN ────────────────────────────────────────────────────────
  const dfx = cx - bodyLen * 0.05;
  svg += `<path d="M ${f(dfx-14)},${f(cy-bodyH2+1)} Q ${f(dfx)},${f(cy-bodyH2-18)} ${f(dfx+14)},${f(cy-bodyH2+1)}"
    fill="${pal.a}" stroke="${dark(pal.a,15)}" stroke-width="0.8" opacity="0.88"/>`;

  // ── PECTORAL FINS ─────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const pfx = cx - bodyLen * 0.18;
    const pfy = cy + side * bodyH2 * 0.3;
    svg += `<path d="M ${f(pfx)},${f(pfy)} Q ${f(pfx+side*6)},${f(pfy+side*18)} ${f(pfx+20)},${f(pfy+side*12)}"
      fill="${pal.a}" stroke="${dark(pal.a,10)}" stroke-width="0.7" opacity="0.8"/>`;
  }

  // ── ADIPOSE FIN (charr) ────────────────────────────────────────────────
  if (isCharr) {
    const afSz = 6 + n('adiposeFin') * 6;
    svg += `<ellipse cx="${f(tailX-20)}" cy="${f(cy-bodyH2+3)}" rx="${f(afSz)}" ry="${f(afSz*0.55)}"
      fill="${pal.a}" opacity="0.75"/>`;
  }

  // ── HEAD ──────────────────────────────────────────────────────────────
  const headX = bodyX - 4;
  svg += `<ellipse cx="${f(headX)}" cy="${f(cy)}" rx="12" ry="${f(bodyH2*0.72)}"
    fill="${dark(bodyCol,-5)}" stroke="${dark(bodyCol)}" stroke-width="0.8"/>`;
  // Eye
  svg += `<circle cx="${f(headX+4)}" cy="${f(cy-5)}" r="4.5" fill="${pal.h}" opacity="0.95"/>`;
  svg += `<circle cx="${f(headX+5)}" cy="${f(cy-6)}" r="1.8" fill="rgba(255,255,255,0.7)"/>`;
  svg += `<circle cx="${f(headX+4)}" cy="${f(cy-5)}" r="2.2" fill="#0a0a10"/>`;
  // Jaw hook (salmon)
  if (!isCharr && !isRoughy && n('jawHook') > 0.4) {
    const jLen = n('jawHook') * 10;
    svg += `<path d="M ${f(headX-10)},${f(cy+2)} Q ${f(headX-14-jLen)},${f(cy+8)} ${f(headX-10)},${f(cy+10)}"
      stroke="${dark(bodyCol,5)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  // Roughy spines
  if (isRoughy) {
    const spCount = Math.round(4 + n('spineCount') * 6);
    for (let i = 0; i < spCount; i++) {
      const sx = headX - 8 + i * 5;
      svg += `<line x1="${f(sx)}" y1="${f(cy-bodyH2)}" x2="${f(sx)}" y2="${f(cy-bodyH2-8-i%2*4)}"
        stroke="${dark(pal.a,10)}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
  }

  // ── SCALE TEXTURE ─────────────────────────────────────────────────────
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const sx = bodyX + 8 + col * (bodyLen * 0.11);
      const sy = cy - bodyH2 * 0.5 + row * (bodyH2 * 0.32);
      svg += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="4" ry="2.5"
        stroke="${dark(bodyCol,10)}" stroke-width="0.5" fill="none" opacity="0.35"/>`;
    }
  }

  // ── SPOTS (charr) ─────────────────────────────────────────────────────
  if (isCharr) {
    const spotCount = Math.round(6 + n('spotCount') * 18);
    const spotHue   = 30 - n('spotColor') * 20;
    for (let i = 0; i < spotCount; i++) {
      // Pseudo-random using deterministic positions
      const sx = bodyX + 18 + ((i * 37) % (bodyLen - 30));
      const sy = cy - bodyH2 * 0.6 + ((i * 53) % (bodyH2 * 1.2));
      const sr = 2.5 + ((i * 17) % 3);
      svg += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(sr)}"
        fill="hsl(${spotHue},90%,60%)" opacity="0.88"/>`;
      // Halo
      svg += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(sr+2)}"
        fill="none" stroke="hsl(0,0%,90%)" stroke-width="0.8" opacity="0.5"/>`;
    }
  }

  // ── PARR MARKS (salmon juvenile) ──────────────────────────────────────
  if (!isCharr && !isRoughy && spawnRed < 0.3) {
    for (let i = 0; i < 8; i++) {
      const px = bodyX + 20 + i * (bodyLen * 0.1);
      svg += `<ellipse cx="${f(px)}" cy="${f(cy)}" rx="3" ry="${f(bodyH2*0.5)}"
        fill="${dark(bodyCol,8)}" opacity="0.35"/>`;
    }
  }

  // ── SPAWNING COLOR OVERLAY ─────────────────────────────────────────────
  if (spawnRed > 0.3) {
    svg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(bodyLen/2-6)}" ry="${f(bodyH2-4)}"
      fill="hsl(8,75%,50%)" opacity="${(spawnRed-0.3)*0.7}"/>`;
  }

  svgEl.innerHTML = svg;
}

function f(n) { return parseFloat(n.toFixed(1)); }
