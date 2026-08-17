/* =========================================================
   FACELAB NOSE
   Version 1.4.10

   1.4.10
   - Drops the lower alar contour a little farther to finish meeting the crease.
   - Keeps the compact wing width and upper contour from 1.4.9.
   - Preserves the nostril holes, tip, and nostril-to-wing crease placement.
========================================================= */

/* ==========================
   DEFAULT NOSE VALUES
========================== */

const defaultNoseSettings = {

    /* Entire nose group */

    noseX: 0,
    noseY: -75,

    /* Main nose */

    noseWidth: 29,
    noseHeight: 33,

    /* Nostril wings */

    nostrilSpacing: 20,
    nostrilY: 395,
    nostrilWidth: 26,
    nostrilHeight: 18,

    /* Nostril holes */

    nostrilHoleSpacing: 16.5,
    nostrilHoleY: 398,
    nostrilHoleWidth: 6.8,
    nostrilHoleHeight: 2.45

};


/* ==========================
   NOSE CONTROL NAMES
========================== */

const noseControls = [

    "noseX",
    "noseY",

    "noseWidth",
    "noseHeight",

    "nostrilSpacing",
    "nostrilY",
    "nostrilWidth",
    "nostrilHeight",

    "nostrilHoleSpacing",
    "nostrilHoleY",
    "nostrilHoleWidth",
    "nostrilHoleHeight"

];


/* ==========================
   CURRENT NOSE SETTINGS
========================== */

window.noseSettings = {
    ...defaultNoseSettings
};


/* ==========================
   DISPLAY NOSE VALUE
========================== */

function displayNoseValue(settingName) {

    const valueDisplay =
        document.getElementById(
            `${settingName}Value`
        );

    if (!valueDisplay) {
        return;
    }

    valueDisplay.textContent =
        window.noseSettings[settingName];

}


/* ==========================
   APPLY NOSE SETTINGS
========================== */

function applyNoseSettings() {

    const settings =
        window.noseSettings;


    /* ==========================
       GET SVG ELEMENTS
    ========================== */

    const noseGroup =
        document.getElementById(
            "nose"
        );

    const noseShadow =
        document.getElementById(
            "noseShadow"
        );

    const noseBottomShadow =
        document.getElementById(
            "noseBottomShadow"
        );

    const noseFront =
        document.getElementById(
            "noseFront"
        );

    const leftNostril =
        document.getElementById(
            "leftNostril"
        );

    const rightNostril =
        document.getElementById(
            "rightNostril"
        );

    const leftHole =
        document.getElementById(
            "leftNostrilHole"
        );

    const rightHole =
        document.getElementById(
            "rightNostrilHole"
        );


    if (
        !noseGroup ||
        !noseShadow ||
        !noseBottomShadow ||
        !noseFront ||
        !leftNostril ||
        !rightNostril ||
        !leftHole ||
        !rightHole
    ) {

        console.warn(
            "One or more nose SVG elements could not be found."
        );

        return;

    }


    /* ==========================
       MOVE ENTIRE NOSE GROUP
    ========================== */

    noseGroup.setAttribute(
        "transform",
        `translate(
            ${settings.noseX}
            ${settings.noseY}
        )`
    );


    /* ==========================
       SHARED VALUES
    ========================== */

    const noseCenterX =
        250;

    const bridgeCenterY =
        369;

    const noseWidth =
        Math.max(
            settings.noseWidth,
            4
        );

    const noseHeight =
        Math.max(
            settings.noseHeight,
            6
        );

    const nostrilCenterY =
        settings.nostrilY;

    const nostrilWidth =
        Math.max(
            settings.nostrilWidth,
            3
        );

    const nostrilHeight =
        Math.max(
            settings.nostrilHeight,
            2
        );

    const nostrilHoleSpacing =
        Math.max(
            settings.nostrilHoleSpacing,
            2
        );

    const nostrilHoleWidth =
        Math.max(
            settings.nostrilHoleWidth,
            1
        );

    const nostrilHoleHeight =
        Math.max(
            settings.nostrilHoleHeight,
            1
        );

    const leftHoleX =
        noseCenterX -
        nostrilHoleSpacing;

    const rightHoleX =
        noseCenterX +
        nostrilHoleSpacing;


    /* ==========================
       BRIDGE / SIDE PLANES

       The sketch reads as two descending side curves,
       not a central vertical blob.

       We keep noseShadow as a soft ellipse, but flatten it
       and reduce opacity so it behaves as a blended light/shadow
       field rather than a visible construction piece.
    ========================== */

    noseShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseShadow.setAttribute(
        "cy",
        bridgeCenterY - noseHeight * 0.12
    );

    noseShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.62,
            5
        )
    );

    noseShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 1.24,
            10
        )
    );

    noseShadow.style.opacity =
        "0.56";

    noseShadow.style.pointerEvents =
        "none";


    /* ==========================
       TIP / LOWER BRIDGE GEOMETRY

       1.2.1:
       The bridge flows directly into a broad rounded tip.
       There is no flat top edge and no narrow bottle-neck.
    ========================== */

    const tipCenterY =
        bridgeCenterY +
        noseHeight * 0.60;

    const bridgeJoinY =
        bridgeCenterY -
        noseHeight * 0.12;

    const shoulderY =
        tipCenterY -
        noseHeight * 0.18;

    const undersideY =
        tipCenterY +
        noseHeight * 0.22;

    const columellaY =
        tipCenterY +
        noseHeight * 0.25;

    const bridgeHalfWidth =
        Math.max(
            noseWidth * 0.72,
            8
        );

    const shoulderHalfWidth =
        Math.max(
            noseWidth * 1.12,
            10
        );

    const undersideHalfWidth =
        Math.max(
            noseWidth * 0.76,
            8
        );


    noseFront.setAttribute(
        "d",
        `
            M
            ${noseCenterX - bridgeHalfWidth}
            ${bridgeJoinY}

            C
            ${noseCenterX - bridgeHalfWidth * 1.10}
            ${bridgeJoinY + noseHeight * 0.18}

            ${noseCenterX - shoulderHalfWidth * 0.76}
            ${shoulderY - noseHeight * 0.10}

            ${noseCenterX - shoulderHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX - shoulderHalfWidth * 0.92}
            ${undersideY - noseHeight * 0.02}

            ${noseCenterX - undersideHalfWidth * 0.66}
            ${columellaY - noseHeight * 0.02}

            ${noseCenterX}
            ${columellaY + noseHeight * 0.015}

            C
            ${noseCenterX + undersideHalfWidth * 0.66}
            ${columellaY - noseHeight * 0.02}

            ${noseCenterX + shoulderHalfWidth * 0.92}
            ${undersideY - noseHeight * 0.02}

            ${noseCenterX + shoulderHalfWidth}
            ${tipCenterY}

            C
            ${noseCenterX + shoulderHalfWidth * 0.76}
            ${shoulderY - noseHeight * 0.10}

            ${noseCenterX + bridgeHalfWidth * 1.10}
            ${bridgeJoinY + noseHeight * 0.18}

            ${noseCenterX + bridgeHalfWidth}
            ${bridgeJoinY}

            C
            ${noseCenterX + bridgeHalfWidth * 0.22}
            ${bridgeJoinY - noseHeight * 0.24}

            ${noseCenterX - bridgeHalfWidth * 0.22}
            ${bridgeJoinY - noseHeight * 0.24}

            ${noseCenterX - bridgeHalfWidth}
            ${bridgeJoinY}

            Z
        `
    );

    noseFront.style.opacity =
        "0.80";

    noseFront.style.stroke =
        "none";

    noseFront.style.pointerEvents =
        "none";

    ensureNoseSurfaceSoftener();

    noseFront.setAttribute(
        "filter",
        "url(#faceLabNoseSurfaceSoftener)"
    );


    /* ==========================
       ALAR WINGS

       Fuller around the nostrils, but they fold inward
       beneath the tip instead of trailing sideways.
    ========================== */

    const wingInset =
        Math.max(
            settings.nostrilSpacing,
            shoulderHalfWidth * 0.12
        );

    const leftInnerX =
        noseCenterX -
        wingInset;

    const rightInnerX =
        noseCenterX +
        wingInset;

    const leftOuterX =
        leftInnerX -
        nostrilWidth * 0.56;

    const rightOuterX =
        rightInnerX +
        nostrilWidth * 0.56;

    const wingTopY =
        nostrilCenterY -
        nostrilHeight * 0.62;

    const wingBottomY =
        nostrilCenterY +
        nostrilHeight * 0.48;


    leftNostril.setAttribute(
        "d",
        `
            M
            ${leftInnerX + nostrilWidth * 0.50}
            ${wingTopY + nostrilHeight * 0.10}

            C
            ${leftInnerX - nostrilWidth * 0.02}
            ${wingTopY - nostrilHeight * 0.08}

            ${leftInnerX - nostrilWidth * 0.36}
            ${wingTopY - nostrilHeight * 0.04}

            ${leftInnerX - nostrilWidth * 0.48}
            ${nostrilCenterY - nostrilHeight * 0.01}

            C
            ${leftInnerX - nostrilWidth * 0.46}
            ${nostrilCenterY + nostrilHeight * 0.29}

            ${leftInnerX - nostrilWidth * 0.30}
            ${nostrilCenterY + nostrilHeight * 0.40}

            ${leftInnerX - nostrilWidth * 0.02}
            ${nostrilCenterY + nostrilHeight * 0.30}

            C
            ${leftInnerX + nostrilWidth * 0.08}
            ${nostrilCenterY + nostrilHeight * 0.17}

            ${leftInnerX + nostrilWidth * 0.18}
            ${wingTopY + nostrilHeight * 0.18}

            ${leftInnerX + nostrilWidth * 0.50}
            ${wingTopY + nostrilHeight * 0.10}

            Z
        `
    );


    rightNostril.setAttribute(
        "d",
        `
            M
            ${rightInnerX - nostrilWidth * 0.50}
            ${wingTopY + nostrilHeight * 0.10}

            C
            ${rightInnerX + nostrilWidth * 0.02}
            ${wingTopY - nostrilHeight * 0.08}

            ${rightInnerX + nostrilWidth * 0.36}
            ${wingTopY - nostrilHeight * 0.04}

            ${rightInnerX + nostrilWidth * 0.48}
            ${nostrilCenterY - nostrilHeight * 0.01}

            C
            ${rightInnerX + nostrilWidth * 0.46}
            ${nostrilCenterY + nostrilHeight * 0.29}

            ${rightInnerX + nostrilWidth * 0.30}
            ${nostrilCenterY + nostrilHeight * 0.40}

            ${rightInnerX + nostrilWidth * 0.02}
            ${nostrilCenterY + nostrilHeight * 0.30}

            C
            ${rightInnerX - nostrilWidth * 0.08}
            ${nostrilCenterY + nostrilHeight * 0.17}

            ${rightInnerX - nostrilWidth * 0.18}
            ${wingTopY + nostrilHeight * 0.18}

            ${rightInnerX - nostrilWidth * 0.50}
            ${wingTopY + nostrilHeight * 0.10}

            Z
        `
    );


    leftNostril.style.opacity =
        "0.78";

    rightNostril.style.opacity =
        "0.78";

    leftNostril.style.stroke =
        "none";

    rightNostril.style.stroke =
        "none";

    leftNostril.setAttribute(
        "filter",
        "url(#faceLabNoseSurfaceSoftener)"
    );

    rightNostril.setAttribute(
        "filter",
        "url(#faceLabNoseSurfaceSoftener)"
    );


    /* ==========================
       ALAR CREASE GRADIENTS

       Darkest along the lower inner wing, then fading
       upward/outward into the surrounding skin.

       This is what visually connects:
       wing crease -> nostril shadow -> central nose.
    ========================== */

    function ensureAlarGradient(
        id,
        mirrored
    ) {

        const root =
            noseGroup.ownerSVGElement;

        if (!root) {
            return;
        }

        let defs =
            root.querySelector("defs");

        if (!defs) {

            defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            root.insertBefore(
                defs,
                root.firstChild
            );

        }

        let gradient =
            document.getElementById(id);

        if (!gradient) {

            gradient =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "radialGradient"
                );

            gradient.setAttribute(
                "id",
                id
            );

            gradient.setAttribute(
                "r",
                "92%"
            );

            [
                /*
                   The wing fill is now only a soft tissue-volume gradient.
                   The separate nostril-to-wing crease layer supplies the
                   darker lower edge, so these values intentionally stay light.
                */
                ["0%",   "#a86e55", "0.30"],
                ["30%",  "#b77d60", "0.23"],
                ["56%",  "#c99473", "0.14"],
                ["80%",  "#d6a17e", "0.06"],
                ["100%", "#e0ad87", "0"]
            ].forEach(
                function (values) {

                    const stop =
                        document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "stop"
                        );

                    stop.setAttribute(
                        "offset",
                        values[0]
                    );

                    stop.setAttribute(
                        "stop-color",
                        values[1]
                    );

                    stop.setAttribute(
                        "stop-opacity",
                        values[2]
                    );

                    gradient.appendChild(
                        stop
                    );

                }
            );

            defs.appendChild(
                gradient
            );

        }

        gradient.setAttribute(
            "cx",
            mirrored ? "34%" : "66%"
        );

        gradient.setAttribute(
            "cy",
            "58%"
        );

        gradient.setAttribute(
            "fx",
            mirrored ? "40%" : "60%"
        );

        gradient.setAttribute(
            "fy",
            "62%"
        );

    }


    ensureAlarGradient(
        "faceLabLeftAlarGradient",
        false
    );

    ensureAlarGradient(
        "faceLabRightAlarGradient",
        true
    );

    leftNostril.setAttribute(
        "fill",
        "url(#faceLabLeftAlarGradient)"
    );

    rightNostril.setAttribute(
        "fill",
        "url(#faceLabRightAlarGradient)"
    );


    /* ==========================
       SUBTLE WING ROTATION
    ========================== */

    const wingRotation =
        6;

    leftNostril.setAttribute(
        "transform",
        `rotate(
            ${wingRotation}
            ${leftInnerX}
            ${nostrilCenterY}
        )`
    );

    rightNostril.setAttribute(
        "transform",
        `rotate(
            ${-wingRotation}
            ${rightInnerX}
            ${nostrilCenterY}
        )`
    );


    /* ==========================
       NOSTRIL-TO-WING CREASE LAYERS

       These are separate soft crease strokes that visually
       continue each nostril into the lower alar wing.

       They do not change the wing or tip geometry.
    ========================== */

    function ensureWingCreasePath(id) {

        let path =
            document.getElementById(id);

        if (!path) {

            path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            path.setAttribute(
                "id",
                id
            );

            path.setAttribute(
                "fill",
                "none"
            );

            path.setAttribute(
                "stroke-linecap",
                "round"
            );

            path.setAttribute(
                "stroke-linejoin",
                "round"
            );

            /*
               Put the crease above the wing surface but below
               the nostril opening whenever the SVG structure allows it.
            */

            const holeParent =
                leftHole.parentNode;

            if (
                holeParent === noseGroup &&
                leftHole
            ) {

                noseGroup.insertBefore(
                    path,
                    leftHole
                );

            } else {

                noseGroup.appendChild(
                    path
                );

            }

        }

        return path;

    }


    function ensureWingCreaseGradient(
        id,
        startX,
        endX
    ) {

        const root =
            noseGroup.ownerSVGElement;

        if (!root) {
            return null;
        }

        let defs =
            root.querySelector("defs");

        if (!defs) {

            defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            root.insertBefore(
                defs,
                root.firstChild
            );

        }

        let gradient =
            document.getElementById(id);

        if (!gradient) {

            gradient =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "linearGradient"
                );

            gradient.setAttribute(
                "id",
                id
            );

            gradient.setAttribute(
                "gradientUnits",
                "userSpaceOnUse"
            );

            [
                /*
                   Keep this close to the nostril-hole family rather
                   than using a black crease. The line is darkest where
                   it leaves the nostril, then gently fades into the wing.
                */
                ["0%",   "#4a231d", "0.74"],
                ["24%",  "#5b3028", "0.62"],
                ["50%",  "#74483a", "0.44"],
                ["76%",  "#95634f", "0.23"],
                ["100%", "#b77d60", "0"]
            ].forEach(
                function (values) {

                    const stop =
                        document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "stop"
                        );

                    stop.setAttribute(
                        "offset",
                        values[0]
                    );

                    stop.setAttribute(
                        "stop-color",
                        values[1]
                    );

                    stop.setAttribute(
                        "stop-opacity",
                        values[2]
                    );

                    gradient.appendChild(
                        stop
                    );

                }
            );

            defs.appendChild(
                gradient
            );

        }

        gradient.setAttribute(
            "x1",
            startX
        );

        gradient.setAttribute(
            "x2",
            endX
        );

        gradient.setAttribute(
            "y1",
            nostrilCenterY
        );

        gradient.setAttribute(
            "y2",
            wingBottomY
        );

        return gradient;

    }


    const leftWingCrease =
        ensureWingCreasePath(
            "leftNostrilWingCrease"
        );

    const rightWingCrease =
        ensureWingCreasePath(
            "rightNostrilWingCrease"
        );


    if (
        leftWingCrease &&
        rightWingCrease
    ) {

        /*
           Start at the outside/lower edge of each nostril opening,
           then follow the lower-inner wing before fading outward.
        */

        const creaseStartOffset =
            nostrilHoleWidth * 0.70;

        const creaseStartY =
            settings.nostrilHoleY +
            nostrilHoleHeight * 0.48;

        const leftCreaseStartX =
            leftHoleX -
            creaseStartOffset;

        const rightCreaseStartX =
            rightHoleX +
            creaseStartOffset;

        /*
           Carry the crease farther along the lower wing so it follows
           the contour from the nostril toward the outside, like the
           sketched lower edge, without outlining the whole wing.
        */
        const leftCreaseEndX =
            leftOuterX +
            nostrilWidth * 0.16;

        const rightCreaseEndX =
            rightOuterX -
            nostrilWidth * 0.16;

        const creaseEndY =
            wingBottomY -
            nostrilHeight * 0.02;


        leftWingCrease.setAttribute(
            "d",
            `
                M
                ${leftCreaseStartX}
                ${creaseStartY}

                C
                ${leftCreaseStartX - nostrilWidth * 0.16}
                ${creaseStartY + nostrilHeight * 0.16}

                ${leftCreaseEndX + nostrilWidth * 0.12}
                ${creaseEndY + nostrilHeight * 0.02}

                ${leftCreaseEndX}
                ${creaseEndY}
            `
        );


        rightWingCrease.setAttribute(
            "d",
            `
                M
                ${rightCreaseStartX}
                ${creaseStartY}

                C
                ${rightCreaseStartX + nostrilWidth * 0.16}
                ${creaseStartY + nostrilHeight * 0.16}

                ${rightCreaseEndX - nostrilWidth * 0.12}
                ${creaseEndY + nostrilHeight * 0.02}

                ${rightCreaseEndX}
                ${creaseEndY}
            `
        );


        ensureWingCreaseGradient(
            "faceLabLeftNostrilWingCreaseGradient",
            leftCreaseStartX,
            leftCreaseEndX
        );

        ensureWingCreaseGradient(
            "faceLabRightNostrilWingCreaseGradient",
            rightCreaseStartX,
            rightCreaseEndX
        );


        leftWingCrease.setAttribute(
            "stroke",
            "url(#faceLabLeftNostrilWingCreaseGradient)"
        );

        rightWingCrease.setAttribute(
            "stroke",
            "url(#faceLabRightNostrilWingCreaseGradient)"
        );


        const creaseWidth =
            Math.max(
                nostrilHoleHeight * 0.58,
                0.95
            );

        leftWingCrease.setAttribute(
            "stroke-width",
            creaseWidth
        );

        rightWingCrease.setAttribute(
            "stroke-width",
            creaseWidth
        );

        leftWingCrease.style.opacity =
            "0.78";

        rightWingCrease.style.opacity =
            "0.78";

        leftWingCrease.style.pointerEvents =
            "none";

        rightWingCrease.style.pointerEvents =
            "none";

    }


    /* ==========================
       COLUMELLA / UNDERSIDE SHADOW

       Narrow central underside cue, not a broad oval.
    ========================== */

    noseBottomShadow.setAttribute(
        "cx",
        noseCenterX
    );

    noseBottomShadow.setAttribute(
        "cy",
        columellaY - noseHeight * 0.02
    );

    noseBottomShadow.setAttribute(
        "rx",
        Math.max(
            noseWidth * 0.34,
            4
        )
    );

    noseBottomShadow.setAttribute(
        "ry",
        Math.max(
            noseHeight * 0.050,
            1.2
        )
    );

    noseBottomShadow.style.opacity =
        "0.08";

    noseBottomShadow.style.pointerEvents =
        "none";


    /* ==========================
       UNIFIED NOSE SOFTENING

       A tiny blur is applied to the filled tissue surfaces only.
       This removes hard SVG cut edges while preserving form.
    ========================== */

    function ensureNoseSurfaceSoftener() {

        const root =
            noseGroup.ownerSVGElement;

        if (!root) {
            return;
        }

        let defs =
            root.querySelector("defs");

        if (!defs) {

            defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            root.insertBefore(
                defs,
                root.firstChild
            );

        }

        if (
            document.getElementById(
                "faceLabNoseSurfaceSoftener"
            )
        ) {
            return;
        }

        const filter =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "filter"
            );

        filter.setAttribute(
            "id",
            "faceLabNoseSurfaceSoftener"
        );

        filter.setAttribute("x", "-25%");
        filter.setAttribute("y", "-25%");
        filter.setAttribute("width", "150%");
        filter.setAttribute("height", "150%");

        const blur =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "feGaussianBlur"
            );

        blur.setAttribute(
            "stdDeviation",
            "0.16"
        );

        filter.appendChild(blur);
        defs.appendChild(filter);

    }


    /* ==========================
       NOSTRIL EDGE FEATHER

       A tiny SVG blur breaks the crisp ellipse boundary.
       The radial gradient still supplies the actual depth.
    ========================== */

    const noseSvgRoot =
        noseGroup.ownerSVGElement;

    function ensureNostrilBlur() {

        if (!noseSvgRoot) {
            return;
        }

        let defs =
            noseSvgRoot.querySelector("defs");

        if (!defs) {

            defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            noseSvgRoot.insertBefore(
                defs,
                noseSvgRoot.firstChild
            );

        }

        if (
            document.getElementById(
                "faceLabNostrilFeather"
            )
        ) {
            return;
        }

        const filter =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "filter"
            );

        filter.setAttribute(
            "id",
            "faceLabNostrilFeather"
        );

        filter.setAttribute("x", "-40%");
        filter.setAttribute("y", "-80%");
        filter.setAttribute("width", "180%");
        filter.setAttribute("height", "260%");

        const blur =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "feGaussianBlur"
            );

        blur.setAttribute(
            "stdDeviation",
            "0.16"
        );

        filter.appendChild(blur);
        defs.appendChild(filter);

    }


    /* ==========================
       SOFT NOSTRIL SHADOWS

       Fuzzy radial edges make the openings read as recessed
       shadows instead of crisp ellipses.
    ========================== */

    const svgRoot =
        noseGroup.ownerSVGElement;

    function ensureSoftNostrilGradient(
        id,
        mirrored
    ) {

        if (!svgRoot) {
            return;
        }

        let defs =
            svgRoot.querySelector("defs");

        if (!defs) {

            defs =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "defs"
                );

            svgRoot.insertBefore(
                defs,
                svgRoot.firstChild
            );

        }

        let gradient =
            document.getElementById(id);

        if (!gradient) {

            gradient =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "radialGradient"
                );

            gradient.setAttribute(
                "id",
                id
            );

            gradient.setAttribute(
                "r",
                "122%"
            );

            [
                ["0%", "#28110e", "0.96"],
                ["18%", "#3d1d18", "0.90"],
                ["38%", "#5b3028", "0.70"],
                ["58%", "#7c493b", "0.42"],
                ["76%", "#a46b55", "0.18"],
                ["90%", "#c58d6c", "0.06"],
                ["100%", "#d8a07f", "0"]
            ].forEach(
                function (values) {

                    const stop =
                        document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "stop"
                        );

                    stop.setAttribute(
                        "offset",
                        values[0]
                    );

                    stop.setAttribute(
                        "stop-color",
                        values[1]
                    );

                    stop.setAttribute(
                        "stop-opacity",
                        values[2]
                    );

                    gradient.appendChild(
                        stop
                    );

                }
            );

            defs.appendChild(
                gradient
            );

        }

        gradient.setAttribute(
            "cx",
            mirrored ? "43%" : "57%"
        );

        gradient.setAttribute(
            "cy",
            "28%"
        );

        gradient.setAttribute(
            "fx",
            mirrored ? "46%" : "54%"
        );

        gradient.setAttribute(
            "fy",
            "18%"
        );

    }


    /* ==========================
       NOSTRIL HOLES

       Compact openings tucked beneath the alar wings.
    ========================== */

    const holeY =
        settings.nostrilHoleY;


    leftHole.setAttribute(
        "cx",
        leftHoleX
    );

    rightHole.setAttribute(
        "cx",
        rightHoleX
    );

    leftHole.setAttribute(
        "cy",
        holeY
    );

    rightHole.setAttribute(
        "cy",
        holeY
    );

    leftHole.setAttribute(
        "rx",
        nostrilHoleWidth
    );

    rightHole.setAttribute(
        "rx",
        nostrilHoleWidth
    );

    leftHole.setAttribute(
        "ry",
        nostrilHoleHeight
    );

    rightHole.setAttribute(
        "ry",
        nostrilHoleHeight
    );


    const holeRotation =
        wingRotation * 0.82;

    leftHole.setAttribute(
        "transform",
        `rotate(
            ${holeRotation}
            ${leftHoleX}
            ${holeY}
        )`
    );

    rightHole.setAttribute(
        "transform",
        `rotate(
            ${-holeRotation}
            ${rightHoleX}
            ${holeY}
        )`
    );

    ensureSoftNostrilGradient(
        "faceLabLeftNostrilSoft",
        false
    );

    ensureSoftNostrilGradient(
        "faceLabRightNostrilSoft",
        true
    );

    leftHole.setAttribute(
        "fill",
        "url(#faceLabLeftNostrilSoft)"
    );

    rightHole.setAttribute(
        "fill",
        "url(#faceLabRightNostrilSoft)"
    );

    ensureNostrilBlur();

    leftHole.setAttribute(
        "filter",
        "url(#faceLabNostrilFeather)"
    );

    rightHole.setAttribute(
        "filter",
        "url(#faceLabNostrilFeather)"
    );

    leftHole.style.opacity =
        "1";

    rightHole.style.opacity =
        "1";

}



/* ==========================
   INITIALIZE NOSE CONTROLS
========================== */

function initializeNoseControls() {

    noseControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {

                console.warn(
                    `Could not find nose slider: ${settingName}`
                );

                return;

            }

            slider.value =
                window.noseSettings[
                    settingName
                ];

            displayNoseValue(
                settingName
            );


            slider.addEventListener(
                "input",
                function () {

                    window.noseSettings[
                        settingName
                    ] = Number(
                        slider.value
                    );

                    displayNoseValue(
                        settingName
                    );

                    applyNoseSettings();

                }
            );

        }
    );

}


/* ==========================
   UPDATE NOSE CONTROLS
========================== */

function updateNoseControls() {

    noseControls.forEach(
        function (settingName) {

            const slider =
                document.getElementById(
                    settingName
                );

            if (!slider) {
                return;
            }

            slider.value =
                window.noseSettings[
                    settingName
                ];

            displayNoseValue(
                settingName
            );

        }
    );

}


/* ==========================
   NOSE STATUS MESSAGE
========================== */

function displayNoseStatus(message) {

    const status =
        document.getElementById(
            "noseSaveStatus"
        );

    if (!status) {
        return;
    }

    status.textContent =
        message;

}


/* ==========================
   SAVE NOSE
========================== */

function saveNose() {

    try {

        localStorage.setItem(
            "humanoidNoseSettings",
            JSON.stringify(
                window.noseSettings
            )
        );

        displayNoseStatus(
            "Nose settings saved."
        );

    } catch (error) {

        displayNoseStatus(
            "Nose settings could not be saved."
        );

        console.error(
            "Nose settings could not be saved:",
            error
        );

    }

}


/* ==========================
   LOAD NOSE
========================== */

function loadNose() {

    const savedSettings =
        localStorage.getItem(
            "humanoidNoseSettings"
        );

    if (!savedSettings) {
        return false;
    }

    try {

        const parsedSettings =
            JSON.parse(
                savedSettings
            );

        Object.assign(
            window.noseSettings,
            parsedSettings
        );

        updateNoseControls();

        applyNoseSettings();

        displayNoseStatus(
            "Saved nose settings loaded."
        );

        return true;

    } catch (error) {

        console.error(
            "Saved nose settings could not be loaded:",
            error
        );

        return false;

    }

}


/* ==========================
   RESET NOSE
========================== */

function resetNose() {

    Object.assign(
        window.noseSettings,
        defaultNoseSettings
    );

    updateNoseControls();

    applyNoseSettings();

    displayNoseStatus(
        "Nose settings reset."
    );

}


/* ==========================
   INITIALIZE NOSE BUTTONS
========================== */

function initializeNoseButtons() {

    const saveButton =
        document.getElementById(
            "saveNose"
        );

    const loadButton =
        document.getElementById(
            "loadNose"
        );

    const resetButton =
        document.getElementById(
            "resetNose"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveNose
        );

    }


    if (loadButton) {

        loadButton.addEventListener(
            "click",
            function () {

                const loaded =
                    loadNose();

                if (!loaded) {

                    displayNoseStatus(
                        "No saved nose was found."
                    );

                }

            }
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetNose
        );

    }

}


/* ==========================
   INITIALIZE NOSE
========================== */

function initializeNose() {

    initializeNoseControls();

    initializeNoseButtons();

    const savedNoseLoaded =
        loadNose();

    if (!savedNoseLoaded) {

        updateNoseControls();

        applyNoseSettings();

    }

}


/* ==========================
   EXPOSE NOSE FUNCTIONS
========================== */

window.initializeNose =
    initializeNose;

window.applyNoseSettings =
    applyNoseSettings;

window.updateNoseControls =
    updateNoseControls;

window.saveNose =
    saveNose;

window.loadNose =
    loadNose;

window.resetNose =
    resetNose;
