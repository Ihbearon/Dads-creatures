/**
 * polygenic-score.js
 * Computes polygenic trait scores using the standard PGS formula:
 *   PGS_trait = Σ_i ( β_i × dosage_i )
 *
 * This mirrors real-world polygenic risk scoring (PRSice, LDpred methodology).
 * β values are sourced from published GWAS literature (see snp-registry.json).
 */

/**
 * Compute per-trait polygenic scores from scanned SNPs.
 * @param {Array} detectedSNPs - Output from scanForSNPs()
 * @param {Object} traitConfig  - Trait definitions from organisms.json (min/max/baseline)
 * @returns {Object} Map of trait → { rawScore, normalizedScore, contributors }
 */
function computePolygenicScores(detectedSNPs, traitConfig) {
  const traitAccumulators = {};

  // Initialize accumulators for each trait
  Object.keys(traitConfig).forEach(trait => {
    traitAccumulators[trait] = {
      rawScore: 0,
      contributors: []
    };
  });

  // Accumulate β × dosage for each SNP
  detectedSNPs.forEach(snp => {
    const { trait, beta, dosage, effectContrib, gene, geneFull, id, source, description } = snp;
    if (!traitAccumulators[trait]) return;

    traitAccumulators[trait].rawScore += effectContrib;
    if (dosage > 0) {
      traitAccumulators[trait].contributors.push({
        id, gene, geneFull, beta, dosage, effectContrib, source, description
      });
    }
  });

  // Normalize scores to trait range
  const results = {};
  Object.entries(traitAccumulators).forEach(([trait, acc]) => {
    const config = traitConfig[trait];
    if (!config) return;

    // PGS ranges from roughly -2 to +2 for our SNP set (β magnitudes up to 0.8, dosage 0-2)
    // Map to trait's biological min/max
    const pgsMin = -3;
    const pgsMax = 3;
    const proportion = Math.max(0, Math.min(1, (acc.rawScore - pgsMin) / (pgsMax - pgsMin)));

    // Baseline-relative: start from baseline, scale up/down
    const baselineProportion = (config.baseline - config.min) / (config.max - config.min);
    const traitRange = config.max - config.min;

    // Final normalized score (0–100 display scale)
    const normalizedScore = Math.round(
      Math.max(0, Math.min(100,
        baselineProportion * 100 + (proportion - 0.5) * 100
      ))
    );

    // Actual trait-unit value
    const traitValue = config.min + (normalizedScore / 100) * (config.max - config.min);

    results[trait] = {
      rawScore: parseFloat(acc.rawScore.toFixed(3)),
      normalizedScore,
      traitValue: parseFloat(traitValue.toFixed(1)),
      contributors: acc.contributors,
      label: config.label,
      unit: config.unit,
      icon: config.icon
    };
  });

  return results;
}

/**
 * Describe the direction of a trait score relative to baseline.
 * @param {number} score - 0–100 normalized score
 * @returns {string} 'high' | 'medium' | 'low'
 */
function classifyScore(score) {
  if (score >= 67) return 'high';
  if (score >= 33) return 'medium';
  return 'low';
}
