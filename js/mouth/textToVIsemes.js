/*
==================================================
FACELAB — TEXT TO VISEMES
VERSION 1.2
==================================================

Purpose:
- Converts plain English text into the queue format used by
  MouthVisemeAnimator V1.2.
- Runs locally in the browser.
- Does not change mouth geometry.
- This first pass uses pronunciation-style letter groups and
  context rules rather than raw one-letter = one-mouth mappings.

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
    consonantDuration: 72,
    vowelDuration: 105,
    transitionDuration: 62,
    consonantNeutralDuration: 42,
    consonantNeutralHold: 8,
    shortHold: 16,
    vowelHold: 38,
    wordGap: 18,
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
        This keeps words like "see" from
        jittering EE -> EE -> EE.
    */

    if (
      last &&
      last.viseme === viseme
    ) {
      last.hold +=
        Math.max(
          10,
          Math.round(
            (hold || 0) +
            (duration || 0) * 0.35
          )
        );

      return;
    }

    queue.push({
      viseme: viseme,
      duration:
        Math.max(
          45,
          Math.round(duration)
        ),
      hold:
        Math.max(
          0,
          Math.round(hold || 0)
        )
    });
  }

  function mapVowelGroup(
    group
  ) {

    const value =
      group.toUpperCase();

    /*
        Our current FaceLab vocabulary:
        EE = spread/front vowel
        AH = open/central vowel
        OH = rounded/back vowel
    */

    if (
      /^(EE|EA|IE|EI|Y)$/.test(
        value
      )
    ) {
      return "EE";
    }

    if (
      /^(OO|OU|OW|OA|OE|O|U)$/.test(
        value
      )
    ) {
      return "OH";
    }

    if (
      /^(I|E)$/.test(
        value
      )
    ) {
      return "EE";
    }

    return "AH";
  }

  function wordToVisemes(
    word,
    queue,
    options
  ) {

    const upper =
      word
        .toUpperCase()
        .replace(
          /[^A-Z']/g,
          ""
        );

    let i = 0;

    while (
      i < upper.length
    ) {

      const rest =
        upper.slice(i);

      /*
          Strong multi-letter consonant
          groups first.
      */

      if (
        /^(PH)/.test(rest)
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
        /^(MB|MP)/.test(rest)
      ) {
        pushPose(
          queue,
          "MBP",
          options.consonantDuration,
          options.shortHold + 10
        );

        i += 2;
        continue;
      }

      /*
          Common consonant clusters without
          dedicated FaceLab geometry.
      */

      if (
        /^(SH|CH|TH|NG)/.test(rest)
      ) {
        pushPose(
          queue,
          "neutral",
          options.consonantNeutralDuration,
          options.consonantNeutralHold
        );

        i += 2;
        continue;
      }

      const char =
        upper[i];

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
          Rounded consonants.
          W is useful because it visibly
          anticipates rounded vowels.
      */

      if (
        char === "W"
      ) {
        pushPose(
          queue,
          "OH",
          options.transitionDuration,
          options.shortHold
        );

        i++;
        continue;
      }

      /*
          Vowel groups.
          Prefer digraphs before singles.
      */

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
          group = pair;
          i += 2;
        } else {
          i++;
        }

        pushPose(
          queue,
          mapVowelGroup(group),
          options.vowelDuration,
          options.vowelHold
        );

        continue;
      }

      /*
          Tongue / jaw consonants do not yet
          have dedicated FaceLab visemes.
          A short neutral beat prevents large
          vowel poses from flowing together.
          H is left to the following vowel.
      */

      /*
          Selective neutral consonants only.

          Most T/D/K/G/S/Z/R/L/N-style consonants
          are now allowed to ride through the
          neighboring vowel so the mouth does not
          over-articulate every letter.

          J and hard C/Q/X are kept as brief neutral
          interruptions because they tend to produce
          stronger visible jaw/tongue events.
      */

      if (
        /[JQX]/.test(char)
      ) {
        pushPose(
          queue,
          "neutral",
          options.consonantNeutralDuration,
          options.consonantNeutralHold
        );

        i++;
        continue;
      }

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
        they give us useful timing even
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
          last.hold +=
            options.wordGap;
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
        neutralDuration: 110
      }
    );
  }

  window.TextToVisemes = {

    version: "1.2",

    convert:
      convert,

    speak:
      speak,

    defaults:
      {
        ...DEFAULTS
      }

  };

  console.log(
    "textToVisemes.js V1.2 loaded"
  );

})();
