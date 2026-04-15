/**
 * gene-parser.js
 * Finds gene regions (ORFs) in a DNA sequence.
 * Scans for ATG start codons → reads until in-frame stop codon (TAA, TAG, TGA).
 */

/**
 * Find all open reading frames (ORFs) in the sequence.
 * @param {string} seq - DNA sequence
 * @returns {Array} Array of ORF objects { start, end, length, codons }
 */
function findORFs(seq) {
  const clean = seq.toUpperCase().replace(/[^ACGT]/g, '');
  const orfs = [];

  for (let frame = 0; frame < 3; frame++) {
    let inGene = false;
    let geneStart = -1;

    for (let i = frame; i + 2 < clean.length; i += 3) {
      const codon = clean.slice(i, i + 3);
      if (!inGene && codon === 'ATG') {
        inGene = true;
        geneStart = i;
      } else if (inGene && (codon === 'TAA' || codon === 'TAG' || codon === 'TGA')) {
        orfs.push({
          start: geneStart,
          end: i + 3,
          length: i + 3 - geneStart,
          frame,
          codonCount: Math.floor((i + 3 - geneStart) / 3)
        });
        inGene = false;
        geneStart = -1;
      }
    }

    // Handle open-ended ORF at sequence boundary
    if (inGene) {
      orfs.push({
        start: geneStart,
        end: clean.length,
        length: clean.length - geneStart,
        frame,
        codonCount: Math.floor((clean.length - geneStart) / 3),
        openEnded: true
      });
    }
  }

  return orfs.sort((a, b) => a.start - b.start);
}

/**
 * Build a per-nucleotide annotation map: which ORF (if any) each position belongs to.
 * @param {string} seq
 * @returns {Object} Map of position → ORF info (null if not in ORF)
 */
function buildGeneMap(seq) {
  const orfs = findORFs(seq);
  const map = {};
  orfs.forEach((orf, idx) => {
    for (let i = orf.start; i < orf.end; i++) {
      map[i] = { orfIndex: idx, ...orf };
    }
  });
  return map;
}
