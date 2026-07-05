/* Sori — hangul.js : socle de la PISTE 한글 (apprendre à LIRE).
   - Partie PURE (zéro DOM, zéro localStorage, testable sous Node — même pattern
     que engine.js / numbers.js / search.js) :
       • décomposition Unicode EXACTE d'une syllabe/chaîne en jamo (택 → ㅌ ㅐ ㄱ),
       • lettersForWords(mots) → jamo atomiques uniques dans l'ordre d'apparition
         = ce qui rend l'introduction des lettres STORY-DRIVEN (les jamo de 택시/출구 d'abord),
       • JAMO : métadonnées des 40 lettres enseignables (son FR, type, exemple),
       • LEARNING_ORDER : ordre pédagogique par défaut (si pas de mots pour piloter).
   - Le RENDU (exercices) viendra dans une couche séparée qui consomme ce module.
   Réf. : HANGUL-TRACK.md. */
(function (root) {
  "use strict";

  /* Tables Unicode du hangeul (ordre standard). Un bloc syllabe S (0xAC00–0xD7A3) se décompose :
     S = ((cho * 21) + jung) * 28 + jong  ; jong index 0 = pas de finale. */
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];      // 19 initiales
  const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]; // 21 médianes
  const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]; // 28 finales (0 = aucune)

  const BASE = 0xAC00, LAST = 0xD7A3;

  /* finales composées (batchim double) → deux jamo atomiques enseignables */
  const COMPOUND = {
    "ㄳ":["ㄱ","ㅅ"],"ㄵ":["ㄴ","ㅈ"],"ㄶ":["ㄴ","ㅎ"],"ㄺ":["ㄹ","ㄱ"],"ㄻ":["ㄹ","ㅁ"],
    "ㄼ":["ㄹ","ㅂ"],"ㄽ":["ㄹ","ㅅ"],"ㄾ":["ㄹ","ㅌ"],"ㄿ":["ㄹ","ㅍ"],"ㅀ":["ㄹ","ㅎ"],"ㅄ":["ㅂ","ㅅ"]
  };

  function isSyllable(ch) {
    const c = ch.codePointAt(0);
    return c >= BASE && c <= LAST;
  }

  /* décompose UNE syllabe en [initiale, médiane, (finale)] — finale composée gardée telle quelle
     (ex. 값 → ["ㄱ","ㅏ","ㅄ"]). Caractère non-syllabe → renvoyé tel quel dans un tableau. */
  function decomposeSyllable(ch) {
    if (!isSyllable(ch)) return [ch];
    const s = ch.codePointAt(0) - BASE;
    const jong = s % 28;
    const jung = Math.floor(s / 28) % 21;
    const cho = Math.floor(s / (28 * 21));
    const out = [CHO[cho], JUNG[jung]];
    if (jong) out.push(JONG[jong]);
    return out;
  }

  /* décompose une CHAÎNE en jamo ATOMIQUES (finales composées éclatées), seules les syllabes
     hangeul comptent (espaces/ponctuation ignorés). Ex. 택시 → ㅌ ㅐ ㄱ ㅅ ㅣ ; 값 → ㄱ ㅏ ㅂ ㅅ. */
  function decompose(str) {
    const out = [];
    for (const ch of String(str)) {
      if (!isSyllable(ch)) continue;
      for (const j of decomposeSyllable(ch)) {
        if (COMPOUND[j]) out.push(COMPOUND[j][0], COMPOUND[j][1]);
        else out.push(j);
      }
    }
    return out;
  }

  /* jamo atomiques UNIQUES nécessaires pour lire une liste de mots, dans l'ordre de PREMIÈRE
     apparition → pilote l'introduction story-driven (les lettres du chapitre à venir d'abord). */
  function lettersForWords(words) {
    const seen = new Set(), out = [];
    for (const w of (words || [])) {
      for (const j of decompose(w)) {
        if (!seen.has(j)) { seen.add(j); out.push(j); }
      }
    }
    return out;
  }

  /* syllabes (blocs) uniques d'un mot/liste — pour enseigner la lecture au niveau du bloc.
     On n'enseigne que les blocs des mots du curriculum (pas les ~11 000 possibles). */
  function syllablesForWords(words) {
    const seen = new Set(), out = [];
    for (const w of (words || [])) {
      for (const ch of String(w)) {
        if (isSyllable(ch) && !seen.has(ch)) { seen.add(ch); out.push(ch); }
      }
    }
    return out;
  }

  /* ================= métadonnées des 40 lettres enseignables ================= */
  const C = "consonne", V = "voyelle", T = "tendue", X = "complexe";
  // son = repère FR approximatif (pédago), pas une romanisation officielle
  const JAMO = {
    // consonnes de base (14)
    "ㄱ":{son:"g/k",type:C,ex:"가"}, "ㄴ":{son:"n",type:C,ex:"나"}, "ㄷ":{son:"d/t",type:C,ex:"다"},
    "ㄹ":{son:"r/l",type:C,ex:"라"}, "ㅁ":{son:"m",type:C,ex:"마"}, "ㅂ":{son:"b/p",type:C,ex:"바"},
    "ㅅ":{son:"s",type:C,ex:"사"}, "ㅇ":{son:"muet / ng",type:C,ex:"아"}, "ㅈ":{son:"dj",type:C,ex:"자"},
    "ㅊ":{son:"tch",type:C,ex:"차"}, "ㅋ":{son:"k aspiré",type:C,ex:"카"}, "ㅌ":{son:"t aspiré",type:C,ex:"타"},
    "ㅍ":{son:"p aspiré",type:C,ex:"파"}, "ㅎ":{son:"h",type:C,ex:"하"},
    // voyelles de base (10)
    "ㅏ":{son:"a",type:V,ex:"아"}, "ㅑ":{son:"ya",type:V,ex:"야"}, "ㅓ":{son:"o ouvert",type:V,ex:"어"},
    "ㅕ":{son:"yo ouvert",type:V,ex:"여"}, "ㅗ":{son:"o",type:V,ex:"오"}, "ㅛ":{son:"yo",type:V,ex:"요"},
    "ㅜ":{son:"ou",type:V,ex:"우"}, "ㅠ":{son:"you",type:V,ex:"유"}, "ㅡ":{son:"eu",type:V,ex:"으"},
    "ㅣ":{son:"i",type:V,ex:"이"},
    // consonnes tendues (5)
    "ㄲ":{son:"kk",type:T,ex:"까"}, "ㄸ":{son:"tt",type:T,ex:"따"}, "ㅃ":{son:"pp",type:T,ex:"빠"},
    "ㅆ":{son:"ss",type:T,ex:"싸"}, "ㅉ":{son:"ddj",type:T,ex:"짜"},
    // voyelles complexes (11)
    "ㅐ":{son:"è",type:X,ex:"애"}, "ㅒ":{son:"yè",type:X,ex:"얘"}, "ㅔ":{son:"é",type:X,ex:"에"},
    "ㅖ":{son:"yé",type:X,ex:"예"}, "ㅘ":{son:"wa",type:X,ex:"와"}, "ㅙ":{son:"wè",type:X,ex:"왜"},
    "ㅚ":{son:"wé",type:X,ex:"외"}, "ㅝ":{son:"wo",type:X,ex:"워"}, "ㅞ":{son:"wè",type:X,ex:"웨"},
    "ㅟ":{son:"wi",type:X,ex:"위"}, "ㅢ":{son:"eui",type:X,ex:"의"}
  };

  /* ordre pédagogique PAR DÉFAUT (utilisé quand aucun mot ne pilote l'ordre).
     Lot 1 = voyelles simples + consonnes fréquentes qui forment vite des syllabes lisibles.
     L'ordre story-driven (lettersForWords) prime quand on prépare un chapitre. */
  const LEARNING_ORDER = [
    // lot 1 : ça se lit tout de suite
    "ㅇ","ㅏ","ㅣ","ㅗ","ㅜ","ㄴ","ㄱ","ㅅ","ㅁ",
    // lot 2
    "ㅓ","ㅡ","ㄷ","ㄹ","ㅂ","ㅈ","ㅎ",
    // lot 3 : aspirées
    "ㅊ","ㅋ","ㅌ","ㅍ",
    // lot 4 : voyelles iotisées
    "ㅑ","ㅕ","ㅛ","ㅠ",
    // lot 5 : voyelles complexes fréquentes
    "ㅐ","ㅔ","ㅚ","ㅢ","ㅘ","ㅝ","ㅟ",
    // lot 6 : tendues + le reste
    "ㄲ","ㄸ","ㅃ","ㅆ","ㅉ","ㅒ","ㅖ","ㅙ","ㅞ"
  ];

  /* rang d'introduction d'un item de lecture (plus petit = plus tôt). Sert à étendre le
     newRank de l'app : jamo AVANT syllabe AVANT mot. type ∈ 'jamo' | 'syllabe'. */
  function readingRank(type, glyph) {
    if (type === "jamo") {
      const i = LEARNING_ORDER.indexOf(glyph);
      return (i < 0 ? LEARNING_ORDER.length : i);      // 0.., par ordre pédagogique
    }
    return 1000;                                        // syllabes après tous les jamo
  }

  const API = {
    CHO, JUNG, JONG, JAMO, LEARNING_ORDER,
    isSyllable, decomposeSyllable, decompose,
    lettersForWords, syllablesForWords, readingRank
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SORI_HANGUL = API;
})(typeof self !== "undefined" ? self : this);
