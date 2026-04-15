/**
 * species-renderer.js
 * Dispatch layer: given a species ID and trait scores,
 * calls the correct body-plan renderer.
 *
 * Also handles the "Free Creature" morpheme-based renderer path.
 */
'use strict';

/**
 * Map species ID → body plan group
 */
const SPECIES_BODY_PLAN = {
  'mosquito':       'insect',
  'damselfly':      'insect',
  'blue-crab':      'crustacean',
  'rock-lobster':   'crustacean',
  'coho-salmon':    'fish',
  'arctic-charr':   'fish',
  'orange-roughy':  'fish',
  'green-peafowl':  'bird',
  'manakin':        'bird',
  'prairie-falcon': 'bird',
  'green-anole':    'reptile',
  'bighorn-sheep':  'mammal',
  'soay-sheep':     'mammal',
  'cattle':         'mammal',
  'camel':          'mammal',
  'labrador':       'mammal',
  'goat':           'mammal',
  'sorghum':        'plant-grass',
  'grass-plant':    'plant-grass',
  'arabidopsis':    'plant-forb',
  'creature':       'morpheme',   // Free Creature — morpheme engine
};

/**
 * Render a species into an SVG element.
 *
 * @param {string} speciesId   - species key from SPECIES_BODY_PLAN
 * @param {Object} scores      - { traitKey: { normalizedScore, traitValue } }
 * @param {HTMLElement} svgEl  - <svg> element to render into
 * @param {Array} morphemes    - morpheme chain (from creature-builder.js), required for 'creature'
 */
function renderSpecies(speciesId, scores, svgEl, morphemes) {
  const plan = SPECIES_BODY_PLAN[speciesId] || 'creature';

  // Ensure SVG viewport
  svgEl.setAttribute('viewBox', '0 0 200 180');
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  switch (plan) {
    case 'insect':
    case 'crustacean':
      if (typeof renderInsect === 'function') {
        renderInsect(scores, svgEl, speciesId);
      } else {
        console.warn('render-insect.js not loaded');
      }
      break;

    case 'fish':
      if (typeof renderFish === 'function') {
        renderFish(scores, svgEl, speciesId);
      } else {
        console.warn('render-fish.js not loaded');
      }
      break;

    case 'bird':
      if (typeof renderBird === 'function') {
        renderBird(scores, svgEl, speciesId);
      } else {
        console.warn('render-bird.js not loaded');
      }
      break;

    case 'reptile':
      if (typeof renderReptile === 'function') {
        renderReptile(scores, svgEl, speciesId);
      } else {
        console.warn('render-reptile.js not loaded');
      }
      break;

    case 'mammal':
      if (typeof renderMammal === 'function') {
        renderMammal(scores, svgEl, speciesId);
      } else {
        console.warn('render-mammal.js not loaded');
      }
      break;

    case 'plant-grass':
    case 'plant-forb':
      if (typeof renderPlant === 'function') {
        renderPlant(scores, svgEl, speciesId);
      } else {
        console.warn('render-plant.js not loaded');
      }
      break;

    case 'morpheme':
    default:
      // Free Creature mode — morph chain drives everything
      if (typeof renderCreature === 'function') {
        renderCreature(morphemes || [], svgEl);
      } else {
        _renderFallback(svgEl, speciesId);
      }
      break;
  }
}

/**
 * Lightweight fallback if a renderer hasn't loaded yet.
 */
function _renderFallback(svgEl, speciesId) {
  svgEl.innerHTML = `
    <rect width="200" height="180" fill="hsl(220,15%,12%)" rx="8"/>
    <text x="100" y="80" text-anchor="middle" fill="hsl(200,60%,70%)"
      font-family="monospace" font-size="11">Loading ${speciesId}…</text>
    <text x="100" y="100" text-anchor="middle" fill="hsl(200,40%,50%)"
      font-family="monospace" font-size="9">Renderer initializing</text>`;
}

/**
 * Normalize raw PGS scores (from computePolygenicScores) into
 * { traitKey: { normalizedScore (0–100), traitValue } } format
 * expected by all renderers.
 *
 * The raw PGS from polygenic-score.js gives { traitKey: { score, contributions } }.
 * We need to convert `score` to a 0-100 range relative to species trait min/max.
 *
 * @param {Object} rawScores  - from computePolygenicScores()
 * @param {Object} traitDefs  - species.traits from species-registry.json
 * @returns {Object}
 */
function normalizeScores(rawScores, traitDefs) {
  const out = {};
  for (const [key, def] of Object.entries(traitDefs || {})) {
    const baseline = def.baseline || 0;
    const min      = def.min      || 0;
    const max      = def.max      || 100;
    const pgsScore = rawScores[key]?.score || 0;
    // Clamp final trait value to [min, max]
    const traitValue = Math.min(max, Math.max(min, baseline + pgsScore));
    // Normalize to 0–100
    const normalizedScore = ((traitValue - min) / (max - min)) * 100;
    out[key] = { normalizedScore, traitValue, baseline, raw: pgsScore };
  }
  return out;
}
