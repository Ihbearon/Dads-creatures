/**
 * snp-scanner.js
 * Scans a DNA sequence for known SNP positions from the registry.
 * Returns detected SNPs with their allele state relative to reference.
 */

/**
 * Scan the user's sequence for all SNPs in the registry for the current organism.
 * @param {string} seq - The user's current DNA sequence
 * @param {Array} snpList - Array of SNP objects from snp-registry.json
 * @returns {Array} Detected SNPs with allele state and dosage
 */
function scanForSNPs(seq, snpList) {
  const clean = seq.toUpperCase().replace(/[^ACGT]/g, '');
  const detected = [];

  snpList.forEach(snp => {
    const pos = snp.position;
    if (pos >= clean.length) return;

    const observedBase = clean[pos];
    let dosage = 0; // 0 = ref/ref, 1 = ref/alt (het), 2 = alt/alt

    if (observedBase === snp.alt) {
      // At this position the alt allele is present
      // We treat single bases as homozygous for simplicity in this haploid model
      dosage = 2;
    } else if (observedBase === snp.ref) {
      dosage = 0;
    } else {
      // Non-reference, non-alt = novel variant (treated as het-like)
      dosage = 1;
    }

    const effectContrib = snp.beta * dosage;

    detected.push({
      ...snp,
      observedBase,
      dosage,
      effectContrib,
      isAlt: observedBase === snp.alt,
      isRef: observedBase === snp.ref,
      position: pos
    });
  });

  return detected;
}

/**
 * Build a position-indexed map of SNPs for fast lookup during rendering.
 * @param {Array} snpList - Registry SNP list for current organism
 * @returns {Object} Map of position → SNP object
 */
function buildSNPPositionMap(snpList) {
  const map = {};
  snpList.forEach(snp => {
    map[snp.position] = snp;
  });
  return map;
}
