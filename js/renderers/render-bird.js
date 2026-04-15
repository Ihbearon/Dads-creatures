/**
 * render-bird.js — SVG renderer for bird body plans.
 * Handles: green peafowl, manakin, prairie falcon.
 * Vertical body axis: head top, tail bottom. Wings spread laterally.
 */
'use strict';

function renderBird(scores, svgEl, species) {
  const W = 200, H = 180;
  const cx = W / 2, cy = 60;
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  const isPeafowl = species === 'green-peafowl';
  const isManakin = species === 'manakin';
  const isFalcon  = species === 'prairie-falcon';

  const pal = isPeafowl ? { p:'hsl(155,68%,32%)', a:'hsl(50,90%,58%)',  h:'hsl(200,80%,55%)' } :
              isManakin  ? { p:'hsl(25,8%,12%)',   a:'hsl(50,5%,94%)',   h:'hsl(45,90%,65%)' } :
                           { p:'hsl(35,50%,58%)',   a:'hsl(30,40%,28%)',  h:'hsl(50,30%,88%)' };

  const d = (c, x=18) => {
    const m = c.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    return m ? `hsl(${m[1]},${m[2]}%,${Math.max(10,Math.min(90,+m[3]-x))}%)` : c;
  };

  const bodyH    = 36;
  const bodyW    = 20;
  const headR    = 10;

  let svg = `<defs>
    <radialGradient id="birdGrad" cx="40%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${d(pal.p,-20)}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${d(pal.p,10)}" stop-opacity="1"/>
    </radialGradient>
    <filter id="bGlow"><feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <ellipse cx="${f(cx)}" cy="${f(cy+bodyH+20)}" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>`;

  // ── TAIL ──────────────────────────────────────────────────────────────
  const tailBot = cy + bodyH + 8;
  if (isPeafowl) {
    // TRAIN — long iridescent tail feathers
    const trainLen = 55 + n('trainLength') * 30;
    const eyeCount = Math.round(4 + n('eyespotCount') * 8);
    // Fan base
    for (let i = -3; i <= 3; i++) {
      const ang  = (i / 3) * 40;
      const rad  = ang * Math.PI / 180;
      const tx   = cx + Math.sin(rad) * trainLen;
      const ty   = tailBot + Math.cos(rad) * trainLen;
      const irid = n('iridescence');
      const hue  = 155 + i * 25 + irid * 30;
      svg += `<path d="M ${f(cx)},${f(tailBot)} Q ${f(cx+Math.sin(rad)*trainLen*0.4)},${f(tailBot+trainLen*0.5)} ${f(tx)},${f(ty)}"
        stroke="hsl(${hue},${60+irid*25}%,${40+irid*20}%)" stroke-width="${2.5-Math.abs(i)*0.3}" fill="none" opacity="0.9"/>`;
      // Eye spots on feathers
      if (Math.abs(i) <= 2) {
        const espX = cx + Math.sin(rad) * trainLen * 0.78;
        const espY = tailBot + Math.cos(rad) * trainLen * 0.78;
        svg += `<circle cx="${f(espX)}" cy="${f(espY)}" r="7" fill="hsl(${hue+40},80%,25%)" opacity="0.85"/>`;
        svg += `<circle cx="${f(espX)}" cy="${f(espY)}" r="4.5" fill="hsl(${hue},85%,55%)" opacity="0.9"/>`;
        svg += `<circle cx="${f(espX)}" cy="${f(espY)}" r="2" fill="hsl(0,0%,8%)" opacity="0.95"/>`;
      }
    }
  } else if (isFalcon) {
    // Swept pointed falcon tail
    svg += `<path d="M ${f(cx-10)},${f(tailBot)} L ${f(cx-6)},${f(tailBot+28)} L ${f(cx)},${f(tailBot+32)} L ${f(cx+6)},${f(tailBot+28)} L ${f(cx+10)},${f(tailBot)}"
      fill="${pal.p}" stroke="${d(pal.p)}" stroke-width="0.8"/>`;
    // Barring on tail
    for (let i = 0; i < 4; i++) {
      svg += `<line x1="${f(cx-10)}" y1="${f(tailBot + i*7)}" x2="${f(cx+10)}" y2="${f(tailBot + i*7)}"
        stroke="${d(pal.p,5)}" stroke-width="1" opacity="0.4"/>`;
    }
  } else {
    // Manakin short tail
    svg += `<path d="M ${f(cx-7)},${f(tailBot)} L ${f(cx-4)},${f(tailBot+16)} L ${f(cx)},${f(tailBot+18)} L ${f(cx+4)},${f(tailBot+16)} L ${f(cx+7)},${f(tailBot)}"
      fill="${d(pal.p,-5)}" stroke="${d(pal.p,8)}" stroke-width="0.7"/>`;
  }

  // ── WINGS ─────────────────────────────────────────────────────────────
  const wSpan = isFalcon ? 55 + n('wingSpan') * 20 : 38;
  for (const side of [-1, 1]) {
    const wx = cx + side * (bodyW/2);
    const wy = cy + bodyH * 0.35;
    const wTipX = cx + side * wSpan;
    const wTipY = isFalcon ? cy + bodyH * 0.1 : cy + bodyH * 0.55;

    const wingFill = isFalcon  ? pal.p :
                     isManakin ? d(pal.p,-8) : pal.p;

    svg += `<path d="M ${f(wx)},${f(wy)} Q ${f(cx+side*wSpan*0.5)},${f(wy-10)} ${f(wTipX)},${f(wTipY)}
            L ${f(wTipX - side*4)},${f(wTipY+14)} Q ${f(cx+side*wSpan*0.45)},${f(wy+12)} ${f(wx)},${f(wy+12)} Z"
      fill="${wingFill}" stroke="${d(wingFill)}" stroke-width="1" opacity="0.92"/>`;

    // Wing feather quills
    for (let q = 0; q < 5; q++) {
      const qx = cx + side * (wSpan * 0.3 + q * wSpan * 0.14);
      const qy = wTipY + q * 2;
      svg += `<line x1="${f(wx + side*2)}" y1="${f(wy+6)}" x2="${f(qx)}" y2="${f(qy)}"
        stroke="${d(wingFill,8)}" stroke-width="0.5" opacity="0.5"/>`;
    }

    // Manakin golden collar shoulder
    if (isManakin) {
      const colHue = 5 + n('collarColor') * 50;
      const colW   = 6 + n('collarWidth') * 6;
      svg += `<ellipse cx="${f(cx + side * colW * 0.6)}" cy="${f(cy+5)}" rx="${f(colW)}" ry="5"
        fill="hsl(${colHue},${colHue > 30 ? 90 : 5}%,${colHue > 30 ? 65 : 94}%)" opacity="0.95"/>`;
    }

    // Falcon malar stripe
    if (isFalcon) {
      const mW = 2 + n('malarStripe') * 5;
      svg += `<path d="M ${f(cx + side*9)},${f(cy - headR - 2)} L ${f(cx + side*(9+mW))},${f(cy - headR + 10)}"
        stroke="${d(pal.a,-5)}" stroke-width="${f(mW*0.8)}" stroke-linecap="round" opacity="0.85"/>`;
    }
  }

  // ── BODY ──────────────────────────────────────────────────────────────
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy+bodyH/2)}" rx="${f(bodyW)}" ry="${f(bodyH/2)}"
    fill="url(#birdGrad)" stroke="${d(pal.p)}" stroke-width="1"/>`;

  // Belly / breast color (manakin white breast, falcon spotted belly)
  if (isManakin) {
    svg += `<ellipse cx="${f(cx)}" cy="${f(cy+bodyH*0.5)}" rx="${f(bodyW-4)}" ry="${f(bodyH*0.4)}"
      fill="hsl(50,5%,94%)" opacity="0.7"/>`;
  }
  if (isFalcon) {
    // Belly spotting
    const spotDensity = n('bellySpotting');
    const spotCount   = Math.round(spotDensity * 16);
    for (let i = 0; i < spotCount; i++) {
      const sx = cx - 8 + ((i * 31) % 18);
      const sy = cy + bodyH*0.2 + ((i*17)%(bodyH*0.55));
      svg += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="2.5" ry="1.8"
        fill="${d(pal.a,-5)}" opacity="0.6"/>`;
    }
  }

  // Plumage iridescence (peafowl)
  if (isPeafowl && n('iridescence') > 0.4) {
    svg += `<ellipse cx="${f(cx)}" cy="${f(cy+bodyH/2)}" rx="${f(bodyW-3)}" ry="${f(bodyH/2-3)}"
      fill="hsl(155,80%,50%)" opacity="${(n('iridescence')-0.4)*0.6}" filter="url(#bGlow)"/>`;
  }

  // ── LEGS ──────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const lx = cx + side * 6;
    const ly = cy + bodyH;
    svg += `<line x1="${f(lx)}" y1="${f(ly)}" x2="${f(lx+side*2)}" y2="${f(ly+18)}"
      stroke="${d(pal.p,5)}" stroke-width="2" stroke-linecap="round"/>`;
    // Toes
    for (const t of [-1, 0, 1]) {
      svg += `<line x1="${f(lx+side*2)}" y1="${f(ly+18)}" x2="${f(lx+side*2+t*6)}" y2="${f(ly+24)}"
        stroke="${d(pal.p,5)}" stroke-width="1" stroke-linecap="round"/>`;
    }
    // Falcon talons
    if (isFalcon) {
      const tLen = 8 + n('talonLength') * 6;
      svg += `<path d="M ${f(lx+side*2+3*side)},${f(ly+24)} Q ${f(lx+side*8)},${f(ly+26)} ${f(lx+side*tLen)},${f(ly+20)}"
        stroke="${d(pal.p,8)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
  }

  // ── HEAD ──────────────────────────────────────────────────────────────
  svg += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(headR)}"
    fill="${d(pal.p,-5)}" stroke="${d(pal.p)}" stroke-width="1"/>`;

  // Eye
  svg += `<circle cx="${f(cx+5)}" cy="${f(cy-2)}" r="3.5" fill="hsl(50,90%,60%)" opacity="0.95"/>`;
  svg += `<circle cx="${f(cx+6)}" cy="${f(cy-3)}" r="1.4" fill="rgba(255,255,255,0.75)"/>`;
  svg += `<circle cx="${f(cx+5)}" cy="${f(cy-2)}" r="1.8" fill="#080810"/>`;

  // Beak
  const beakLen = isFalcon ? 10 : isManakin ? 7 : 8;
  svg += `<path d="M ${f(cx+headR-2)},${f(cy-1)} L ${f(cx+headR+beakLen)},${f(cy+1)} L ${f(cx+headR-2)},${f(cy+3)}"
    fill="${isFalcon ? d(pal.p,-15) : d(pal.a,-10)}" stroke="${d(pal.p,8)}" stroke-width="0.5"/>`;
  // Falcon hooked beak tip
  if (isFalcon) {
    svg += `<path d="M ${f(cx+headR+beakLen)},${f(cy+1)} Q ${f(cx+headR+beakLen+4)},${f(cy+4)} ${f(cx+headR+beakLen+1)},${f(cy+6)}"
      stroke="${d(pal.a,-10)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  }

  // ── CREST ─────────────────────────────────────────────────────────────
  if (isPeafowl) {
    const cH = 10 + n('crestHeight') * 18;
    for (let i = -2; i <= 2; i++) {
      svg += `<line x1="${f(cx + i*2.5)}" y1="${f(cy-headR)}" x2="${f(cx + i*3)}" y2="${f(cy-headR-cH)}"
        stroke="hsl(155,70%,45%)" stroke-width="1.2" stroke-linecap="round"/>`;
      svg += `<circle cx="${f(cx+i*3)}" cy="${f(cy-headR-cH)}" r="2.5"
        fill="hsl(50,90%,60%)" opacity="0.9"/>`;
    }
  } else if (isManakin) {
    // Orbital ring  (display patch)
    svg += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(headR+1)}"
      fill="none" stroke="hsl(50,90%,70%)" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.5"/>`;
  }

  svgEl.innerHTML = svg;
}

function f(n) { return parseFloat(n.toFixed(1)); }
