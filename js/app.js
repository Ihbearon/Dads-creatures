/**
 * app.js
 * Main UI controller for DNA Sandbox — Creature Creator.
 * Wires together: sequence editor → SNP scanner → polygenic scorer → renderer
 */

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let state = {
  currentOrganism: 'plant',
  organisms: null,
  snpRegistry: null,
  sequence: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Data loading
// ─────────────────────────────────────────────────────────────────────────────

async function loadData() {
  const [orgData, snpData] = await Promise.all([
    fetch('./data/organisms.json').then(r => r.json()),
    fetch('./data/snp-registry.json').then(r => r.json()),
  ]);
  state.organisms = orgData.organisms;
  state.snpRegistry = snpData.snps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sequence editor rendering
// ─────────────────────────────────────────────────────────────────────────────

const BASE_COLORS = { A: 'base-a', T: 'base-t', G: 'base-g', C: 'base-c' };

function renderSequenceEditor(seq, snpPositionMap, detectedSNPs) {
  const display = document.getElementById('seq-display');
  const clean = seq.toUpperCase().replace(/[^ACGT]/g, '');

  // Build SNP position → detection map for quick lookup
  const snpDetect = {};
  detectedSNPs.forEach(s => { snpDetect[s.position] = s; });

  let html = '';
  for (let i = 0; i < clean.length; i++) {
    const base = clean[i];
    const colorClass = BASE_COLORS[base] || 'base-unknown';
    const isCodonStart = i % 3 === 0;
    const snpDef = snpPositionMap[i];
    const snpHit = snpDetect[i];

    let classes = `base ${colorClass}`;
    let title = '';
    let dataAttr = '';

    if (snpDef) {
      if (snpHit && snpHit.isAlt) {
        classes += ' snp-alt';
        title = `SNP: ${snpDef.gene} — ${snpDef.description}\nAlt allele (${snpDef.alt}) detected! β=${snpDef.beta > 0 ? '+' : ''}${snpDef.beta}\nSource: ${snpDef.source}`;
      } else {
        classes += ' snp-ref';
        title = `SNP site: ${snpDef.gene}\nRef allele (${snpDef.ref}) — no effect\nAlt would be: ${snpDef.alt} (β=${snpDef.beta})\nSource: ${snpDef.source}`;
      }
      dataAttr = `data-snp="${snpDef.id}"`;
    }

    if (isCodonStart && i > 0) {
      html += `<span class="codon-gap"></span>`;
    }

    html += `<span class="${classes}" title="${title}" ${dataAttr} data-pos="${i}">${base}</span>`;
  }

  display.innerHTML = html || '<span class="placeholder-text">Start typing your DNA sequence above…</span>';
}

// ─────────────────────────────────────────────────────────────────────────────
// Codon strip
// ─────────────────────────────────────────────────────────────────────────────

function renderCodonStrip(seq) {
  const strip = document.getElementById('codon-strip');
  const codons = translateSequence(seq);

  if (codons.length === 0) {
    strip.innerHTML = '<div class="empty-state">Enter a DNA sequence to see codon translation</div>';
    return;
  }

  strip.innerHTML = codons.slice(0, 30).map(c => `
    <div class="codon-chip ${c.isStop ? 'stop-codon' : c.isStart ? 'start-codon' : ''}"
         title="${c.full} (${c.codon})" style="--chip-color:${c.color}">
      <span class="codon-seq">${c.codon}</span>
      <span class="codon-aa">${c.aa}</span>
    </div>
  `).join('') + (codons.length > 30 ? `<div class="codon-more">+${codons.length - 30} more…</div>` : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Gene finder panel
// ─────────────────────────────────────────────────────────────────────────────

function renderGeneFinder(seq) {
  const panel = document.getElementById('gene-list');
  const orfs = findORFs(seq);

  if (orfs.length === 0) {
    panel.innerHTML = '<div class="empty-state">No open reading frames detected</div>';
    return;
  }

  panel.innerHTML = orfs.map((orf, i) => `
    <div class="orf-entry">
      <div class="orf-header">
        <span class="orf-badge">ORF ${i + 1}</span>
        <span class="orf-frame">Frame +${orf.frame + 1}</span>
        ${orf.openEnded ? '<span class="orf-open">open</span>' : ''}
      </div>
      <div class="orf-meta">
        <span>pos ${orf.start}–${orf.end}</span>
        <span>${orf.codonCount} codons</span>
        <span>${orf.length} nt</span>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// SNP inspector panel
// ─────────────────────────────────────────────────────────────────────────────

function renderSNPInspector(detectedSNPs) {
  const panel = document.getElementById('snp-list');

  const withEffect = detectedSNPs.filter(s => s.dosage > 0);

  if (detectedSNPs.length === 0) {
    panel.innerHTML = '<div class="empty-state">No SNP sites in sequence</div>';
    return;
  }

  panel.innerHTML = detectedSNPs.map(snp => {
    const hasEffect = snp.dosage > 0;
    const effectClass = hasEffect ? (snp.beta > 0 ? 'effect-positive' : 'effect-negative') : 'effect-neutral';
    const betaStr = snp.beta > 0 ? `+${snp.beta}` : `${snp.beta}`;
    const contrib = snp.effectContrib > 0 ? `+${snp.effectContrib.toFixed(2)}` : snp.effectContrib.toFixed(2);

    return `
      <div class="snp-entry ${hasEffect ? 'snp-active' : 'snp-ref-only'}">
        <div class="snp-gene">
          <span class="gene-badge">${snp.gene}</span>
          <span class="snp-allele">
            <span class="allele-base ${snp.isRef ? 'allele-current' : ''}">${snp.ref}</span>
            <span class="allele-arrow">→</span>
            <span class="allele-base ${snp.isAlt ? 'allele-current alt' : ''}">${snp.alt}</span>
          </span>
        </div>
        <div class="snp-trait">
          <span class="trait-tag">${snp.trait}</span>
          <span class="beta-value ${effectClass}">β=${betaStr}</span>
          ${hasEffect ? `<span class="contrib-value ${effectClass}">contrib: ${contrib}</span>` : ''}
        </div>
        <div class="snp-desc">${snp.description}</div>
        <div class="snp-citation">
          <a href="${snp.ncbi}" target="_blank" class="citation-link">NCBI ↗</a>
          <span class="citation-text">${snp.source}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Trait scoreboard
// ─────────────────────────────────────────────────────────────────────────────

function renderTraitScoreboard(scores) {
  const board = document.getElementById('trait-board');

  board.innerHTML = Object.entries(scores).map(([trait, data]) => {
    const cls = classifyScore(data.normalizedScore);
    const barFill = data.normalizedScore;
    const contribCount = data.contributors.length;

    return `
      <div class="trait-row">
        <div class="trait-header">
          <span class="trait-icon">${data.icon}</span>
          <span class="trait-label">${data.label}</span>
          <span class="trait-value">${data.traitValue} ${data.unit}</span>
        </div>
        <div class="trait-bar-wrap">
          <div class="trait-bar" style="--bar-fill:${barFill}%">
            <div class="trait-bar-fill ${cls}"></div>
          </div>
          <span class="trait-pct">${data.normalizedScore}%</span>
        </div>
        <div class="trait-contributors">
          ${contribCount > 0
            ? `${contribCount} active SNP${contribCount !== 1 ? 's' : ''} | PGS raw: ${data.rawScore > 0 ? '+' : ''}${data.rawScore}`
            : 'No alt alleles detected — baseline phenotype'}
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Creature scoreboard — shows morpheme type counts instead of PGS
// ─────────────────────────────────────────────────────────────────────────────

const MORPHEME_DISPLAY = {
  segment:   { label: 'Body Segments',  icon: '🔲', color: 'var(--teal)' },
  branch:    { label: 'Limb Pairs',     icon: '🦾', color: 'var(--violet)' },
  fin:       { label: 'Fins / Wings',   icon: '🐟', color: 'var(--amber)' },
  horn:      { label: 'Horns',          icon: '🐏', color: 'var(--rose)' },
  spine:     { label: 'Dorsal Spines',  icon: '📌', color: 'var(--rose)' },
  sensor:    { label: 'Sensory Organs', icon: '👁️', color: '#7dd3fc' },
  feature:   { label: 'Special Features', icon: '✨', color: '#d8b4fe' },
  pigment:   { label: 'Pigment Patches', icon: '🎨', color: 'var(--amber)' },
};

function renderCreatureScoreboard(meta, traitConfig) {
  const board = document.getElementById('trait-board');
  const counts = summarizeMorphemes(meta.morphemes);

  // Count limb pairs (each branch creates 2 limbs, count branch morphemes)
  const rows = Object.entries(MORPHEME_DISPLAY).map(([type, display]) => {
    const count = counts[type] || 0;
    const maxCount = type === 'segment' ? 15 : type === 'branch' ? 6 : 8;
    const pct = Math.min(100, Math.round((count / maxCount) * 100));
    const cls = pct >= 67 ? 'high' : pct >= 33 ? 'medium' : 'low';

    return `
      <div class="trait-row">
        <div class="trait-header">
          <span class="trait-icon">${display.icon}</span>
          <span class="trait-label">${display.label}</span>
          <span class="trait-value">${count}</span>
        </div>
        <div class="trait-bar-wrap">
          <div class="trait-bar" style="--bar-fill:${pct}%">
            <div class="trait-bar-fill ${cls}" style="background:${display.color}"></div>
          </div>
          <span class="trait-pct">${count}</span>
        </div>
        <div class="trait-contributors">
          ${count > 0 ? `${count} ${display.label.toLowerCase()} encoded in AA sequence` : 'Not present in current sequence'}
        </div>
      </div>
    `;
  });

  // ORF length row
  const orfPct = Math.min(100, Math.round((meta.orfLength / 40) * 100));
  rows.push(`
    <div class="trait-row">
      <div class="trait-header">
        <span class="trait-icon">🧬</span>
        <span class="trait-label">ORF Length</span>
        <span class="trait-value">${meta.orfLength} aa</span>
      </div>
      <div class="trait-bar-wrap">
        <div class="trait-bar" style="--bar-fill:${orfPct}%">
          <div class="trait-bar-fill ${orfPct >= 67 ? 'high' : orfPct >= 33 ? 'medium' : 'low'}"></div>
        </div>
        <span class="trait-pct">${meta.orfLength} aa</span>
      </div>
      <div class="trait-contributors">Amino acids translated from longest ORF</div>
    </div>
  `);

  board.innerHTML = rows.join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Glow effect on SVG card based on dominant trait
// ─────────────────────────────────────────────────────────────────────────────

function updateOrganismGlow(scores, organismId, creatureMeta) {
  const card = document.getElementById('organism-card');

  if (organismId === 'plant') {
    const anth = scores.anthocyanin?.normalizedScore ?? 15;
    const chl  = scores.chlorophyll?.normalizedScore ?? 65;
    if (anth > 60) {
      card.style.setProperty('--glow-color', 'rgba(180, 40, 120, 0.5)');
    } else if (chl > 60) {
      card.style.setProperty('--glow-color', 'rgba(34, 197, 94, 0.4)');
    } else {
      card.style.setProperty('--glow-color', 'rgba(234, 179, 8, 0.35)');
    }
  } else if (organismId === 'creature') {
    // Glow color cycles based on morpheme complexity
    const morphCount = creatureMeta?.morphemes?.length || 0;
    if (morphCount > 20) {
      card.style.setProperty('--glow-color', 'rgba(139, 92, 246, 0.5)');  // violet — complex creature
    } else if (morphCount > 10) {
      card.style.setProperty('--glow-color', 'rgba(20, 184, 166, 0.45)'); // teal — medium
    } else {
      card.style.setProperty('--glow-color', 'rgba(234, 179, 8, 0.35)');  // amber — simple
    }
  } else {
    const coat = scores.coatColor?.normalizedScore ?? 70;
    if (coat > 70) {
      card.style.setProperty('--glow-color', 'rgba(240, 232, 216, 0.4)');
    } else if (coat > 40) {
      card.style.setProperty('--glow-color', 'rgba(200, 160, 112, 0.4)');
    } else {
      card.style.setProperty('--glow-color', 'rgba(61, 43, 31, 0.5)');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Master update — runs the full pipeline on every edit
// ─────────────────────────────────────────────────────────────────────────────

function runPipeline() {
  const seq = state.sequence;
  const organism = state.organisms[state.currentOrganism];
  const isCreature = state.currentOrganism === 'creature';

  // For plant/animal: use SNP-based pipeline. For creature: skip SNPs (no registry).
  const snpList = isCreature ? [] : (state.snpRegistry[state.currentOrganism] || []);
  const snpPositionMap = buildSNPPositionMap(snpList);

  // 1. Scan for SNPs (empty for creature)
  const detectedSNPs = scanForSNPs(seq, snpList);

  // 2. Compute polygenic scores (empty for creature)
  const scores = isCreature ? {} : computePolygenicScores(detectedSNPs, organism.traits);

  // 3. Render sequence editor
  renderSequenceEditor(seq, snpPositionMap, detectedSNPs);

  // 4. Render codon strip
  renderCodonStrip(seq);

  // 5. Render gene finder
  renderGeneFinder(seq);

  // 6. Render SNP inspector (empty panel for creature mode)
  renderSNPInspector(detectedSNPs);

  // 7. Render organism SVG — creature passes the raw sequence
  const svgEl = document.getElementById('organism-svg');
  const creatureMeta = renderOrganism(state.currentOrganism, scores, svgEl, seq);

  // 8. Render trait scoreboard
  if (isCreature && creatureMeta) {
    renderCreatureScoreboard(creatureMeta, organism.traits);
  } else {
    renderTraitScoreboard(scores);
  }

  // 9. Update card glow
  updateOrganismGlow(scores, state.currentOrganism, creatureMeta);

  // 10. Update stats badge
  if (isCreature && creatureMeta) {
    document.getElementById('snp-count-badge').textContent =
      `${creatureMeta.orfLength} amino acids · ${creatureMeta.morphemes.length} morphemes`;
  } else {
    const altCount = detectedSNPs.filter(s => s.isAlt).length;
    document.getElementById('snp-count-badge').textContent = `${altCount} alt allele${altCount !== 1 ? 's' : ''} active`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Organism switcher
// ─────────────────────────────────────────────────────────────────────────────

function switchOrganism(id) {
  state.currentOrganism = id;
  state.sequence = state.organisms[id].baseSequence;

  // Update UI
  document.getElementById('seq-input').value = state.sequence;
  document.querySelectorAll('.org-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.organism === id);
  });

  const org = state.organisms[id];
  document.getElementById('organism-name').textContent = org.name;
  document.getElementById('organism-sci').textContent = org.scientificName;
  document.getElementById('organism-desc').textContent = org.description;

  runPipeline();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sequence input handler (debounced)
// ─────────────────────────────────────────────────────────────────────────────

let debounceTimer = null;

function onSequenceInput(e) {
  // Allow only ACGT
  const raw = e.target.value.toUpperCase().replace(/[^ACGT]/g, '');
  if (e.target.value !== raw) {
    const pos = e.target.selectionStart;
    e.target.value = raw;
    e.target.setSelectionRange(pos, pos);
  }
  state.sequence = raw;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runPipeline, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation buttons — inject random/targeted mutations
// ─────────────────────────────────────────────────────────────────────────────

function injectMutation(type) {
  const snpList = state.snpRegistry[state.currentOrganism];
  let seq = state.sequence.split('');

  if (type === 'random') {
    const bases = ['A', 'T', 'G', 'C'];
    const pos = Math.floor(Math.random() * seq.length);
    const current = seq[pos];
    let newBase = bases[Math.floor(Math.random() * 4)];
    while (newBase === current) newBase = bases[Math.floor(Math.random() * 4)];
    seq[pos] = newBase;
    showMutationFlash(`Random mutation at position ${pos}: ${current}→${newBase}`);
  } else if (type === 'snp-alt') {
    // Flip a random SNP to its alt allele
    const randomSNP = snpList[Math.floor(Math.random() * snpList.length)];
    if (randomSNP.position < seq.length) {
      seq[randomSNP.position] = randomSNP.alt;
      showMutationFlash(`Alt allele injected: ${randomSNP.gene} ${randomSNP.ref}→${randomSNP.alt} (β=${randomSNP.beta})`);
    }
  } else if (type === 'reset') {
    seq = state.organisms[state.currentOrganism].baseSequence.split('');
    showMutationFlash('Sequence reset to reference');
  } else if (type === 'all-alt') {
    snpList.forEach(snp => {
      if (snp.position < seq.length) seq[snp.position] = snp.alt;
    });
    showMutationFlash('All SNPs set to alt alleles — maximum effect!');
  }

  state.sequence = seq.join('');
  document.getElementById('seq-input').value = state.sequence;
  runPipeline();
}

function showMutationFlash(msg) {
  const flash = document.getElementById('mutation-flash');
  flash.textContent = msg;
  flash.classList.add('visible');
  setTimeout(() => flash.classList.remove('visible'), 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip positioning for SNP clicks
// ─────────────────────────────────────────────────────────────────────────────

function setupSNPTooltips() {
  const display = document.getElementById('seq-display');
  const tooltip = document.getElementById('snp-tooltip');

  display.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-snp]');
    if (!el) return;
    const snpId = el.dataset.snp;
    const snp = state.snpRegistry[state.currentOrganism].find(s => s.id === snpId);
    if (!snp) return;

    tooltip.innerHTML = `
      <div class="tt-gene">${snp.gene} — ${snp.geneFull}</div>
      <div class="tt-locus">${snp.locus}</div>
      <div class="tt-desc">${snp.description}</div>
      <div class="tt-beta">Effect: β = ${snp.beta > 0 ? '+' : ''}${snp.beta} on <em>${snp.trait}</em></div>
      <div class="tt-allele">Ref: <strong>${snp.ref}</strong> → Alt: <strong>${snp.alt}</strong></div>
      <div class="tt-source">${snp.source}</div>
      <a href="${snp.ncbi}" target="_blank" class="tt-link">View on NCBI Gene ↗</a>
    `;
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';
  });

  display.addEventListener('mousemove', e => {
    tooltip.style.left = (e.pageX + 14) + 'px';
    tooltip.style.top = (e.pageY - 10) + 'px';
  });

  display.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DNA helix background animation
// ─────────────────────────────────────────────────────────────────────────────

function initHelixBackground() {
  const canvas = document.getElementById('helix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let t = 0;

  function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const amplitude = 40;
    const period = 90;
    const numStrands = 2;

    for (let strand = 0; strand < numStrands; strand++) {
      ctx.beginPath();
      for (let y = 0; y < h; y += 2) {
        const x = w * 0.5 + amplitude * Math.sin((y + t + strand * Math.PI * period * 0.5) / period * Math.PI * 2);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(20, 184, 166, ${strand === 0 ? 0.06 : 0.04})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw base pair rungs
    for (let y = (t % period); y < h; y += period) {
      const x1 = w * 0.5 + amplitude * Math.sin((y + t) / period * Math.PI * 2);
      const x2 = w * 0.5 + amplitude * Math.sin((y + t + Math.PI * period * 0.5) / period * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    t += 0.4;
    requestAnimationFrame(draw);
  }

  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  await loadData();

  // Wire organism switcher buttons
  document.querySelectorAll('.org-btn').forEach(btn => {
    btn.addEventListener('click', () => switchOrganism(btn.dataset.organism));
  });

  // Wire sequence textarea
  document.getElementById('seq-input').addEventListener('input', onSequenceInput);

  // Wire mutation buttons
  document.querySelectorAll('[data-mutate]').forEach(btn => {
    btn.addEventListener('click', () => injectMutation(btn.dataset.mutate));
  });

  // Setup SNP tooltips
  setupSNPTooltips();

  // Init helix canvas
  initHelixBackground();

  // Load first organism
  switchOrganism('plant');
}

document.addEventListener('DOMContentLoaded', init);
