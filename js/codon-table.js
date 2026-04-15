/**
 * codon-table.js
 * NCBI Standard Genetic Code (Translation Table 1)
 * https://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/index.cgi?chapter=tgencodes#SG1
 */

const CODON_TABLE = {
  'TTT': { aa: 'Phe', full: 'Phenylalanine',   abbr: 'F', color: '#e8a87c' },
  'TTC': { aa: 'Phe', full: 'Phenylalanine',   abbr: 'F', color: '#e8a87c' },
  'TTA': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'TTG': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'CTT': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'CTC': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'CTA': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'CTG': { aa: 'Leu', full: 'Leucine',          abbr: 'L', color: '#a8d8a8' },
  'ATT': { aa: 'Ile', full: 'Isoleucine',       abbr: 'I', color: '#7ec8d0' },
  'ATC': { aa: 'Ile', full: 'Isoleucine',       abbr: 'I', color: '#7ec8d0' },
  'ATA': { aa: 'Ile', full: 'Isoleucine',       abbr: 'I', color: '#7ec8d0' },
  'ATG': { aa: 'Met', full: 'Methionine (START)', abbr: 'M', color: '#f7dc6f', isStart: true },
  'GTT': { aa: 'Val', full: 'Valine',           abbr: 'V', color: '#a8d8a8' },
  'GTC': { aa: 'Val', full: 'Valine',           abbr: 'V', color: '#a8d8a8' },
  'GTA': { aa: 'Val', full: 'Valine',           abbr: 'V', color: '#a8d8a8' },
  'GTG': { aa: 'Val', full: 'Valine',           abbr: 'V', color: '#a8d8a8' },
  'TCT': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'TCC': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'TCA': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'TCG': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'CCT': { aa: 'Pro', full: 'Proline',          abbr: 'P', color: '#f1948a' },
  'CCC': { aa: 'Pro', full: 'Proline',          abbr: 'P', color: '#f1948a' },
  'CCA': { aa: 'Pro', full: 'Proline',          abbr: 'P', color: '#f1948a' },
  'CCG': { aa: 'Pro', full: 'Proline',          abbr: 'P', color: '#f1948a' },
  'ACT': { aa: 'Thr', full: 'Threonine',        abbr: 'T', color: '#85c1e9' },
  'ACC': { aa: 'Thr', full: 'Threonine',        abbr: 'T', color: '#85c1e9' },
  'ACA': { aa: 'Thr', full: 'Threonine',        abbr: 'T', color: '#85c1e9' },
  'ACG': { aa: 'Thr', full: 'Threonine',        abbr: 'T', color: '#85c1e9' },
  'GCT': { aa: 'Ala', full: 'Alanine',          abbr: 'A', color: '#82e0aa' },
  'GCC': { aa: 'Ala', full: 'Alanine',          abbr: 'A', color: '#82e0aa' },
  'GCA': { aa: 'Ala', full: 'Alanine',          abbr: 'A', color: '#82e0aa' },
  'GCG': { aa: 'Ala', full: 'Alanine',          abbr: 'A', color: '#82e0aa' },
  'TAT': { aa: 'Tyr', full: 'Tyrosine',         abbr: 'Y', color: '#f9e79f' },
  'TAC': { aa: 'Tyr', full: 'Tyrosine',         abbr: 'Y', color: '#f9e79f' },
  'TAA': { aa: '***', full: 'STOP (Ochre)',      abbr: '*', color: '#e74c3c', isStop: true },
  'TAG': { aa: '***', full: 'STOP (Amber)',      abbr: '*', color: '#e74c3c', isStop: true },
  'CAT': { aa: 'His', full: 'Histidine',        abbr: 'H', color: '#a9cce3' },
  'CAC': { aa: 'His', full: 'Histidine',        abbr: 'H', color: '#a9cce3' },
  'CAA': { aa: 'Gln', full: 'Glutamine',        abbr: 'Q', color: '#d2b4de' },
  'CAG': { aa: 'Gln', full: 'Glutamine',        abbr: 'Q', color: '#d2b4de' },
  'AAT': { aa: 'Asn', full: 'Asparagine',       abbr: 'N', color: '#a9dfbf' },
  'AAC': { aa: 'Asn', full: 'Asparagine',       abbr: 'N', color: '#a9dfbf' },
  'AAA': { aa: 'Lys', full: 'Lysine',           abbr: 'K', color: '#f8c471' },
  'AAG': { aa: 'Lys', full: 'Lysine',           abbr: 'K', color: '#f8c471' },
  'GAT': { aa: 'Asp', full: 'Aspartate',        abbr: 'D', color: '#f1948a' },
  'GAC': { aa: 'Asp', full: 'Aspartate',        abbr: 'D', color: '#f1948a' },
  'GAA': { aa: 'Glu', full: 'Glutamate',        abbr: 'E', color: '#ec7063' },
  'GAG': { aa: 'Glu', full: 'Glutamate',        abbr: 'E', color: '#ec7063' },
  'TGT': { aa: 'Cys', full: 'Cysteine',         abbr: 'C', color: '#f9e79f' },
  'TGC': { aa: 'Cys', full: 'Cysteine',         abbr: 'C', color: '#f9e79f' },
  'TGA': { aa: '***', full: 'STOP (Opal)',       abbr: '*', color: '#e74c3c', isStop: true },
  'TGG': { aa: 'Trp', full: 'Tryptophan',       abbr: 'W', color: '#c39bd3' },
  'CGT': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'CGC': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'CGA': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'CGG': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'AGT': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'AGC': { aa: 'Ser', full: 'Serine',           abbr: 'S', color: '#d7bde2' },
  'AGA': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'AGG': { aa: 'Arg', full: 'Arginine',         abbr: 'R', color: '#7fb3d3' },
  'GGT': { aa: 'Gly', full: 'Glycine',          abbr: 'G', color: '#abebc6' },
  'GGC': { aa: 'Gly', full: 'Glycine',          abbr: 'G', color: '#abebc6' },
  'GGA': { aa: 'Gly', full: 'Glycine',          abbr: 'G', color: '#abebc6' },
  'GGG': { aa: 'Gly', full: 'Glycine',          abbr: 'G', color: '#abebc6' }
};

/**
 * Translate a DNA sequence into an array of amino acid objects.
 * Starts translation at the first ATG and stops at stop codon.
 * @param {string} seq - Raw DNA string (only ACGT)
 * @returns {Array} Array of codon objects with position, codon, aa info
 */
function translateSequence(seq) {
  const clean = seq.toUpperCase().replace(/[^ACGT]/g, '');
  const result = [];
  for (let i = 0; i + 2 < clean.length; i += 3) {
    const codon = clean.slice(i, i + 3);
    const entry = CODON_TABLE[codon] || { aa: '???', full: 'Unknown codon', abbr: '?', color: '#888' };
    result.push({ position: i, codon, ...entry });
  }
  return result;
}

/**
 * Look up a single codon.
 * @param {string} codon - 3-letter DNA string
 * @returns {Object} Amino acid info
 */
function lookupCodon(codon) {
  return CODON_TABLE[codon.toUpperCase()] || { aa: '???', full: 'Unknown', abbr: '?', color: '#888' };
}
