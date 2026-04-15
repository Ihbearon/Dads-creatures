/**
 * renderer.js
 * SVG-based organism renderer that maps trait scores → visual phenotype.
 * Plant: grass blade cluster with color/height from chlorophyll/anthocyanin/height scores.
 * Animal: sheep silhouette with coat color/spots/horns from MC1R/ASIP/RXFP2 scores.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Color utilities
// ─────────────────────────────────────────────────────────────────────────────

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function multiLerpColor(colors, t) {
  const segments = colors.length - 1;
  const segment = Math.min(Math.floor(t * segments), segments - 1);
  const segT = (t * segments) - segment;
  return lerpColor(colors[segment], colors[segment + 1], segT);
}

// ─────────────────────────────────────────────────────────────────────────────
// Plant renderer
// ─────────────────────────────────────────────────────────────────────────────

function renderPlant(scores, svgEl) {
  const chl = (scores.chlorophyll?.normalizedScore ?? 65) / 100;   // 0=none, 1=max
  const anth = (scores.anthocyanin?.normalizedScore ?? 15) / 100;  // 0=none, 1=deep red
  const heightScore = (scores.height?.normalizedScore ?? 50) / 100;
  const leafW = (scores.leafWidth?.normalizedScore ?? 50) / 100;

  // Color: pure green (#22c55e) → yellow-green → deep purple-red (#7c2d12)
  const greenHex  = '#22c55e';
  const yellowHex = '#eab308';
  const purpleHex = '#7c1d6f';
  const redHex    = '#9f1239';

  const anthRatio = Math.min(1, anth * 1.4);
  const chlLoss   = 1 - chl;
  const bladeColor = multiLerpColor([greenHex, yellowHex, purpleHex, redHex], anthRatio * 0.7 + chlLoss * 0.3);

  const minH = 40, maxH = 120;
  const bladeHeight = minH + heightScore * (maxH - minH);
  const bladeWidth  = 6 + leafW * 14;

  const cx = 100; // SVG center x
  const baseY = 170;

  // Build SVG content
  const numBlades = 5;
  const bladeOffsets = [-30, -16, 0, 16, 30];
  const bladeAngles  = [-12, -5, 0, 5, 12];
  const bladeHeights = [0.75, 0.88, 1, 0.88, 0.75];

  let svg = `
    <!-- Ground shadow -->
    <ellipse cx="${cx}" cy="${baseY + 4}" rx="50" ry="8" fill="rgba(0,0,0,0.25)" />
    <!-- Soil line -->
    <rect x="20" y="${baseY}" width="160" height="8" rx="3" fill="#3d2b1f" opacity="0.7"/>
  `;

  bladeOffsets.forEach((offset, i) => {
    const h = bladeHeight * bladeHeights[i];
    const w = bladeWidth * (i === 2 ? 1 : 0.8);
    const angle = bladeAngles[i];
    const tipX = cx + offset + Math.sin(angle * Math.PI / 180) * h * 0.5;
    const tipY = baseY - h;
    const baseLX = cx + offset - w / 2;
    const baseRX = cx + offset + w / 2;

    // Create gradient for each blade
    const gradId = `bladeGrad${i}`;
    const shadowColor = lerpColor(bladeColor.startsWith('rgb') ? '#1a5c2e' : bladeColor, '#0a1a0a', 0.4);

    svg += `
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stop-color="${shadowColor}" />
          <stop offset="100%" stop-color="${bladeColor}" />
        </linearGradient>
      </defs>
      <path d="M${baseLX},${baseY} Q${cx + offset},${baseY - h * 0.6} ${tipX},${tipY} Q${baseRX + Math.sin(angle*Math.PI/180)*h*0.3},${baseY - h * 0.4} ${baseRX},${baseY} Z"
            fill="url(#${gradId})" opacity="0.95"/>
    `;
  });

  // Leaf veins on center blade
  svg += `
    <line x1="${cx}" y1="${baseY - 5}" x2="${cx + 2}" y2="${baseY - bladeHeight * 0.85}" 
          stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round"/>
  `;

  // Dew drops if high chlorophyll
  if (chl > 0.6) {
    svg += `
      <circle cx="${cx - 6}" cy="${baseY - bladeHeight * 0.5}" r="3" fill="rgba(150,230,255,0.7)" />
      <circle cx="${cx + 18}" cy="${baseY - bladeHeight * 0.65}" r="2" fill="rgba(150,230,255,0.6)" />
    `;
  }

  svgEl.innerHTML = svg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animal renderer (sheep)
// ─────────────────────────────────────────────────────────────────────────────

function renderAnimal(scores, svgEl) {
  const coatScore   = (scores.coatColor?.normalizedScore  ?? 70) / 100;
  const spotScore   = (scores.spotting?.normalizedScore   ?? 10) / 100;
  const hornScore   = (scores.hornLength?.normalizedScore ?? 35) / 100;
  const bodyScore   = (scores.bodySize?.normalizedScore   ?? 50) / 100;

  // Coat: dark brown → mid tan → light cream
  const darkCoat  = '#3d2b1f';
  const tanCoat   = '#c8a070';
  const lightCoat = '#f0e8d8';
  const coatColor = multiLerpColor([darkCoat, tanCoat, lightCoat], coatScore);
  const coatDark  = multiLerpColor(['#1a1008', '#8a6040', '#c8b89a'], coatScore);

  // Body sizing
  const bodyW = 62 + bodyScore * 20;
  const bodyH = 38 + bodyScore * 12;
  const cx = 100;
  const cy = 110;

  // Horn sizing
  const hornLen = hornScore * 32;

  // Spot opacity
  const spotOpacity = spotScore * 0.9;

  let svg = `
    <defs>
      <radialGradient id="bodyGrad" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stop-color="${coatColor}" />
        <stop offset="100%" stop-color="${coatDark}" />
      </radialGradient>
      <radialGradient id="headGrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="${coatColor}" />
        <stop offset="100%" stop-color="${coatDark}" />
      </radialGradient>
      <filter id="softShadow">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="${cx}" cy="162" rx="${bodyW * 0.7}" ry="7" fill="rgba(0,0,0,0.3)" />

    <!-- Legs -->
    <rect x="${cx - bodyW*0.32}" y="${cy + bodyH*0.4}" width="9" height="28" rx="4" fill="${coatDark}" />
    <rect x="${cx - bodyW*0.14}" y="${cy + bodyH*0.4}" width="9" height="28" rx="4" fill="${coatDark}" />
    <rect x="${cx + bodyW*0.08}" y="${cy + bodyH*0.4}" width="9" height="28" rx="4" fill="${coatDark}" />
    <rect x="${cx + bodyW*0.26}" y="${cy + bodyH*0.4}" width="9" height="28" rx="4" fill="${coatDark}" />

    <!-- Hooves -->
    <rect x="${cx - bodyW*0.32}" y="${cy + bodyH*0.4 + 24}" width="9" height="6" rx="2" fill="#1a1008" />
    <rect x="${cx - bodyW*0.14}" y="${cy + bodyH*0.4 + 24}" width="9" height="6" rx="2" fill="#1a1008" />
    <rect x="${cx + bodyW*0.08}" y="${cy + bodyH*0.4 + 24}" width="9" height="6" rx="2" fill="#1a1008" />
    <rect x="${cx + bodyW*0.26}" y="${cy + bodyH*0.4 + 24}" width="9" height="6" rx="2" fill="#1a1008" />

    <!-- Body -->
    <ellipse cx="${cx}" cy="${cy}" rx="${bodyW/2}" ry="${bodyH/2}" fill="url(#bodyGrad)" filter="url(#softShadow)" />

    <!-- White belly spot -->
    <ellipse cx="${cx + bodyW*0.05}" cy="${cy + bodyH*0.2}" rx="${bodyW*0.25}" ry="${bodyH*0.18}" 
             fill="${lightCoat}" opacity="${0.3 + spotOpacity * 0.5}" />
  `;

  // White spotting patches (KIT gene effect)
  if (spotScore > 0.2) {
    svg += `
      <ellipse cx="${cx - bodyW*0.22}" cy="${cy - bodyH*0.1}" rx="${7 + spotScore * 14}" ry="${5 + spotScore * 9}" 
               fill="white" opacity="${spotOpacity * 0.8}" />
      <ellipse cx="${cx + bodyW*0.3}" cy="${cy + bodyH*0.05}" rx="${5 + spotScore * 10}" ry="${4 + spotScore * 7}" 
               fill="white" opacity="${spotOpacity * 0.7}" />
    `;
  }

  // Head
  const headX = cx + bodyW / 2 - 5;
  const headY = cy - bodyH * 0.18;
  svg += `
    <ellipse cx="${headX + 18}" cy="${headY}" rx="22" ry="18" fill="url(#headGrad)" filter="url(#softShadow)" />
    <!-- Snout -->
    <ellipse cx="${headX + 36}" cy="${headY + 5}" rx="11" ry="9" fill="${coatDark}" />
    <!-- Nose -->
    <ellipse cx="${headX + 38}" cy="${headY + 8}" rx="5" ry="3.5" fill="${lerpColor('#1a0a08', '#4a2820', 0.5)}" />
    <!-- Eye -->
    <circle cx="${headX + 20}" cy="${headY - 4}" r="4" fill="#0a0a0a" />
    <circle cx="${headX + 21}" cy="${headY - 5}" r="1.2" fill="rgba(255,255,255,0.7)" />
    <!-- Ear -->
    <ellipse cx="${headX + 8}" cy="${headY - 10}" rx="7" ry="11" fill="${coatColor}" transform="rotate(-20,${headX + 8},${headY - 10})" />
    <ellipse cx="${headX + 8}" cy="${headY - 10}" rx="4" ry="7" fill="${lerpColor(coatColor, '#f5c0a0', 0.5)}" transform="rotate(-20,${headX + 8},${headY - 10})" />
  `;

  // Horns (RXFP2 gene)
  if (hornLen > 4) {
    const hornBase = { x: headX + 15, y: headY - 14 };
    const sweep = hornLen * 0.7;
    svg += `
      <!-- Left horn -->
      <path d="M${hornBase.x},${hornBase.y} 
               C${hornBase.x - sweep * 0.6},${hornBase.y - sweep * 0.8} 
               ${hornBase.x - sweep},${hornBase.y - sweep * 0.3} 
               ${hornBase.x - sweep * 0.8},${hornBase.y + sweep * 0.2}"
            stroke="#5c3d1e" stroke-width="${3 + hornScore * 3}" fill="none" stroke-linecap="round" />
      <!-- Right horn -->
      <path d="M${hornBase.x + 6},${hornBase.y} 
               C${hornBase.x + sweep * 0.6 + 6},${hornBase.y - sweep * 0.8} 
               ${hornBase.x + sweep + 6},${hornBase.y - sweep * 0.3} 
               ${hornBase.x + sweep * 0.8 + 6},${hornBase.y + sweep * 0.2}"
            stroke="#5c3d1e" stroke-width="${3 + hornScore * 3}" fill="none" stroke-linecap="round" />
    `;
  }

  // Tail
  svg += `
    <ellipse cx="${cx - bodyW/2 + 4}" cy="${cy - bodyH*0.05}" rx="8" ry="6" 
             fill="${lightCoat}" opacity="0.9" />
  `;

  // Wool texture (crosshatch marks)
  for (let i = 0; i < 8; i++) {
    const wx = cx - bodyW/2 + 10 + i * (bodyW / 9);
    const wy = cy - bodyH * 0.3 + (i % 2) * 10;
    svg += `<circle cx="${wx}" cy="${wy}" r="4" fill="rgba(255,255,255,0.08)" />`;
  }

  svgEl.innerHTML = svg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main render dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the organism SVG based on current organism type and trait scores.
 * @param {string} organismId - 'plant' | 'animal' | 'creature'
 * @param {Object} scores     - Output from computePolygenicScores() (used for plant/animal)
 * @param {HTMLElement} svgEl - The <svg> element to render into
 * @param {string} [seq]      - Raw DNA sequence (required for 'creature' mode)
 * @returns {Object|undefined} Build metadata for creature mode
 */
function renderOrganism(organismId, scores, svgEl, seq) {
  if (organismId === 'plant') {
    renderPlant(scores, svgEl);
  } else if (organismId === 'animal') {
    renderAnimal(scores, svgEl);
  } else if (organismId === 'creature') {
    return renderCreature(seq || '', svgEl);
  }
}
