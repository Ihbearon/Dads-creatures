# 🧬 Dad's Creatures — DNA Sandbox

A browser-based DNA manipulation sandbox where editing base pairs triggers a scientifically grounded **genotype-to-phenotype pipeline**, producing real trait predictions for theoretical organisms.

**Zero dependencies. Open `index.html` and go.**

---

## What It Does

Edit a DNA sequence and watch:
- 🌿 A **Grass Plant** change color, height, and pigmentation based on real chlorophyll / anthocyanin pathway genetics
- 🐑 A **Soay Sheep** shift coat color and horn length based on published MC1R / RXFP2 GWAS data

All trait scores come from **real peer-reviewed genetics research**.

---

## How to Run

```bash
# Option A — just open the file
open index.html

# Option B — serve locally (avoids fetch restrictions)
python3 -m http.server 8765
# then visit http://localhost:8765
```

---

## Project Structure

```
├── index.html              # App shell
├── css/
│   └── main.css            # Design system (dark navy, glassmorphism)
├── js/
│   ├── app.js              # UI controller & event wiring
│   ├── codon-table.js      # NCBI Standard Genetic Code (Table 1)
│   ├── gene-parser.js      # ATG → stop codon gene finder
│   ├── snp-scanner.js      # Scan sequence for known SNP sites
│   ├── polygenic-score.js  # Σ(β × dosage) polygenic scoring
│   └── renderer.js         # Live SVG creature from trait scores
├── data/
│   ├── snp-registry.json   # Curated real SNPs with effect sizes & citations
│   └── organisms.json      # Organism definitions & reference sequences
```

---

## The Science

Trait scores use **polygenic scoring** — the same method used in clinical genetics and crop breeding:

```
PGS_trait = Σ_i ( β_i × dosage_i )
```

Where `β_i` is the published effect size for each SNP from GWAS literature, and `dosage_i` is the number of alt alleles at that position (0, 1, or 2).

### Data Sources
- [NCBI dbSNP](https://www.ncbi.nlm.nih.gov/snp/)
- [NHGRI-EBI GWAS Catalog](https://www.ebi.ac.uk/gwas/)
- Johnston et al. 2011 — *RXFP2* horn length in Soay sheep
- Gratten et al. 2007 — *MC1R* coat color in Soay sheep

---

## Organisms

| Organism | Traits Modeled | Key Genes |
|----------|---------------|-----------|
| 🌿 Grass Plant (*Poaceae*) | Color, height, leaf width | *CHLH*, *CHS*, *DFR*, *ANS*, *DELLA*, *BR* |
| 🐑 Soay Sheep | Coat color, horns, body size | *MC1R*, *ASIP*, *RXFP2*, *TYRP1*, *KIT* |

---

## V2 Roadmap

- Import real `.vcf` (variant call format) files
- Crossbreeding tool: mix two sequences, compute offspring traits
- More organisms (maize, salmon, cattle)
- Share creature via URL-encoded sequence
