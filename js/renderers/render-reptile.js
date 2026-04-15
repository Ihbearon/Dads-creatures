/**
 * render-reptile.js — SVG renderer for reptile body plan.
 * Handles: green anole (Anolis carolinensis).
 * Horizontal axis, 4 limbs, long tapering tail, dewlap, toe pads.
 */
'use strict';

function renderReptile(scores, svgEl, species) {
  const W = 200, H = 180;
  const cx = W / 2, cy = H / 2 - 10;
  const n = k => (scores[k]?.normalizedScore ?? 50) / 100;

  const bodyGreen = `hsl(${120 + (1-n('bodyColor'))*20},${45+n('bodyColor')*20}%,${28+n('bodyColor')*20}%)`;
  const darkGreen = `hsl(${118 + (1-n('bodyColor'))*15},50%,20%)`;
  const dewHue    = 5 + n('dewlapColor') * 55;  // red → orange → yellow
  const dewCol    = `hsl(${dewHue},85%,52%)`;

  const bodyLen   = 62;
  const bodyH     = 12;
  // Tail extends further right
  const tailLen   = 55;
  const limbLen   = 22 + n('limbLength') * 8;
  const padSize   = 2.5 + n('toePadSize') * 3;

  const headX  = cx - bodyLen/2 - 10;
  const tailX  = cx + bodyLen/2;

  const d = (c, x=15) => {
    const m = c.match(/hsl\((\d+(?:\.\d+)?),(\d+)%,(\d+)%\)/);
    return m ? `hsl(${m[1]},${m[2]}%,${Math.max(10,Math.min(90,+m[3]-x))}%)` : c;
  };

  let svg = `<defs>
    <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${d(bodyGreen,-12)}"/>
      <stop offset="100%" stop-color="${bodyGreen}"/>
    </linearGradient>
  </defs>
  <ellipse cx="${f(cx+8)}" cy="${f(cy+16)}" rx="55" ry="5" fill="rgba(0,0,0,0.2)"/>`;

  // ── TAIL (tapers from body) ────────────────────────────────────────────
  svg += `<path d="M ${f(tailX)},${f(cy-bodyH*0.5)} 
    Q ${f(tailX+tailLen*0.4)},${f(cy-bodyH*0.2)} ${f(tailX+tailLen)},${f(cy+2)}
    Q ${f(tailX+tailLen*0.4)},${f(cy+bodyH*0.5)} ${f(tailX)},${f(cy+bodyH*0.5)} Z"
    fill="${bodyGreen}" stroke="${darkGreen}" stroke-width="0.8"/>`;
  // Tail rings
  for (let i = 1; i < 6; i++) {
    const rx = tailX + i * tailLen/7;
    svg += `<ellipse cx="${f(rx)}" cy="${f(cy+1)}" rx="1.5" ry="${f(bodyH*0.3*(1-i/7))}"
      fill="${d(bodyGreen,8)}" opacity="0.4"/>`;
  }

  // ── BODY ──────────────────────────────────────────────────────────────
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(bodyLen/2)}" ry="${f(bodyH)}"
    fill="url(#repGrad)" stroke="${darkGreen}" stroke-width="1"/>`;
  // Dorsal ridge
  svg += `<path d="M ${f(cx-bodyLen*0.35)},${f(cy-bodyH+3)} Q ${f(cx)},${f(cy-bodyH-2)} ${f(cx+bodyLen*0.35)},${f(cy-bodyH+3)}"
    stroke="${d(bodyGreen,10)}" stroke-width="1.5" fill="none" opacity="0.6"/>`;
  // Scale texture
  for (let i = 0; i < 10; i++) {
    const sx = cx - bodyLen*0.4 + i * bodyLen * 0.09;
    svg += `<ellipse cx="${f(sx)}" cy="${f(cy)}" rx="3.5" ry="2" stroke="${d(bodyGreen,15)}" stroke-width="0.4" fill="none" opacity="0.4"/>`;
  }
  // Belly lighter
  svg += `<ellipse cx="${f(cx)}" cy="${f(cy+bodyH*0.55)}" rx="${f(bodyLen*0.4)}" ry="${f(bodyH*0.38)}"
    fill="hsl(80,30%,65%)" opacity="0.45"/>`;

  // ── 4 LEGS ────────────────────────────────────────────────────────────
  const limbPairs = [
    { x: cx - bodyLen * 0.28, label:'fore' },
    { x: cx + bodyLen * 0.22, label:'hind' },
  ];
  for (const limb of limbPairs) {
    for (const side of [-1, 1]) {
      const isHind  = limb.label === 'hind';
      const limbL   = isHind ? limbLen * 1.15 : limbLen;
      const angBase = isHind ? 60 : 55;
      const lx = limb.x;
      const ly = cy + bodyH * 0.6;
      // Upper limb
      const kx = lx + side * Math.sin(angBase * Math.PI/180) * limbL * 0.5;
      const ky = ly + Math.cos(angBase * Math.PI/180) * limbL * 0.5;
      // Lower limb + foot
      const tx = kx + side * Math.sin((angBase-20)*Math.PI/180) * limbL * 0.5;
      const ty = ky + 8;

      svg += `<line x1="${f(lx)}" y1="${f(ly)}" x2="${f(kx)}" y2="${f(ky)}"
        stroke="${darkGreen}" stroke-width="2.2" stroke-linecap="round"/>`;
      svg += `<line x1="${f(kx)}" y1="${f(ky)}" x2="${f(tx)}" y2="${f(ty)}"
        stroke="${darkGreen}" stroke-width="1.8" stroke-linecap="round"/>`;

      // Toes with adhesive toe pads
      for (let t = -2; t <= 2; t++) {
        const toeX = tx + t * 4;
        const toeY = ty + 5;
        svg += `<line x1="${f(tx)}" y1="${f(ty)}" x2="${f(toeX)}" y2="${f(toeY)}"
          stroke="${darkGreen}" stroke-width="0.9" stroke-linecap="round"/>`;
        // Adhesive pad
        svg += `<circle cx="${f(toeX)}" cy="${f(toeY+1)}" r="${f(padSize)}"
          fill="${d(bodyGreen,-20)}" opacity="0.8"/>`;
      }
    }
  }

  // ── HEAD ──────────────────────────────────────────────────────────────
  const hx = headX;
  svg += `<ellipse cx="${f(hx)}" cy="${f(cy)}" rx="14" ry="${f(bodyH*0.85)}"
    fill="${bodyGreen}" stroke="${darkGreen}" stroke-width="1"/>`;
  // Snout
  svg += `<ellipse cx="${f(hx-12)}" cy="${f(cy+1)}" rx="8" ry="${f(bodyH*0.55)}"
    fill="${d(bodyGreen,-5)}" stroke="${darkGreen}" stroke-width="0.8"/>`;
  // Nostril
  svg += `<circle cx="${f(hx-18)}" cy="${f(cy-2)}" r="1.5" fill="${darkGreen}" opacity="0.7"/>`;
  // Eye
  const eyeX = hx + 5, eyeY = cy - 5;
  svg += `<circle cx="${f(eyeX)}" cy="${f(eyeY)}" r="5" fill="hsl(50,90%,60%)" opacity="0.95"/>`;
  svg += `<circle cx="${f(eyeX+2)}" cy="${f(eyeY-2)}" r="2" fill="rgba(255,255,255,0.7)"/>`;
  svg += `<circle cx="${f(eyeX)}" cy="${f(eyeY)}" r="2.5" fill="#060810"/>`;
  // Orbital ring
  svg += `<circle cx="${f(eyeX)}" cy="${f(eyeY)}" r="5.5" fill="none"
    stroke="${d(bodyGreen,-25)}" stroke-width="0.8" opacity="0.7"/>`;

  // ── DEWLAP ────────────────────────────────────────────────────────────
  // Fan-shaped throat flap hanging below head
  const dpointsCount = 5;
  const dewBase = cy + bodyH * 0.6;
  const dewDropY = dewBase + 22 + n('dewlapColor') * 8;
  svg += `<path d="M ${f(hx-8)},${f(dewBase)} Q ${f(hx-18)},${f(dewDropY+4)} ${f(hx-14)},${f(dewDropY+10)} Q ${f(hx-2)},${f(dewDropY+14)} ${f(hx+6)},${f(dewBase)} Z"
    fill="${dewCol}" stroke="${d(dewCol,15)}" stroke-width="0.8" opacity="0.9"/>`;
  // Dewlap veins
  for (let i = 0; i < 4; i++) {
    const vx = hx - 6 + i * 3;
    svg += `<path d="M ${f(vx)},${f(dewBase+2)} L ${f(vx - i)},${f(dewDropY+4)}"
      stroke="${d(dewCol,20)}" stroke-width="0.5" opacity="0.6"/>`;
  }

  svgEl.innerHTML = svg;
}

function f(n) { return parseFloat(n.toFixed(1)); }
