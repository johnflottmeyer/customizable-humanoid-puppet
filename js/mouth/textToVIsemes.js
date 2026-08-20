/*
==================================================
FACELAB — TEXT TO VISEMES
VERSION 2.5
==================================================

Purpose:
- Converts plain English text into the queue format used by
  MouthVisemeAnimator V1.2+.
- Uses the expanded FaceLab viseme set.
- Runs locally in the browser.
- Does not change mouth geometry.

Current viseme vocabulary:
  neutral
  MBP
  FV
  EE
  AH
  OH
  UHEH
  L
  TH
  SH
  WR
  TDN
  KG

Usage:
  TextToVisemes.speak("Maybe we should go.");

  const queue =
    TextToVisemes.convert("Maybe we should go.");

  MouthVisemeAnimator.playQueue(queue);
*/

(function () {

  "use strict";

  const VOWELS =
    new Set([
      "A", "E", "I", "O", "U", "Y"
    ]);

  const DEFAULTS = {
    consonantDuration: 62,
    vowelDuration: 102,
    transitionDuration: 60,

    shortHold: 14,
    consonantHold: 9,
    vowelHold: 38,

    wordGap: 16,
    consonantWordGap: 4,

    /*
        Tiny relaxation inserted between spoken words.
        This is deliberately much shorter than a normal
        neutral pose; it only breaks continuous blending.
    */
    wordResetDuration: 38,
    wordResetHold: 4,

    commaGap: 90,
    sentenceGap: 150
  };


  function isVowel(char) {

    return VOWELS.has(
      String(char || "")
        .toUpperCase()
    );
  }


  function cleanText(text) {

    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function pushPose(
    queue,
    viseme,
    duration,
    hold
  ) {

    const last =
      queue[
        queue.length - 1
      ];

    /*
        Merge repeated neighboring poses.

        This remains important with the larger
        viseme vocabulary because repeated letters
        should lengthen a pose rather than cause
        unnecessary mouth chatter.
    */

    if (
      last &&
      last.viseme === viseme
    ) {

      last.hold +=
        Math.max(
          8,

          Math.round(
            (hold || 0) +
            (duration || 0) *
            0.30
          )
        );

      return;
    }

    queue.push({
      viseme,

      duration:
        Math.max(
          42,
          Math.round(
            duration || 0
          )
        ),

      hold:
        Math.max(
          0,
          Math.round(
            hold || 0
          )
        )
    });
  }


  /*
  ==================================================
  VOWEL MAPPING
  ==================================================

  This is still spelling-informed rather than a
  full pronunciation dictionary, but the expanded
  viseme set gives us much better targets.

  EE:
    high/front/spread

  UHEH:
    relaxed middle vowel

  AH:
    open central vowel

  OH:
    rounded/back vowel
  */

  function mapVowelGroup(
    group,
    rest
  ) {

    const value =
      String(group || "")
        .toUpperCase();

    const remaining =
      String(rest || "")
        .toUpperCase();

    /*
        Strong EE families.
    */

    if (
      /^(EE|EA|IE|EI)$/.test(
        value
      )
    ) {
      return "EE";
    }

    /*
        Rounded/back vowel families.
    */

    if (
      /^(OO|OU|OW|OA|OE)$/.test(
        value
      )
    ) {
      return "OH";
    }

    /*
        Single-letter approximations.

        These are intentionally softer than V1.2.
        E/U are often better represented by UHEH
        unless a stronger digraph tells us otherwise.
    */

    if (
      value === "I" ||
      value === "Y"
    ) {
      return "EE";
    }

    if (
      value === "E"
    ) {
      return "UHEH";
    }

    if (
      value === "U"
    ) {
      return "UHEH";
    }

    if (
      value === "O"
    ) {
      return "OH";
    }

    /*
        A is generally our open fallback.

        Short-A / EH-style spellings remain an
        approximation until we add a pronunciation
        dictionary.
    */

    if (
      value === "A"
    ) {
      /*
          A before consonant-heavy endings often
          reads better as the middle vowel than
          as a full AH opening.
      */

      if (
        /^[^AEIOUY]{1,2}(?:E|$)/.test(
          remaining
        )
      ) {
        return "UHEH";
      }

      return "AH";
    }

    return "UHEH";
  }


  /*
  ==================================================
  PRONUNCIATION-AWARE WORD OVERRIDES
  ==================================================

  These are intentionally small and high-value.

  The fallback parser remains available for unknown
  words, but common irregular words should not be
  animated according to their spelling.

  Each entry is a compact sequence of meaningful
  visible articulations rather than one pose per
  written letter.
  */

  const WORD_PRONUNCIATIONS =
    Object.freeze({

      MAYBE:
        ["MBP", "EE", "MBP", "EE"],

      WE:
        [
          {
            viseme: "WR",
            duration: 64,
            hold: 14
          },
          {
            viseme: "EE",
            duration: 112,
            hold: 52
          }
        ],

      SHOULD:
        [
          {
            viseme: "SH",
            duration: 84,
            hold: 22
          },
          {
            viseme: "UHEH",
            duration: 122,
            hold: 54
          }
        ],

      COULD:
        ["KG", "UHEH", "TDN"],

      WOULD:
        ["WR", "UHEH", "TDN"],

      GO:
        [
          {
            viseme: "OH",
            duration: 112,
            hold: 64
          }
        ],

      THE:
        ["TH", "UHEH"],

      THIS:
        ["TH", "UHEH", "TDN"],

      THAT:
        ["TH", "AH", "TDN"],

      THESE:
        ["TH", "EE", "TDN"],

      THOSE:
        ["TH", "OH", "TDN"],

      LITTLE:
        ["L", "UHEH", "TDN", "L"],

      RED:
        ["WR", "UHEH", "TDN"],

      CHICKEN:
        ["SH", "UHEH", "KG", "UHEH", "TDN"],

      LOOKED:
        ["L", "UHEH", "KG", "TDN"],

      AROUND:
        ["UHEH", "WR", "AH", "TDN"]

    });


  function pushPronunciation(
    queue,
    sequence,
    options
  ) {

    if (
      !Array.isArray(sequence) ||
      sequence.length === 0
    ) {
      return false;
    }

    sequence.forEach(
      function (
        entry,
        index
      ) {

        const viseme =
          typeof entry === "string"
            ? entry
            : entry.viseme;

        const isVowelPose =
          viseme === "EE" ||
          viseme === "AH" ||
          viseme === "OH" ||
          viseme === "UHEH";

        const defaultDuration =
          isVowelPose
            ? options.vowelDuration
            : options.consonantDuration;

        const defaultHold =
          isVowelPose
            ? options.vowelHold
            : (
                index ===
                sequence.length - 1
                  ? options.shortHold
                  : options.consonantHold
              );

        pushPose(
          queue,
          viseme,

          typeof entry === "object" &&
          Number.isFinite(entry.duration)
            ? entry.duration
            : defaultDuration,

          typeof entry === "object" &&
          Number.isFinite(entry.hold)
            ? entry.hold
            : defaultHold
        );
      }
    );

    return true;
  }


  function wordToVisemes(
    word,
    queue,
    options
  ) {

    const upper =
      String(word || "")
        .toUpperCase()
        .replace(
          /[^A-Z']/g,
          ""
        );

    /*
        Prefer an explicit pronunciation sequence
        when we know the word.

        This avoids silent-letter errors such as
        SHOULD incorrectly producing an L pose.
    */

    const knownPronunciation =
      WORD_PRONUNCIATIONS[
        upper
      ];

    if (
      knownPronunciation
    ) {

      pushPronunciation(
        queue,
        knownPronunciation,
        options
      );

      return;
    }

    let i = 0;

    while (
      i < upper.length
    ) {

      const rest =
        upper.slice(i);

      /*
      ==================================================
      STRONG MULTI-LETTER CONSONANTS
      ==================================================
      */

      if (
        rest.startsWith("PH")
      ) {

        pushPose(
          queue,
          "FV",
          options.consonantDuration,
          options.shortHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("SH")
      ) {

        pushPose(
          queue,
          "SH",
          options.consonantDuration,
          options.consonantHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("CH")
      ) {

        pushPose(
          queue,
          "SH",
          options.consonantDuration,
          options.consonantHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("TH")
      ) {

        pushPose(
          queue,
          "TH",
          options.consonantDuration,
          options.consonantHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("NG")
      ) {

        /*
            NG is primarily a back/tongue-root
            articulation visually, so KG is the
            closest existing FaceLab pose.
        */

        pushPose(
          queue,
          "KG",
          options.consonantDuration,
          options.shortHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("CK")
      ) {

        pushPose(
          queue,
          "KG",
          options.consonantDuration,
          options.shortHold
        );

        i += 2;
        continue;
      }


      if (
        rest.startsWith("QU")
      ) {

        /*
            English QU is usually /kw/.
            Give it the back consonant beat,
            then the rounded W/R pose.
        */

        pushPose(
          queue,
          "KG",
          options.consonantDuration,
          options.shortHold
        );

        pushPose(
          queue,
          "WR",
          options.transitionDuration,
          options.shortHold
        );

        i += 2;
        continue;
      }


      if (
        /^(MB|MP)/.test(rest)
      ) {

        pushPose(
          queue,
          "MBP",
          options.consonantDuration,
          options.shortHold + 8
        );

        i += 2;
        continue;
      }


      /*
      ==================================================
      VOWEL DIGRAPHS
      ==================================================
      */

      const char =
        upper[i];

      if (
        isVowel(char)
      ) {

        let group =
          char;

        const pair =
          upper.slice(
            i,
            i + 2
          );

        if (
          /^(EE|EA|IE|EI|OO|OU|OW|OA|OE)$/.test(
            pair
          )
        ) {

          group =
            pair;

          i += 2;

        } else {

          i++;
        }

        pushPose(
          queue,

          mapVowelGroup(
            group,
            upper.slice(i)
          ),

          options.vowelDuration,
          options.vowelHold
        );

        continue;
      }


      /*
      ==================================================
      SINGLE-LETTER CONSONANTS
      ==================================================
      */

      /*
          Bilabials
      */

      if (
        char === "M" ||
        char === "B" ||
        char === "P"
      ) {

        pushPose(
          queue,
          "MBP",
          options.consonantDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          Labiodentals
      */

      if (
        char === "F" ||
        char === "V"
      ) {

        pushPose(
          queue,
          "FV",
          options.consonantDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          L
      */

      if (
        char === "L"
      ) {

        pushPose(
          queue,
          "L",
          options.consonantDuration,
          options.consonantHold
        );

        i++;
        continue;
      }


      /*
          T / D / N
      */

      if (
        char === "T" ||
        char === "D" ||
        char === "N"
      ) {

        pushPose(
          queue,
          "TDN",
          options.consonantDuration,
          options.consonantHold
        );

        i++;
        continue;
      }


      /*
          K / hard C / G
      */

      if (
        char === "K" ||
        char === "G"
      ) {

        pushPose(
          queue,
          "KG",
          options.consonantDuration,
          options.consonantHold
        );

        i++;
        continue;
      }


      /*
          C is contextual:
          C before E/I/Y is usually soft /s/.
          Otherwise it is usually hard /k/.
      */

      if (
        char === "C"
      ) {

        const next =
          upper[i + 1] || "";

        pushPose(
          queue,

          /[EIY]/.test(next)
            ? "TDN"
            : "KG",

          options.consonantDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          J is grouped with SH / CH.
      */

      if (
        char === "J"
      ) {

        pushPose(
          queue,
          "SH",
          options.consonantDuration,
          options.consonantHold
        );

        i++;
        continue;
      }


      /*
          W / R
      */

      if (
        char === "W" ||
        char === "R"
      ) {

        pushPose(
          queue,
          "WR",
          options.transitionDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          S / Z

          We do not yet have a dedicated S/Z pose.
          TDN is visually closer than inserting a
          neutral beat because the lips stay relaxed
          and the tongue is near the front teeth.
      */

      if (
        char === "S" ||
        char === "Z"
      ) {

        pushPose(
          queue,
          "TDN",
          options.transitionDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          X usually contains a K/S sequence.
      */

      if (
        char === "X"
      ) {

        pushPose(
          queue,
          "KG",
          options.transitionDuration,
          options.shortHold
        );

        pushPose(
          queue,
          "TDN",
          options.transitionDuration,
          options.shortHold
        );

        i++;
        continue;
      }


      /*
          H has little independent visible
          articulation and is carried by the
          following vowel.
      */

      if (
        char === "H"
      ) {

        i++;
        continue;
      }


      /*
          Apostrophes and any other leftovers
          do not create a mouth event.
      */

      i++;
    }
  }


  function convert(
    text,
    settings
  ) {

    const source =
      cleanText(text);

    if (!source) {
      return [];
    }

    const options = {
      ...DEFAULTS,
      ...(settings || {})
    };

    const queue = [];

    /*
        Keep punctuation tokens because
        they provide useful pauses even
        without audio timestamps.
    */

    const tokens =
      source.match(
        /[A-Za-z']+|[,.!?;:]/g
      ) || [];

    for (
      let index = 0;
      index < tokens.length;
      index++
    ) {

      const token =
        tokens[index];

      if (
        /^[A-Za-z']+$/.test(
          token
        )
      ) {

        wordToVisemes(
          token,
          queue,
          options
        );

        const last =
          queue[
            queue.length - 1
          ];

        if (last) {

          const endsOnVowel =
            last.viseme === "EE" ||
            last.viseme === "AH" ||
            last.viseme === "OH" ||
            last.viseme === "UHEH";

          last.hold +=
            endsOnVowel
              ? options.wordGap
              : options.consonantWordGap;
        }

        /*
            If the next token is another word, insert a tiny
            neutral relaxation. This prevents the animator from
            visually blending two separate words into a new
            apparent syllable.

            It is intentionally brief enough that the mouth does
            not fully "stop talking" between every word.
        */

        const nextToken =
          tokens[
            index + 1
          ];

        if (
          nextToken &&
          /^[A-Za-z']+$/.test(
            nextToken
          )
        ) {

          pushPose(
            queue,
            "neutral",
            options.wordResetDuration,
            options.wordResetHold
          );
        }

        continue;
      }


      const last =
        queue[
          queue.length - 1
        ];

      if (!last) {
        continue;
      }


      if (
        token === "," ||
        token === ";" ||
        token === ":"
      ) {

        last.hold +=
          options.commaGap;

      } else {

        last.hold +=
          options.sentenceGap;
      }
    }

    return queue;
  }


  function speak(
    text,
    options
  ) {

    const animator =
      window.MouthVisemeAnimator;

    if (
      !animator ||
      typeof animator.playQueue !==
        "function"
    ) {

      console.error(
        "TextToVisemes requires MouthVisemeAnimator V1.2+"
      );

      return Promise.resolve(
        false
      );
    }

    const queue =
      convert(
        text,
        options
      );

    if (
      queue.length === 0
    ) {

      return Promise.resolve(
        false
      );
    }

    return animator.playQueue(
      queue,
      {
        startNeutral: true,
        endNeutral: true,
        neutralDuration: 105
      }
    );
  }


  window.TextToVisemes = {

    version: "2.5",

    convert,

    speak,

    defaults:
      {
        ...DEFAULTS
      }

  };


  console.log(
    "textToVisemes.js V2.5 loaded"
  );

})();
