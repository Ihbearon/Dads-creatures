/**
 * render-plant.js — SVG renderer for plant body plans.
 * Handles: arabidopsis (forb), sorghum/ryegrass (grass), and existing plant.
 * Vertical axis growing upward from soil line.
 */
'use strict';

function renderPlant(scores, svgEl, species) {
  const W = 200, H = 180;
  const groundY = H - 20;
  const baseX   = W / 2;
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  const isGrass      = species === 'sorghum' || species === 'grass-plant';
  const isArabidopsis= species === 'arabidopsis';

  // ── Colour derivation ─────────────────────────────────────────────────
  const chlorScore  = n('chlorophyll') || n('bodyColor') || 0.65;
  const anth        = n('anthocyanin') || 0;
  const stemGreen   = `hsl(${115 + anth*20},${40+chlorScore*25}%,${22+chlorScore*22}%)`;
  const leafGreen   = `hsl(${118 + anth*15},${50+chlorScore*20}%,${28+chlorScore*25}%)`;
  const flowerHue   = isArabidopsis ? 290 : (isGrass ? 42 : 50);
  const flowerSat   = isArabidopsis ? 60  : 80;
  const flowerLit   = isArabidopsis ? 55  : 65;

  const d = (c, x=15) => {
    const m = c.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    return m ? `hsl(${m[1]},${m[2]}%,${Math.max(8,Math.min(88,+m[3]-x))}%)` : c;
  };

  // ── Heights ───────────────────────────────────────────────────────────
  const stemH = isGrass
    ? 90 + n('plantHeight') * 55
    : isArabidopsis
    ? 36 + n('rosetteSize') * 18
    : 60 + n('chlorophyll') * 20;

  const stemTop   = groundY - stemH;
  const tillCount = Math.round(1 + n('tillering') * 5);

  let svg = `<defs>
    <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(30,40%,38%)"/>
      <stop offset="100%" stop-color="hsl(25,35%,22%)"/>
    </linearGradient>
    <radialGradient id="flGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${flowerHue},${flowerSat+10}%,${flowerLit+15}%)"/>
      <stop offset="100%" stop-color="hsl(${flowerHue},${flowerSat}%,${flowerLit}%)"/>
    </radialGradient>
  </defs>
  <rect x="0" y="${f(groundY)}" width="${W}" height="${H-groundY}" fill="url(#soilGrad)" rx="2"/>`;

  // ── SOIL ROOT LINES ───────────────────────────────────────────────────
  for (let r = 0; r < 5; r++) {
    const rx = baseX + (r-2)*10;
    svg += `<line x1="${f(rx)}" y1="${f(groundY)}" x2="${f(rx+(r%3-1)*8)}" y2="${f(groundY+14)}"
      stroke="${d('hsl(30,35%,35%)',12)}" stroke-width="1.5" opacity="0.6" stroke-linecap="round"/>`;
  }

  if (isGrass) {
    // ── GRASS / SORGHUM ─────────────────────────────────────────────────
    for (let t = 0; t < tillCount; t++) {
      const tx      = baseX + (t - tillCount/2) * 16;
      const tH      = stemH * (0.75 + t * 0.05);
      const tTop    = groundY - tH;
      const swayX   = tx + (t-tillCount/2) * 6;

      // Stem
      svg += `<path d="M ${f(tx)},${f(groundY)} Q ${f(swayX)},${f(groundY - tH*0.6)} ${f(swayX)},${f(tTop)}"
        stroke="${stemGreen}" stroke-width="${1.8 + n('plantHeight')*0.8}" fill="none" stroke-linecap="round"/>`;

      // Leaf blades at intervals
      const leafW = 4 + n('leafWidth') * 8;
      for (let l = 0; l < 3; l++) {
        const ly   = groundY - tH * (0.2 + l * 0.22);
        const lDir = l % 2 === 0 ? 1 : -1;
        const lLen = leafW * 6;
        svg += `<path d="M ${f(swayX)},${f(ly)} Q ${f(swayX + lDir*lLen*0.6)},${f(ly-8)} ${f(swayX+lDir*lLen)},${f(ly+6)}"
          stroke="${leafGreen}" stroke-width="${f(leafW*0.5)}" fill="none" stroke-linecap="round"/>`;
      }

      // Panicle / seed head (sorghum)
      if (species === 'sorghum') {
        const pLen  = 8 + n('panicleSize') * 18;
        const grainHue = 30 + (1-n('grainColor'))*15;
        svg += `<ellipse cx="${f(swayX)}" cy="${f(tTop - pLen/2)}" rx="${f(pLen*0.4)}" ry="${f(pLen/2)}"
          fill="hsl(${grainHue},65%,45%)" stroke="${d(`hsl(${grainHue},55%,38%)`,-5)}" stroke-width="0.8"/>`;
        // Grain dots on panicle
        for (let g = 0; g < 8; g++) {
          const gx = swayX + ((g*13)%12 - 6) * n('panicleSize');
          const gy = tTop - pLen * (0.15 + (g*7)%12 * 0.07);
          svg += `<circle cx="${f(gx)}" cy="${f(gy)}" r="2"
            fill="hsl(${grainHue+5},70%,40%)" opacity="0.9"/>`;
        }
      } else {
        // Ryegrass seed head spikes
        for (let s = 0; s < 6; s++) {
          const sy2 = tTop - s * 8;
          svg += `<line x1="${f(swayX)}" y1="${f(sy2)}" x2="${f(swayX + (s%2===0?1:-1)*8)}" y2="${f(sy2-4)}"
            stroke="${leafGreen}" stroke-width="1.2" stroke-linecap="round"/>`;
        }
      }
    }
  } else if (isArabidopsis) {
    // ── ARABIDOPSIS ────────────────────────────────────────────────────
    // Rosette leaves
    const rLeaves = 8;
    const rRad    = 14 + n('rosetteSize') * 20;
    const trichDens = n('trichomeDensity');
    for (let l = 0; l < rLeaves; l++) {
      const ang = (l / rLeaves) * Math.PI * 2;
      const lx  = baseX + Math.cos(ang) * rRad;
      const ly  = groundY - 6 + Math.sin(ang) * rRad * 0.5;
      // Each leaf is a teardrop
      svg += `<path d="M ${f(baseX)},${f(groundY-4)} Q ${f((baseX+lx)/2-Math.sin(ang)*5)},${f((groundY-4+ly)/2)} ${f(lx)},${f(ly)} Q ${f((lx+baseX)/2+Math.sin(ang)*5)},${f((ly+groundY-4)/2)} ${f(baseX)},${f(groundY-4)}"
        fill="${leafGreen}" stroke="${d(leafGreen,-8)}" stroke-width="0.5" opacity="0.88"/>`;
      // Trichome dots (hair density)
      if (trichDens > 0.3) {
        const tx2 = lx + (baseX-lx)*0.4;
        const ty2 = ly + (groundY-4-ly)*0.4;
        svg += `<circle cx="${f(tx2)}" cy="${f(ty2)}" r="1" fill="hsl(0,0%,85%)" opacity="${trichDens*0.8}"/>`;
      }
    }

    // Flowering stem
    if (n('floweringTime') < 0.6) {
      svg += `<line x1="${f(baseX)}" y1="${f(groundY-8)}" x2="${f(baseX+8)}" y2="${f(stemTop)}"
        stroke="${stemGreen}" stroke-width="1.5" stroke-linecap="round"/>`;
      // Cauline leaves
      for (let c = 0; c < 3; c++) {
        const cy2  = groundY - 8 - (stemH-20) * (0.2 + c*0.25);
        const cx2  = baseX + 8 + c * 1.5;
        const cDir = c % 2 === 0 ? 1 : -1;
        svg += `<path d="M ${f(cx2)},${f(cy2)} Q ${f(cx2+cDir*12)},${f(cy2-4)} ${f(cx2+cDir*16)},${f(cy2+4)}"
          stroke="${leafGreen}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      }
      // Raceme flowers
      for (let p = 0; p < 5; p++) {
        const px = baseX + 8 + p*1.2 + (p%2)*6;
        const py = stemTop + p * 7;
        // 4 white petals
        for (let pet = 0; pet < 4; pet++) {
          const pa  = (pet / 4) * Math.PI * 2 + Math.PI/4;
          const ppx = px + Math.cos(pa) * 4.5;
          const ppy = py + Math.sin(pa) * 4.5;
          svg += `<ellipse cx="${f(ppx)}" cy="${f(ppy)}" rx="3" ry="2"
            transform="rotate(${pet*90+45},${f(ppx)},${f(ppy)})"
            fill="url(#flGrad)" opacity="0.92"/>`;
        }
        svg += `<circle cx="${f(px)}" cy="${f(py)}" r="2.5" fill="hsl(50,90%,68%)"/>`;
      }
    }
  } else {
    // ── GENERIC/EXISTING PLANT ─────────────────────────────────────────
    // Central stem
    svg += `<line x1="${f(baseX)}" y1="${f(groundY)}" x2="${f(baseX)}" y2="${f(stemTop)}"
      stroke="${stemGreen}" stroke-width="3" stroke-linecap="round"/>`;
    // Branch pairs
    const branches = Math.round(2 + n('tillering') * 3);
    for (let b = 0; b < branches; b++) {
      const bY    = groundY - stemH * (0.25 + b * (0.55/branches));
      const bLen  = 22 - b * 4;
      for (const side of [-1, 1]) {
        const bx = baseX + side * bLen, by = bY - 10;
        svg += `<line x1="${f(baseX)}" y1="${f(bY)}" x2="${f(bx)}" y2="${f(by)}"
          stroke="${stemGreen}" stroke-width="1.8" stroke-linecap="round"/>`;
        // Leaf
        svg += `<ellipse cx="${f(bx + side*7)}" cy="${f(by-4)}" rx="10" ry="5"
          transform="rotate(${-20*side},${f(bx+side*7)},${f(by-4)})"
          fill="${leafGreen}" stroke="${d(leafGreen,-10)}" stroke-width="0.5"/>`;
        // Midrib
        svg += `<line x1="${f(bx)}" y1="${f(by)}" x2="${f(bx+side*14)}" y2="${f(by-5)}"
          stroke="${d(leafGreen,8)}" stroke-width="0.5" opacity="0.6"/>`;
      }
    }
    // Top flower cluster
    svg += `<circle cx="${f(baseX)}" cy="${f(stemTop)}" r="10"
      fill="url(#flGrad)" stroke="${d(`hsl(${flowerHue},${flowerSat}%,${flowerLit}%)`,-10)}" stroke-width="0.8"/>`;
    for (let p = 0; p < 5; p++) {
      const pa  = (p/5)*Math.PI*2;
      const ppx = baseX + Math.cos(pa)*10;
      const ppy = stemTop + Math.sin(pa)*10;
      svg += `<ellipse cx="${f(ppx)}" cy="${f(ppy)}" rx="5" ry="3"
        transform="rotate(${p*72},${f(ppx)},${f(ppy)})"
        fill="url(#flGrad)" opacity="0.88"/>`;
    }
    svg += `<circle cx="${f(baseX)}" cy="${f(stemTop)}" r="4" fill="hsl(50,90%,65%)"/>`;
  }

  svgEl.innerHTML = svg;
}

function f(n) { return parseFloat(n.toFixed(1)); }
