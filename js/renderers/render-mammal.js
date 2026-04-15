/**
 * render-mammal.js — SVG renderer for mammal body plans.
 * Handles: bighorn sheep, soay sheep, cattle, camel, labrador, goat.
 * Side-view quadruped: head left, tail right.
 */
'use strict';

function renderMammal(scores, svgEl, species) {
  const W = 200, H = 180;
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  // ── Species config ────────────────────────────────────────────────────
  const cfg = {
    'bighorn-sheep':{ pal:['hsl(35,40%,58%)','hsl(35,35%,32%)','hsl(40,25%,82%)'], hornStyle:'curl',  bodyScale:1.05 },
    'soay-sheep':   { pal:['hsl(35,38%,52%)','hsl(30,30%,28%)','hsl(40,20%,80%)'], hornStyle:'slim',  bodyScale:0.92 },
    'cattle':       { pal:['hsl(30,38%,42%)','hsl(25,30%,20%)','hsl(40,20%,88%)'], hornStyle:'lateral', bodyScale:1.15 },
    'camel':        { pal:['hsl(38,65%,62%)','hsl(35,55%,40%)','hsl(45,30%,80%)'], hornStyle:'none',  bodyScale:1.10, hump:true },
    'labrador':     { pal:['hsl(38,60%,68%)','hsl(25,40%,30%)','hsl(42,20%,92%)'], hornStyle:'none',  bodyScale:0.88, coat:true },
    'goat':         { pal:['hsl(38,28%,62%)','hsl(30,22%,32%)','hsl(40,15%,85%)'], hornStyle:'short', bodyScale:0.90 },
  }[species] || { pal:['hsl(35,40%,55%)','hsl(30,35%,28%)','hsl(40,22%,82%)'], hornStyle:'none', bodyScale:1.0 };

  const [primary, dark, light] = cfg.pal;
  const isHeavy = species === 'cattle' || species === 'bighorn-sheep';
  const isCamel = cfg.hump;

  const bodyScale = cfg.bodyScale;
  const bodyLen   = 70 * bodyScale + n('bodyMass') * 14;
  const bodyH     = 28 * bodyScale + n('bodyMass') * 8;
  const legLen    = isCamel ? 40 : 28 * bodyScale + n('legLength') * 6;
  const neckLen   = isCamel ? 32 + n('neckLength') * 12 : 18 + n('bodyMass') * 2;
  const cx        = W / 2, groundY = H - 30;
  const bodyY     = groundY - legLen - bodyH / 2;
  const bodyX     = cx - bodyLen * 0.1;

  const d = (c, x = 18) => {
    const m = c.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    return m ? `hsl(${m[1]},${m[2]}%,${Math.max(10, Math.min(90, +m[3] - x))}%)` : c;
  };

  let svg = `<defs>
    <linearGradient id="mamGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${d(primary,-12)}"/>
      <stop offset="60%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${d(primary,8)}"/>
    </linearGradient>
  </defs>
  <ellipse cx="${f(cx)}" cy="${f(groundY+4)}" rx="${f(bodyLen*0.42)}" ry="7" fill="rgba(0,0,0,0.22)"/>
  <line x1="15" y1="${f(groundY+2)}" x2="${W-15}" y2="${f(groundY+2)}"
    stroke="${d(primary,30)}" stroke-width="1" opacity="0.3"/>`;

  // ── LEGS ─────────────────────────────────────────────────────────────
  const legPairs = [
    { x: bodyX - bodyLen * 0.32, label:'fore' },
    { x: bodyX + bodyLen * 0.28, label:'hind' },
  ];
  for (const lp of legPairs) {
    // Back legs slightly behind
    for (const off of [3, -3]) {
      const lx = lp.x + off;
      const topY = bodyY + bodyH * 0.35;
      const kneeY = topY + legLen * 0.52;
      const botY  = groundY;
      // Back leg (shadow)
      if (off === 3) {
        svg += `<line x1="${f(lx+4)}" y1="${f(topY+2)}" x2="${f(lx+4)}" y2="${f(kneeY+2)}"
          stroke="${d(primary,12)}" stroke-width="5" stroke-linecap="round" opacity="0.5"/>`;
        svg += `<line x1="${f(lx+4)}" y1="${f(kneeY+2)}" x2="${f(lx+2)}" y2="${f(botY+2)}"
          stroke="${d(primary,12)}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>`;
      }
      // Front leg
      svg += `<line x1="${f(lx)}" y1="${f(topY)}" x2="${f(lx)}" y2="${f(kneeY)}"
        stroke="${dark}" stroke-width="5.5" stroke-linecap="round"/>`;
      svg += `<line x1="${f(lx)}" y1="${f(kneeY)}" x2="${f(lx - (lp.label==='hind'?-2:2))}" y2="${f(botY)}"
        stroke="${dark}" stroke-width="4.5" stroke-linecap="round"/>`;
      // Hoof
      svg += `<ellipse cx="${f(lx-(lp.label==='hind'?-1:1))}" cy="${f(botY+3)}" rx="5" ry="3.5"
        fill="${d(dark,10)}" opacity="0.9"/>`;
      break; // only draw pair once (already accounted for offset trick)
    }
  }

  // ── BODY ─────────────────────────────────────────────────────────────
  svg += `<ellipse cx="${f(bodyX)}" cy="${f(bodyY)}" rx="${f(bodyLen/2)}" ry="${f(bodyH/2)}"
    fill="url(#mamGrad)" stroke="${d(primary,5)}" stroke-width="1"/>`;

  // Belly lighter
  svg += `<ellipse cx="${f(bodyX)}" cy="${f(bodyY+bodyH*0.38)}" rx="${f(bodyLen*0.38)}" ry="${f(bodyH*0.32)}"
    fill="${light}" opacity="0.4"/>`;

  // Coat color (dog, cattle)
  if (cfg.coat) {
    const ccScore = n('coatColor');
    const coatHue = ccScore > 0.65 ? 0   // black
                  : ccScore > 0.3  ? 30  // chocolate
                  : 38;                  // yellow
    const coatSat = ccScore > 0.65 ? 5 : ccScore > 0.3 ? 35 : 60;
    const coatLit = ccScore > 0.65 ? 18 : ccScore > 0.3 ? 35 : 68;
    svg += `<ellipse cx="${f(bodyX)}" cy="${f(bodyY)}" rx="${f(bodyLen/2-3)}" ry="${f(bodyH/2-3)}"
      fill="hsl(${coatHue},${coatSat}%,${coatLit}%)" opacity="0.85"/>`;
  }

  // Coat color (cattle/sheep)
  if (!cfg.coat) {
    const darkness = n('coatColor') / 100;
    if (darkness < 0.3) {
      svg += `<ellipse cx="${f(bodyX)}" cy="${f(bodyY)}" rx="${f(bodyLen/2-3)}" ry="${f(bodyH/2-3)}"
        fill="hsl(0,0%,88%)" opacity="0.5"/>`;
    }
  }

  // ── HUMP (camel) ──────────────────────────────────────────────────────
  if (isCamel) {
    const humpH = 18 + n('humpSize') * 20;
    svg += `<ellipse cx="${f(bodyX + bodyLen*0.05)}" cy="${f(bodyY - bodyH*0.45)}" rx="${f(22)}" ry="${f(humpH/2)}"
      fill="${primary}" stroke="${d(primary,5)}" stroke-width="0.8"/>`;
  }

  // ── NECK ─────────────────────────────────────────────────────────────
  const neckX   = bodyX - bodyLen/2 + 8;
  const neckTopX = isCamel ? neckX - neckLen * 0.3 : neckX - neckLen * 0.5;
  const neckTopY = bodyY - bodyH/2 - neckLen;
  svg += `<path d="M ${f(neckX)},${f(bodyY-bodyH*0.3)} Q ${f(neckX - neckLen*0.2)},${f(bodyY-bodyH-8)} ${f(neckTopX)},${f(neckTopY)}"
    stroke="${dark}" stroke-width="${f(bodyH*0.4)}" stroke-linecap="round" fill="none"/>`;

  // ── HEAD ─────────────────────────────────────────────────────────────
  const headX = neckTopX - 12, headY = neckTopY - 5;
  const headRX = 14 + (isHeavy ? 3 : 0), headRY = isCamel ? 9 : 10;
  svg += `<ellipse cx="${f(headX)}" cy="${f(headY)}" rx="${f(headRX)}" ry="${f(headRY)}"
    fill="${d(primary,-5)}" stroke="${d(primary,5)}" stroke-width="0.9"/>`;
  // Snout
  svg += `<ellipse cx="${f(headX-headRX+4)}" cy="${f(headY+3)}" rx="7" ry="6"
    fill="${primary}" stroke="${d(primary,5)}" stroke-width="0.7"/>`;
  // Eye
  svg += `<circle cx="${f(headX+5)}" cy="${f(headY-3)}" r="4.5" fill="${light}" opacity="0.95"/>`;
  svg += `<circle cx="${f(headX+6)}" cy="${f(headY-4)}" r="1.8" fill="rgba(255,255,255,0.7)"/>`;
  svg += `<circle cx="${f(headX+5)}" cy="${f(headY-3)}" r="2.2" fill="#0a0810"/>`;
  // Ear
  svg += `<ellipse cx="${f(headX+8)}" cy="${f(headY-headRY-4)}" rx="5" ry="7"
    fill="${primary}" stroke="${d(primary,5)}" stroke-width="0.7"/>`;
  svg += `<ellipse cx="${f(headX+8)}" cy="${f(headY-headRY-4)}" rx="3" ry="4.5"
    fill="${light}" opacity="0.55"/>`;

  // ── HORNS ─────────────────────────────────────────────────────────────
  if (cfg.hornStyle !== 'none') {
    const hornScore = n('hornCircumference') || n('hornStyle') || 0.5;
    const hornBase  = 4 + hornScore * 5;

    if (cfg.hornStyle === 'curl') {
      // Bighorn curl horn
      const curlAngle = 0.8 + n('hornCurl') * 1.5;
      const r = 14 + hornScore * 8;
      for (const side of [-1, 1]) {
        const sx = headX + side * 4, sy = headY - headRY;
        svg += `<g transform="translate(${f(sx)},${f(sy)}) scale(${side},1)">
          <path d="M 0,0 A ${f(r)},${f(r)} 0 ${curlAngle>Math.PI?1:0},0 ${f(r*Math.sin(curlAngle))},${f(-r*(1-Math.cos(curlAngle)))}"
            stroke="${d(light,20)}" stroke-width="${f(hornBase)}" fill="none" stroke-linecap="round"/>
        </g>`;
      }
    } else if (cfg.hornStyle === 'lateral') {
      // Cattle lateral horns
      const hLen = 14 + hornScore * 8;
      for (const side of [-1, 1]) {
        svg += `<path d="M ${f(headX + side*5)},${f(headY-headRY+2)} Q ${f(headX+side*(hLen+8))},${f(headY-headRY-6)} ${f(headX+side*(hLen+4))},${f(headY-headRY+4)}"
          stroke="${d(light,15)}" stroke-width="${f(hornBase*0.8)}" fill="none" stroke-linecap="round"/>`;
      }
    } else {
      // Short goat/scimitar horns
      const hLen = 10 + hornScore * 8;
      for (const side of [-1, 1]) {
        svg += `<path d="M ${f(headX + side*3)},${f(headY-headRY)} Q ${f(headX+side*hLen*0.5)},${f(headY-headRY-hLen)} ${f(headX+side*hLen*0.8)},${f(headY-headRY-hLen*0.7)}"
          stroke="${d(light,20)}" stroke-width="${f(hornBase*0.7)}" fill="none" stroke-linecap="round"/>`;
      }
    }
  }

  // ── TAIL ─────────────────────────────────────────────────────────────
  const tailBaseX = bodyX + bodyLen/2 - 4;
  const tailBaseY = bodyY - bodyH * 0.2;
  svg += `<path d="M ${f(tailBaseX)},${f(tailBaseY)} Q ${f(tailBaseX+12)},${f(tailBaseY-8)} ${f(tailBaseX+10)},${f(tailBaseY+16)}"
    stroke="${d(primary,-5)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (!cfg.coat) {
    // Tail tuft for sheep/cattle
    svg += `<ellipse cx="${f(tailBaseX+10)}" cy="${f(tailBaseY+18)}" rx="5" ry="4"
      fill="${light}" opacity="0.6"/>`;
  }

  // ── CAMEL LONG NECK ────────────────────────────────────────────────────
  if (isCamel) {
    svg += `<ellipse cx="${f(neckTopX)}" cy="${f(neckTopY - 3)}" rx="4" ry="3"
      fill="${primary}" opacity="0.6"/>`;
  }

  svgEl.innerHTML = svg;
}

function f(n) { return parseFloat(n.toFixed(1)); }
