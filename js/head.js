/* ==========================
   HEAD SETTINGS
========================== */

window.headSettings = {

    centerX: 250,

    topY: 45,
    headHeight: 475,

    /*
       Vertical positions as percentages
       of the total head height.
    */

    foreheadPosition: 0.13,
    templePosition: 0.31,
    cheekPosition: 0.58,
    jawPosition: 0.83,
    chinPosition: 0.97,

    foreheadWidth: 105,
    templeWidth: 138,
    cheekWidth: 142,
    jawWidth: 108,
    chinWidth: 72,

    foreheadRoundness: 35,
    templeRoundness: 28,
    cheekRoundness: 30,
    jawRoundness: 24,

    chinBottomWidth: 38,
    chinDepth: 16,
    chinRoundness: 26

};


/* ==========================
   DRAW HEAD
========================== */

window.drawHead = function () {

    const head = document.getElementById("head");

    if (!head) {
        console.error("Could not find #head");
        return;
    }

    const s = window.headSettings;


    /* ==========================
       VERTICAL POSITIONS
    ========================== */

    const foreheadY =
        s.topY +
        s.headHeight * s.foreheadPosition;

    const templeY =
        s.topY +
        s.headHeight * s.templePosition;

    const cheekY =
        s.topY +
        s.headHeight * s.cheekPosition;

    const jawY =
        s.topY +
        s.headHeight * s.jawPosition;

    const chinY =
        s.topY +
        s.headHeight * s.chinPosition;

    const chinBottomY =
        s.topY +
        s.headHeight +
        s.chinDepth;


    /* ==========================
       HORIZONTAL POSITIONS
    ========================== */

    const leftForehead =
        s.centerX - s.foreheadWidth;

    const rightForehead =
        s.centerX + s.foreheadWidth;

    const leftTemple =
        s.centerX - s.templeWidth;

    const rightTemple =
        s.centerX + s.templeWidth;

    const leftCheek =
        s.centerX - s.cheekWidth;

    const rightCheek =
        s.centerX + s.cheekWidth;

    const leftJaw =
        s.centerX - s.jawWidth;

    const rightJaw =
        s.centerX + s.jawWidth;

    const leftChin =
        s.centerX - s.chinWidth;

    const rightChin =
        s.centerX + s.chinWidth;

    const leftChinBottom =
        s.centerX - s.chinBottomWidth;

    const rightChinBottom =
        s.centerX + s.chinBottomWidth;


    /* ==========================
       HEAD PATH
    ========================== */

    const path = `

        M ${s.centerX} ${s.topY}

        /* LEFT FOREHEAD */

        C
          ${s.centerX - s.foreheadRoundness} ${s.topY},
          ${leftForehead} ${s.topY + s.foreheadRoundness},
          ${leftForehead} ${foreheadY}

        /* LEFT TEMPLE */

        C
          ${leftForehead} ${foreheadY + s.templeRoundness},
          ${leftTemple} ${templeY - s.templeRoundness},
          ${leftTemple} ${templeY}

        /* LEFT CHEEK */

        C
          ${leftTemple} ${templeY + s.cheekRoundness},
          ${leftCheek} ${cheekY - s.cheekRoundness},
          ${leftCheek} ${cheekY}

        /* LEFT JAW */

        C
          ${leftCheek} ${cheekY + s.jawRoundness},
          ${leftJaw} ${jawY - s.jawRoundness},
          ${leftJaw} ${jawY}

        /* LEFT SIDE OF CHIN */

        C
          ${leftJaw} ${jawY + s.chinRoundness},
          ${leftChin} ${chinY - s.chinRoundness},
          ${leftChinBottom} ${chinBottomY}

        /* CHIN BOTTOM */

        C
          ${s.centerX - 20} ${chinBottomY + 4},
          ${s.centerX + 20} ${chinBottomY + 4},
          ${rightChinBottom} ${chinBottomY}

        /* RIGHT SIDE OF CHIN */

        C
          ${rightChin} ${chinY - s.chinRoundness},
          ${rightJaw} ${jawY + s.chinRoundness},
          ${rightJaw} ${jawY}

        /* RIGHT JAW */

        C
          ${rightJaw} ${jawY - s.jawRoundness},
          ${rightCheek} ${cheekY + s.jawRoundness},
          ${rightCheek} ${cheekY}

        /* RIGHT CHEEK */

        C
          ${rightCheek} ${cheekY - s.cheekRoundness},
          ${rightTemple} ${templeY + s.cheekRoundness},
          ${rightTemple} ${templeY}

        /* RIGHT TEMPLE */

        C
          ${rightTemple} ${templeY - s.templeRoundness},
          ${rightForehead} ${foreheadY + s.templeRoundness},
          ${rightForehead} ${foreheadY}

        /* RIGHT FOREHEAD */

        C
          ${rightForehead} ${s.topY + s.foreheadRoundness},
          ${s.centerX + s.foreheadRoundness} ${s.topY},
          ${s.centerX} ${s.topY}

        Z
    `;

    head.setAttribute(
        "d",
        path.replace(/\/\*[\s\S]*?\*\//g, "")
    );

};
