/**
 * creature-builder.js
 * Programmatic creature construction from amino acid sequences.
 *
 * Pipeline:
 *   DNA → codons → amino acids (via translateSequence / findORFs)
 *   → morpheme chain (AA_MORPHEMES grammar)
 *   → turtle-graphics resolution
 *   → SVG geometry
 *
 * Biological rules preserved:
 *   - Silent mutations (same AA, different codon) → no shape change
 *   - Missense mutations (AA changes) → body plan changes
 *   - Early STOP codon → truncated body plan
 *   - Longer sequences → more complex creatures
 *   - Met (ATG) always initializes the body axis
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Amino Acid → Morphogenetic Instruction Table
// Each AA maps to a { type, params } morpheme based on real biochemical
// properties of the amino acid.
// ─────────────────────────────────────────────────────────────────────────────

const AA_MORPHEMES = {
  // Initiator — always first (start codon ATG)
  'M': { type: 'init',      label: 'Body axis init',      params: {} },

  // Structural / body segments
  'P': { type: 'segment',   label: 'Torso segment',        params: { length: 16, angle: 0,    width: 14 } },
  'A': { type: 'elongate',  label: 'Elongate segment',     params: { amount: 6 } },
  'G': { type: 'joint',     label: 'Articulation joint',   params: { bend: 22 } },
  'L': { type: 'thicken',   label: 'Body mass increase',   params: { amount: 3 } },
  'V': { type: 'branch',    label: 'Limb branch point',    params: { angle: 55,  length: 18, width: 7 } },
  'I': { type: 'stiffen',   label: 'Limb rigidity',        params: { reduceBend: 12 } },

  // Appendages
  'F': { type: 'fin',       label: 'Lateral fin/wing',     params: { span: 22, height: 12 } },
  'W': { type: 'feature',   label: 'Unusual feature',      params: { kind: 'eye-cluster' } },
  'R': { type: 'horn',      label: 'Horn / protrusion',    params: { length: 14, curve: 0.4 } },
  'K': { type: 'claw',      label: 'Claw / talon tip',     params: { size: 8 } },
  'H': { type: 'sensor',    label: 'Sensory organ',        params: { kind: 'eye' } },
  'D': { type: 'spine',     label: 'Dorsal spine',         params: { height: 10, width: 3 } },
  'E': { type: 'ridge',     label: 'Spinal ridge mod',     params: { heightMod: 4 } },

  // Surface / texture / color
  'S': { type: 'texture',   label: 'Scale texture',        params: { density: 0.6 } },
  'T': { type: 'stripe',    label: 'Color stripe',         params: { width: 4 } },
  'C': { type: 'crosslink', label: 'Structure reinforcement', params: {} },
  'Y': { type: 'pigment',   label: 'Pigment patch',        params: { saturation: 0.8 } },
  'N': { type: 'softTissue', label: 'Soft tissue',         params: { flex: 0.7 } },
  'Q': { type: 'muscle',    label: 'Muscle bulge',         params: { size: 6 } },

  // Stop codon
  '*': { type: 'stop',      label: 'Translation stop',     params: {} },
};

// ─────────────────────────────────────────────────────────────────────────────
// Color palette — assigned to body regions based on AA biochemical class
// ─────────────────────────────────────────────────────────────────────────────

const AA_CLASS_COLOR = {
  nonpolar:  { h: 168, s: 60, l: 42 },   // teal-green
  polar:     { h: 210, s: 55, l: 55 },   // steel blue
  charged_p: { h: 35,  s: 80, l: 55 },   // amber (positive)
  charged_n: { h: 345, s: 65, l: 55 },   // rose (negative)
  aromatic:  { h: 270, s: 50, l: 50 },   // violet
  special:   { h: 60,  s: 75, l: 55 },   // yellow
};

const AA_TO_CLASS = {
  G:'nonpolar', A:'nonpolar', V:'nonpolar', L:'nonpolar', I:'nonpolar',
  P:'special',  F:'aromatic', W:'aromatic', M:'special',
  S:'polar',    T:'polar',    C:'special',  Y:'aromatic', N:'polar', Q:'polar',
  D:'charged_n',E:'charged_n',K:'charged_p',R:'charged_p',H:'charged_p',
};

function aaColor(abbr, lightnessMod = 0) {
  const cls = AA_TO_CLASS[abbr] || 'nonpolar';
  const c = AA_CLASS_COLOR[cls];
  return `hsl(${c.h},${c.s}%,${Math.min(85, Math.max(20, c.l + lightnessMod))}%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Build morpheme chain from amino acid sequence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk the amino acid chain of the longest ORF and return a morpheme list.
 * @param {string} seq - Raw DNA sequence
 * @returns {{ morphemes: Array, aaChain: Array, orfLength: number }}
 */
function buildMorphemeChain(seq) {
  // Get all ORFs
  const orfs = findORFs(seq);
  if (!orfs.length) {
    // No ORF found: walk all codons from position 0
    const allCodons = translateSequence(seq);
    return buildChainFromCodons(allCodons);
  }

  // Take the longest ORF
  const best = orfs.reduce((a, b) => (b.codonCount > a.codonCount ? b : a));

  // Translate just that ORF region
  const orfSeq = seq.toUpperCase().replace(/[^ACGT]/g, '').slice(best.start, best.end);
  const codons = translateSequence(orfSeq);

  return buildChainFromCodons(codons);
}

function buildChainFromCodons(codons) {
  const morphemes = [];
  const aaChain = [];
  let seenStart = false;

  for (const c of codons) {
    const abbr = c.abbr || '?';

    // Must start at ATG/Met
    if (!seenStart) {
      if (abbr === 'M') {
        seenStart = true;
        morphemes.push({ ...AA_MORPHEMES['M'], abbr, color: aaColor('M') });
        aaChain.push(abbr);
      }
      continue;
    }

    if (abbr === '*') {
      morphemes.push({ ...AA_MORPHEMES['*'], abbr, color: '#e74c3c' });
      aaChain.push(abbr);
      break; // stop codon ends the plan
    }

    const morph = AA_MORPHEMES[abbr];
    if (morph) {
      morphemes.push({ ...morph, abbr, color: aaColor(abbr) });
    } else {
      // Unknown AA — treat as elongate
      morphemes.push({ type: 'elongate', label: `Unknown (${abbr})`, params: { amount: 3 }, abbr, color: '#888' });
    }
    aaChain.push(abbr);
  }

  return { morphemes, aaChain, orfLength: aaChain.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Resolve morpheme chain → SVG geometry via turtle graphics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Turtle state
 */
function makeTurtle(x, y, heading, width, color) {
  return { x, y, heading, width, color, scale: 1 };
}

function turtleStep(t, dist) {
  return {
    x: t.x + dist * Math.cos((t.heading * Math.PI) / 180),
    y: t.y + dist * Math.sin((t.heading * Math.PI) / 180),
  };
}

/**
 * Resolve the morpheme list into a list of SVG primitive objects.
 * Works top-to-bottom: the body grows downward from (cx, 30).
 * @param {Array} morphemes
 * @param {Object} options - { svgW, svgH }
 * @returns {Array} primitives [ { kind: 'path'|'circle'|'polygon', ... } ]
 */
function resolveMorphemesToGeometry(morphemes, options = {}) {
  const svgW = options.svgW || 200;
  const svgH = options.svgH || 180;
  const cx = svgW / 2;

  const primitives = [];
  const spines = []; // dorsal spine data collected during walk

  // Main body turtle — starts pointing downward (90°)
  let turtle = makeTurtle(cx, 28, 90, 12, '#4db6ac');

  // Accumulated modifier state
  let currentBend = 0;      // bend accumulator from G joints
  let currentWidth = 12;    // body width
  let spineHeight = 0;      // from D spines
  let spineHeightMod = 0;   // from E ridges
  let textureOn = false;
  let stripeHue = 168;
  let pigmentPatch = null;
  let crosslinked = false;
  let muscleSize = 0;

  // Active branches (limbs in progress)
  const activeBranches = [];

  // Track segment positions for bilateral symmetry (paired limbs)
  const segmentAnchors = [];

  let bodyPath = `M ${cx} ${turtle.y}`;
  let bodyColor = '#3d9970';
  let bodyColorAlt = '#2e7d60';

  for (let mi = 0; mi < morphemes.length; mi++) {
    const m = morphemes[mi];

    switch (m.type) {

      case 'init': {
        // Head — draw based on Met position
        colorFromMorpheme(m, bodyColor);
        bodyColor = m.color;
        bodyColorAlt = aaColor(m.abbr, -15);
        // Draw head circle
        primitives.push({
          kind: 'circle', cx: cx, cy: turtle.y, r: (currentWidth / 2) + 5,
          fill: bodyColor, layer: 'head', strokeW: 1.5, stroke: bodyColorAlt
        });
        break;
      }

      case 'segment': {
        const p = { ...m.params };
        const segLen = p.length + (morphemes[mi - 1]?.type === 'elongate' ? (morphemes[mi - 1].params.amount || 0) : 0);
        const oldPos = { x: turtle.x, y: turtle.y };
        currentBend += 0 + (crosslinked ? -currentBend * 0.5 : 0); // clamp with crosslinks
        turtle.heading = 90 + currentBend;
        const newPos = turtleStep(turtle, segLen);
        turtle.x = newPos.x; turtle.y = newPos.y;

        bodyPath += ` L ${turtle.x.toFixed(1)} ${turtle.y.toFixed(1)}`;
        segmentAnchors.push({ x: turtle.x, y: turtle.y, width: currentWidth, color: m.color });

        // Segment fill rect (rounded)
        primitives.push({
          kind: 'segment',
          x1: oldPos.x, y1: oldPos.y,
          x2: turtle.x, y2: turtle.y,
          width: currentWidth + (muscleSize || 0),
          fill: m.color,
          stroke: aaColor(m.abbr, -20),
          texture: textureOn,
          stripe: stripeHue,
          layer: 'body',
        });

        // Collect spine position
        if (spineHeight > 0) {
          spines.push({ x: turtle.x, y: turtle.y, h: spineHeight + spineHeightMod, color: m.color });
        }

        muscleSize = 0; // reset after use
        break;
      }

      case 'elongate': {
        // Handled inline in 'segment' above; also apply standalone
        const oldPos = { x: turtle.x, y: turtle.y };
        const newPos = turtleStep(turtle, m.params.amount);
        turtle.x = newPos.x; turtle.y = newPos.y;
        bodyPath += ` L ${turtle.x.toFixed(1)} ${turtle.y.toFixed(1)}`;
        break;
      }

      case 'joint': {
        currentBend += m.params.bend * (Math.random() > 0.5 ? 1 : -1);
        currentBend = Math.max(-50, Math.min(50, currentBend));
        break;
      }

      case 'thicken': {
        currentWidth = Math.min(28, currentWidth + m.params.amount);
        break;
      }

      case 'stiffen': {
        currentBend = currentBend * (1 - m.params.reduceBend / 100);
        break;
      }

      case 'branch': {
        // Spawn a limb at current anchor, bidirectionally (left + right)
        const anchor = { x: turtle.x, y: turtle.y };
        const p = m.params;
        const branchL = makeTurtle(anchor.x, anchor.y, turtle.heading + p.angle, p.width, m.color);
        const branchR = makeTurtle(anchor.x, anchor.y, turtle.heading - p.angle, p.width, m.color);

        for (const bTurtle of [branchL, branchR]) {
          const tip = turtleStep(bTurtle, p.length);
          primitives.push({
            kind: 'limb',
            x1: anchor.x, y1: anchor.y,
            x2: tip.x, y2: tip.y,
            width: p.width,
            fill: m.color,
            stroke: aaColor(m.abbr, -18),
            layer: 'limb',
          });
          activeBranches.push({ turtle: { ...bTurtle, x: tip.x, y: tip.y }, depth: 0 });
        }
        break;
      }

      case 'fin': {
        const anchor = { x: turtle.x, y: turtle.y };
        const { span, height } = m.params;
        // Left fin
        primitives.push({
          kind: 'fin',
          x: anchor.x, y: anchor.y,
          span, height, side: 'left',
          fill: m.color, stroke: aaColor(m.abbr, -20),
          layer: 'appendage',
          heading: turtle.heading,
        });
        // Right fin (mirrored)
        primitives.push({
          kind: 'fin',
          x: anchor.x, y: anchor.y,
          span, height, side: 'right',
          fill: m.color, stroke: aaColor(m.abbr, -20),
          layer: 'appendage',
          heading: turtle.heading,
        });
        break;
      }

      case 'horn': {
        const anchor = { x: turtle.x, y: turtle.y };
        const { length: hLen, curve } = m.params;
        primitives.push({
          kind: 'horn',
          x: anchor.x - currentWidth * 0.35,
          y: anchor.y,
          length: hLen, curve,
          side: 'left', fill: m.color, stroke: aaColor(m.abbr, -25),
          layer: 'appendage',
          heading: turtle.heading,
        });
        primitives.push({
          kind: 'horn',
          x: anchor.x + currentWidth * 0.35,
          y: anchor.y,
          length: hLen, curve,
          side: 'right', fill: m.color, stroke: aaColor(m.abbr, -25),
          layer: 'appendage',
          heading: turtle.heading,
        });
        break;
      }

      case 'claw': {
        // Add claws to any active branch tips
        const anchor = { x: turtle.x, y: turtle.y };
        primitives.push({
          kind: 'claw',
          x: anchor.x, y: anchor.y,
          size: m.params.size,
          fill: aaColor('K', -10), stroke: aaColor('K', -30),
          layer: 'appendage',
          heading: turtle.heading,
        });
        break;
      }

      case 'spine': {
        spineHeight = m.params.height;
        break;
      }

      case 'ridge': {
        spineHeightMod += m.params.heightMod;
        break;
      }

      case 'sensor': {
        // Eye / sensory organ
        const { x: ex, y: ey } = turtle;
        primitives.push({
          kind: 'eye',
          cx: ex - currentWidth * 0.3,
          cy: ey - 4,
          r: 4,
          fill: m.color,
          layer: 'feature',
        });
        primitives.push({
          kind: 'eye',
          cx: ex + currentWidth * 0.3,
          cy: ey - 4,
          r: 4,
          fill: m.color,
          layer: 'feature',
        });
        break;
      }

      case 'feature': {
        // e.g. eye cluster from Trp
        const jitter = (i) => (i % 2 === 0 ? -1 : 1) * 5 * Math.ceil(i / 2);
        for (let ei = 0; ei < 3; ei++) {
          primitives.push({
            kind: 'eye',
            cx: turtle.x + jitter(ei),
            cy: turtle.y - 6,
            r: 3,
            fill: m.color,
            layer: 'feature',
          });
        }
        break;
      }

      case 'texture': {
        textureOn = true;
        break;
      }

      case 'stripe': {
        stripeHue = (stripeHue + 40) % 360;
        break;
      }

      case 'crosslink': {
        crosslinked = true;
        break;
      }

      case 'pigment': {
        pigmentPatch = { x: turtle.x, y: turtle.y, r: 10, saturation: m.params.saturation, color: m.color };
        primitives.push({
          kind: 'pigment',
          cx: turtle.x, cy: turtle.y,
          r: currentWidth * 0.4,
          fill: m.color, opacity: m.params.saturation,
          layer: 'surface',
        });
        break;
      }

      case 'softTissue': {
        // Makes segment slightly transparent
        break;
      }

      case 'muscle': {
        muscleSize = m.params.size;
        break;
      }

      case 'stop': {
        // Draw tail nub
        primitives.push({
          kind: 'circle',
          cx: turtle.x, cy: turtle.y,
          r: Math.max(3, currentWidth / 3),
          fill: aaColor('M', -20),
          layer: 'tail',
          strokeW: 1,
          stroke: aaColor('M', -35),
        });
        break;
      }
    }
  }

  // Flush any remaining dorsal spines
  spines.forEach(sp => {
    primitives.push({
      kind: 'spine',
      x: sp.x, y: sp.y, h: sp.h + spineHeightMod,
      fill: sp.color, stroke: aaColor('D', -20),
      layer: 'appendage',
    });
  });

  // Ground shadow at creature's base
  primitives.unshift({
    kind: 'ellipse',
    cx: turtle.x, cy: Math.max(turtle.y + 8, svgH - 14),
    rx: currentWidth * 1.2, ry: 5,
    fill: 'rgba(0,0,0,0.25)',
    layer: 'shadow',
  });

  return primitives;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Convert geometry primitives → SVG markup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a geometry primitive list into SVG string.
 */
function primitivesToSVG(primitives) {
  // Sort by layer depth
  const layerOrder = ['shadow', 'body', 'limb', 'appendage', 'surface', 'tail', 'head', 'feature'];
  const sorted = [...primitives].sort((a, b) => {
    return (layerOrder.indexOf(a.layer) || 0) - (layerOrder.indexOf(b.layer) || 0);
  });

  return sorted.map(p => primitiveToSVG(p)).filter(Boolean).join('\n    ');
}

function primitiveToSVG(p) {
  switch (p.kind) {

    case 'circle':
      return `<circle cx="${f(p.cx)}" cy="${f(p.cy)}" r="${f(p.r)}"
        fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeW || 0}" opacity="0.95"/>`;

    case 'ellipse':
      return `<ellipse cx="${f(p.cx)}" cy="${f(p.cy)}" rx="${f(p.rx)}" ry="${f(p.ry)}"
        fill="${p.fill}" opacity="0.8"/>`;

    case 'segment': {
      // Draw a rounded rectangle along the vector (x1,y1)→(x2,y2)
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const hw = (p.width / 2);
      const pts = [
        [p.x1 + nx * hw, p.y1 + ny * hw],
        [p.x2 + nx * hw, p.y2 + ny * hw],
        [p.x2 - nx * hw, p.y2 - ny * hw],
        [p.x1 - nx * hw, p.y1 - ny * hw],
      ].map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

      return `<polygon points="${pts}"
        fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="1" stroke-linejoin="round" opacity="0.93"/>`;
    }

    case 'limb': {
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const hw = p.width / 2;
      const taperedHW = hw * 0.35;
      const pts = [
        [p.x1 + nx * hw, p.y1 + ny * hw],
        [p.x2 + nx * taperedHW, p.y2 + ny * taperedHW],
        [p.x2 - nx * taperedHW, p.y2 - ny * taperedHW],
        [p.x1 - nx * hw, p.y1 - ny * hw],
      ].map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

      return `<polygon points="${pts}"
        fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="1" stroke-linejoin="round" opacity="0.9"/>`;
    }

    case 'fin': {
      const sign = p.side === 'left' ? -1 : 1;
      const rad = (p.heading - 90) * Math.PI / 180;
      const perpX = Math.cos(rad + Math.PI / 2) * sign;
      const perpY = Math.sin(rad + Math.PI / 2) * sign;
      const tipX = p.x + perpX * p.span;
      const tipY = p.y + perpY * p.span;
      const fwdX = Math.cos(rad);
      const fwdY = Math.sin(rad);
      const baseBackX = p.x - fwdX * p.height * 0.5;
      const baseBackY = p.y - fwdY * p.height * 0.5;

      return `<path d="M ${f(p.x)},${f(p.y)} Q ${f(tipX)},${f(tipY - 8)} ${f(tipX)},${f(tipY)} Q ${f(tipX - perpX * 8)},${f(tipY + 6)} ${f(baseBackX)},${f(baseBackY)} Z"
        fill="${p.fill}" stroke="${p.stroke}" stroke-width="1" opacity="0.85"/>`;
    }

    case 'horn': {
      const sign = p.side === 'left' ? -1 : 1;
      const curve = p.curve * sign;
      const hLen = p.length;
      const baseX = p.x;
      const baseY = p.y;
      // Curve the horn upward/away
      const ctrlX = baseX + sign * hLen * 0.6;
      const ctrlY = baseY - hLen * 0.8;
      const tipX = baseX + sign * hLen * curve * 1.2;
      const tipY = baseY - hLen;

      return `<path d="M ${f(baseX)},${f(baseY)} Q ${f(ctrlX)},${f(ctrlY)} ${f(tipX)},${f(tipY)}"
        stroke="${p.fill}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.93"/>`;
    }

    case 'spine': {
      const tipX = p.x;
      const tipY = p.y - p.h;
      return `<path d="M ${f(p.x - 4)},${f(p.y)} L ${f(tipX)},${f(tipY)} L ${f(p.x + 4)},${f(p.y)}"
        fill="${p.fill}" stroke="${p.stroke}" stroke-width="0.8" opacity="0.9"/>`;
    }

    case 'eye': {
      return `<circle cx="${f(p.cx)}" cy="${f(p.cy)}" r="${f(p.r)}" fill="${p.fill}" opacity="0.95"/>
              <circle cx="${f(p.cx + p.r * 0.25)}" cy="${f(p.cy - p.r * 0.25)}" r="${f(p.r * 0.35)}" fill="rgba(255,255,255,0.7)"/>
              <circle cx="${f(p.cx)}" cy="${f(p.cy)}" r="${f(p.r * 0.5)}" fill="#0a0a0a"/>`;
    }

    case 'claw': {
      const rad = (p.heading - 90) * Math.PI / 180;
      const fwdX = Math.cos(rad);
      const fwdY = Math.sin(rad);
      const sz = p.size;
      return `<path d="M ${f(p.x)},${f(p.y)} L ${f(p.x + fwdX * sz - fwdY * sz * 0.5)},${f(p.y + fwdY * sz + fwdX * sz * 0.5)}
              M ${f(p.x)},${f(p.y)} L ${f(p.x + fwdX * sz + fwdY * sz * 0.5)},${f(p.y + fwdY * sz - fwdX * sz * 0.5)}"
        stroke="${p.fill}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>`;
    }

    case 'pigment': {
      return `<ellipse cx="${f(p.cx)}" cy="${f(p.cy)}" rx="${f(p.r * 1.3)}" ry="${f(p.r)}"
        fill="${p.fill}" opacity="${p.opacity * 0.7}"/>`;
    }

    default:
      return null;
  }
}

function f(n) { return parseFloat(n.toFixed(1)); }

function colorFromMorpheme(m, fallback) {
  return m.color || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level: renderCreature()
// Called from renderer.js when organism === 'creature'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a procedural creature from a DNA sequence into the given SVG element.
 * @param {string} seq - DNA sequence string
 * @param {HTMLElement} svgEl - The <svg> element to render into
 * @returns {{ morphemes, aaChain, orfLength }} — build metadata for display
 */
function renderCreature(seq, svgEl) {
  const svgW = 200;
  const svgH = 180;

  if (!seq || seq.length < 3) {
    svgEl.innerHTML = `<text x="100" y="90" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="11" font-family="Inter,sans-serif">
      Enter a DNA sequence to grow your creature…
    </text>`;
    return { morphemes: [], aaChain: [], orfLength: 0 };
  }

  // Build morpheme chain from sequence
  const { morphemes, aaChain, orfLength } = buildMorphemeChain(seq);

  if (morphemes.length < 2) {
    svgEl.innerHTML = `<text x="100" y="90" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="11" font-family="Inter,sans-serif">
      No ATG start codon found — creature cannot initialize
    </text>`;
    return { morphemes, aaChain, orfLength };
  }

  // Resolve morphemes → geometry primitives
  const primitives = resolveMorphemesToGeometry(morphemes, { svgW, svgH });

  // Convert primitives → SVG markup
  const svgContent = primitivesToSVG(primitives);

  // Inject a defs block with a body gradient
  const dominantColor = morphemes.find(m => m.color)?.color || '#3d9970';
  const svgDefs = `
    <defs>
      <radialGradient id="creatureBodyGrad" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stop-color="${dominantColor}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${shiftHSL(dominantColor, 0, 0, -25)}" stop-opacity="1"/>
      </radialGradient>
      <filter id="creatureGlow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>`;

  svgEl.innerHTML = svgDefs + `\n    ` + svgContent;

  return { morphemes, aaChain, orfLength };
}

/**
 * Naively shifts lightness on an HSL color string or falls back gracefully.
 */
function shiftHSL(colorStr, dh, ds, dl) {
  if (colorStr.startsWith('hsl(')) {
    const m = colorStr.match(/hsl\((\d+),(\d+)%,(\d+)%\)/);
    if (m) {
      const h = +m[1] + dh;
      const s = +m[2] + ds;
      const l = Math.min(90, Math.max(10, +m[3] + dl));
      return `hsl(${h},${s}%,${l}%)`;
    }
  }
  return colorStr;
}

/**
 * Return a short summary of the morpheme chain for display in the trait panel.
 * @param {Array} morphemes
 * @returns {Object} Counts by morpheme type
 */
function summarizeMorphemes(morphemes) {
  const counts = {};
  morphemes.forEach(m => {
    counts[m.type] = (counts[m.type] || 0) + 1;
  });
  return counts;
}
