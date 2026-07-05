/* Sori — hangul-exercises.js : génération PURE d'exercices de lecture (piste 한글).
   Consomme docs/hangul.js. Zéro DOM, zéro localStorage, RNG injectable → testable sous Node
   (même pattern que numbers.js). Le RENDU vit dans la couche démo/app qui appelle ces générateurs.
   Exercices :
     • soundQuiz(glyph)  : voir le jamo → choisir son SON       (QCM, distracteurs de même type)
     • glyphQuiz(glyph)  : entendre/voir le SON → choisir le jamo (QCM inversé)
     • assemble(syllabe) : tuiles ordonnées pour reconstruire un bloc (le décodage)
   Réf. : HANGUL-TRACK.md. */
(function (root) {
  "use strict";
  const H = (typeof module !== "undefined" && module.exports)
    ? require("./hangul.js")
    : root.SORI_HANGUL;

  function sample(arr, n, rnd) {
    const a = arr.slice(), out = [];
    while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]);
    return out;
  }
  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* sons distracteurs UNIQUES, ≠ du bon son, priorité au même type (consonne vs voyelle…) */
  function distractSons(glyph, k, rnd) {
    const meta = H.JAMO[glyph], ans = meta.son;
    const sonsOf = (pred) => {
      const s = new Set();
      for (const g of Object.keys(H.JAMO)) {
        if (g === glyph) continue;
        const m = H.JAMO[g];
        if (pred(m) && m.son !== ans) s.add(m.son);
      }
      return [...s];
    };
    let pool = sonsOf((m) => m.type === meta.type);
    if (pool.length < k) pool = pool.concat(sonsOf((m) => m.type !== meta.type));
    return sample([...new Set(pool)], k, rnd);
  }

  function soundQuiz(glyph, opts) {
    const rnd = (opts && opts.random) || Math.random;
    const ans = H.JAMO[glyph].son;
    return { glyph, answer: ans, options: shuffle([ans, ...distractSons(glyph, 3, rnd)], rnd) };
  }

  function glyphQuiz(glyph, opts) {
    const rnd = (opts && opts.random) || Math.random;
    const meta = H.JAMO[glyph];
    const sameType = Object.keys(H.JAMO).filter((g) => g !== glyph && H.JAMO[g].type === meta.type);
    let pool = sameType;
    if (pool.length < 3) pool = pool.concat(Object.keys(H.JAMO).filter((g) => g !== glyph && !sameType.includes(g)));
    return { glyph, son: meta.son, answer: glyph, options: shuffle([glyph, ...sample(pool, 3, rnd)], rnd) };
  }

  function assemble(syllable) {
    const jamo = H.decomposeSyllable(syllable);
    return {
      syllable,
      tiles: jamo.map((g) => ({ g: g, son: (H.JAMO[g] || {}).son || "" }))
    };
  }

  const API = { soundQuiz, glyphQuiz, assemble };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SORI_HANGUL_EX = API;
})(typeof self !== "undefined" ? self : this);
