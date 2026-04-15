/**
 * gcl-engine.js
 * Genomic Creature Language (GCL) parser and macro expander.
 *
 * GCL is an in-house DNA programming language for building prototype species.
 * Two modes:
 *   1. Raw mode: write ACGT codons directly → standard translation pipeline
 *   2. Macro mode: use #NAMED shortcuts that expand to codon sequences
 *
 * Usage:
 *   const result = GCL.compile(sourceText);
 *   // result = { dnaSequence, expandedSource, tokens, errors }
 *   // Pass result.dnaSequence into the normal pipeline.
 */

'use strict';

const GCL = (function() {

  // ──────────────────────────────────────────────────────────────────────────
  // Macro library (sourced from gcl-dictionary.json, hardcoded for speed)
  // ──────────────────────────────────────────────────────────────────────────
  const MACROS = {
    '#WING_PAIR':        'TTT GTT TTT',
    '#DEWLAP':           'TTT TAT TAT',
    '#COMPOUND_EYE':     'TGG TGG CAT',
    '#ANTENNA':          'GGT GGT CGT',
    '#BIG_HORN':         'CGT CGT CGT CGT',
    '#CURL_HORN':        'CGT GGT CGT GGT CGT',
    '#CARAPACE':         'CCG TGT CCG TGT CCG TGT',
    '#TAIL':             'GCT GCT GCT TAA',
    '#SPOTTED_COAT':     'TAT GGT TAT GGT TAT',
    '#STRIPED_COAT':     'ACT TAT ACT TAT ACT',
    '#MANE':             'TCT TCT TCT TTG TTG',
    '#CREST':            'GAT GAT CGT',
    '#BIOLUMINESCENT':   'TGG TAT TGG',
    '#PROBOSCIS':        'AAA GCT GCT GCT',
    '#DORSAL_FIN':       'GAT GAT TTT',
    '#PECTORAL_FIN':     'GTT TTT TTT',
    '#SWIM_BLADDER':     'CAA CAA AAT',
    '#EYESPOT':          'TAT TGG TAT',
    '#PLUMAGE':          'TCT ACT TAT',
    '#BEAK':             'AAA TGT',
    '#WEBBED_FOOT':      'GTT AAT TTT',
    '#SUCTION_CUPS':     'GTT AAT AAT AAT',
    '#VENOM_GLAND':      'TGT TGT CAA',
    '#ELECTRORECEPTION': 'TGG CAT TGG',
    '#LATERAL_LINE':     'TCT CAT TCT',
  };

  // Body plan template shorthands
  const TEMPLATES = {
    '@ARTHROPOD_INSECT':    'ATG CCG CCG CCG GTT GTT GTT #WING_PAIR #COMPOUND_EYE #ANTENNA TAA',
    '@ARTHROPOD_CRUSTACEAN':'ATG #CARAPACE GTT GTT GTT GTT GTT AAA AAA TCT TAA',
    '@VERTEBRATE_QUADRUPED':'ATG CCG CCG GTT GTT TTG #BIG_HORN TCT TAT TAA',
    '@VERTEBRATE_FISH':     'ATG CCG TTG TTG #PECTORAL_FIN #DORSAL_FIN TTT CAA TCT ACT TAT TAA',
    '@VERTEBRATE_BIRD':     'ATG CCG GTT TTT TTT GTT AAA TCT ACT TAT #CREST TAA',
    '@VERTEBRATE_REPTILE':  'ATG CCG CCG GTT GTT #DEWLAP TCT TCT TAA',
    '@PLANT_FORB':          'ATG GCT GCT GCT GTT GTT TAT TAT TCT TGG TAA',
    '@PLANT_GRASS':         'ATG GCT GCT GCT GCT TTG GAT GAT TTT TCT TAA',
  };

  // Valid DNA bases
  const DNA_BASES = new Set(['A', 'C', 'G', 'T']);

  /**
   * Tokenize a GCL source string into tokens.
   * Tokens can be:
   *   - MACRO: starts with #
   *   - TEMPLATE: starts with @
   *   - COMMENT: starts with // (line comment)
   *   - CODON: exactly 3 DNA bases
   *   - ERROR: anything else
   */
  function tokenize(source) {
    const tokens = [];
    // Normalize: remove comments, collapse whitespace
    const lines = source.split('\n');
    const cleaned = lines
      .map(l => l.replace(/\/\/.*$/, '').trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = cleaned.split(' ').filter(p => p.length);

    for (const part of parts) {
      if (part.startsWith('#')) {
        tokens.push({ type: 'MACRO', value: part.toUpperCase() });
      } else if (part.startsWith('@')) {
        tokens.push({ type: 'TEMPLATE', value: part.toUpperCase() });
      } else if (/^[ACGTacgt]{3}$/.test(part)) {
        tokens.push({ type: 'CODON', value: part.toUpperCase() });
      } else if (/^[ACGTacgt]+$/.test(part)) {
        // Long raw DNA — split into codons
        const seq = part.toUpperCase();
        for (let i = 0; i + 2 < seq.length; i += 3) {
          tokens.push({ type: 'CODON', value: seq.slice(i, i + 3) });
        }
      } else {
        tokens.push({ type: 'ERROR', value: part });
      }
    }
    return tokens;
  }

  /**
   * Expand tokens: replace macros and templates with their codon sequences.
   * Returns an array of codon strings.
   */
  function expand(tokens) {
    const expanded = [];
    const errors = [];

    for (const tok of tokens) {
      if (tok.type === 'CODON') {
        expanded.push(tok.value);
      } else if (tok.type === 'MACRO') {
        const expansion = MACROS[tok.value];
        if (expansion) {
          const subTokens = tokenize(expansion);
          const subExpanded = expand(subTokens);
          expanded.push(...subExpanded.codons);
        } else {
          errors.push(`Unknown macro: ${tok.value}`);
        }
      } else if (tok.type === 'TEMPLATE') {
        const template = TEMPLATES[tok.value];
        if (template) {
          const subTokens = tokenize(template);
          const subExpanded = expand(subTokens);
          expanded.push(...subExpanded.codons);
        } else {
          errors.push(`Unknown template: ${tok.value}`);
        }
      } else if (tok.type === 'ERROR') {
        errors.push(`Unrecognized token: "${tok.value}"`);
      }
    }

    return { codons: expanded, errors };
  }

  /**
   * Compile a GCL source string.
   * @param {string} source - GCL source text
   * @returns {{ dnaSequence: string, expandedSource: string, tokens: Array, codons: Array, errors: Array }}
   */
  function compile(source) {
    const tokens = tokenize(source);
    const { codons, errors } = expand(tokens);
    const dnaSequence = codons.join('');
    const expandedSource = codons.join(' ');

    return {
      dnaSequence,
      expandedSource,
      tokens,
      codons,
      errors,
      isValid: errors.length === 0,
    };
  }

  /**
   * Return a formatted human-readable expansion showing macro→codon substitutions.
   * Used for the language reference page "explain" feature.
   */
  function explain(source) {
    const tokens = tokenize(source);
    return tokens.map(tok => {
      if (tok.type === 'CODON') {
        return { token: tok.value, expansion: null, type: 'codon' };
      } else if (tok.type === 'MACRO') {
        const exp = MACROS[tok.value];
        return { token: tok.value, expansion: exp || '???', type: 'macro' };
      } else if (tok.type === 'TEMPLATE') {
        const exp = TEMPLATES[tok.value];
        return { token: tok.value, expansion: exp || '???', type: 'template' };
      } else {
        return { token: tok.value, expansion: null, type: 'error' };
      }
    });
  }

  /**
   * List all available macros with their descriptions.
   * Loaded at runtime from gcl-dictionary.json for the language reference page.
   */
  function getMacroList() {
    return Object.entries(MACROS).map(([name, expansion]) => ({ name, expansion }));
  }

  /**
   * List all body plan templates.
   */
  function getTemplateList() {
    return Object.entries(TEMPLATES).map(([name, source]) => ({ name, source }));
  }

  return { compile, explain, tokenize, expand, getMacroList, getTemplateList, MACROS, TEMPLATES };
})();
