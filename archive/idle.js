/* ==========================
   IDLE ANIMATION SETTINGS
========================== */

const idleAnimationSettings = {

    lookDistanceX: 10,
    lookDistanceY: 7,

    lookDuration: 450,
    lookHoldDuration: 900,
    returnDuration: 500,

    minimumLookDelay: 1800,
    maximumLookDelay: 4200,

    blinkCloseDuration: 90,
    blinkHoldDuration: 45,
    blinkOpenDuration: 120,

    minimumBlinkDelay: 2200,
    maximumBlinkDelay: 5200

};


/* ==========================
   IDLE ANIMATION STATE
========================== */

let idleAnimationRunning =
    false;

let lookTimeout =
    null;

let blinkTimeout =
    null;

let lookAnimationFrame =
    null;

let blinkAnimationFrame =
    null;


/* ==========================
   RANDOM NUMBER
========================== */

function randomIdleNumber(
    minimum,
    maximum
) {

    return Math.random() *
        (maximum - minimum) +
        minimum;

}


/* ==========================
   EASING
========================== */

function idleEaseInOut(value) {

    return value < 0.5

        ? 2 * value * value

        : 1 -
          Math.pow(
              -2 * value + 2,
              2
          ) / 2;

}


/* ==========================
   ANIMATE EYE LOOK
========================== */

function animateEyeLook(
    targetX,
    targetY,
    duration,
    callback
) {

    if (!window.eyeAnimationState) {
        return;
    }


    if (lookAnimationFrame) {

        cancelAnimationFrame(
            lookAnimationFrame
        );

    }


    const startX =
        window.eyeAnimationState.lookX;

    const startY =
        window.eyeAnimationState.lookY;

    const startTime =
        performance.now();


    function animationStep(currentTime) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );

        const easedProgress =
            idleEaseInOut(
                progress
            );


        window.eyeAnimationState.lookX =
            startX +
            (targetX - startX) *
            easedProgress;

        window.eyeAnimationState.lookY =
            startY +
            (targetY - startY) *
            easedProgress;


        if (
            typeof window.drawEyes ===
            "function"
        ) {

            window.drawEyes();

        }


        if (progress < 1) {

            lookAnimationFrame =
                requestAnimationFrame(
                    animationStep
                );

        } else {

            lookAnimationFrame =
                null;


            if (
                typeof callback ===
                "function"
            ) {

                callback();

            }

        }

    }


    lookAnimationFrame =
        requestAnimationFrame(
            animationStep
        );

}


/* ==========================
   LOOK DIRECTIONS
========================== */

function getRandomLookDirection() {

    const amount =
        Math.random();

    const horizontalDistance =
        idleAnimationSettings
            .lookDistanceX;

    const verticalDistance =
        idleAnimationSettings
            .lookDistanceY;


    if (amount < 0.20) {

        return {
            name: "left",
            x: -horizontalDistance,
            y: 0
        };

    }


    if (amount < 0.40) {

        return {
            name: "right",
            x: horizontalDistance,
            y: 0
        };

    }


    if (amount < 0.55) {

        return {
            name: "up",
            x: 0,
            y: -verticalDistance
        };

    }


    if (amount < 0.70) {

        return {
            name: "down",
            x: 0,
            y: verticalDistance
        };

    }


    return {
        name: "center",
        x: 0,
        y: 0
    };

}


/* ==========================
   SCHEDULE NEXT LOOK
========================== */

function scheduleNextIdleLook() {

    if (!idleAnimationRunning) {
        return;
    }


    const delay =
        randomIdleNumber(
            idleAnimationSettings
                .minimumLookDelay,

            idleAnimationSettings
                .maximumLookDelay
        );


    lookTimeout =
        setTimeout(
            performIdleLook,
            delay
        );

}


/* ==========================
   PERFORM IDLE LOOK
========================== */

function performIdleLook() {

    if (!idleAnimationRunning) {
        return;
    }


    const direction =
        getRandomLookDirection();


    animateEyeLook(
        direction.x,
        direction.y,
        idleAnimationSettings.lookDuration,
        function () {

            lookTimeout =
                setTimeout(
                    function () {

                        animateEyeLook(
                            0,
                            0,
                            idleAnimationSettings
                                .returnDuration,
                            scheduleNextIdleLook
                        );

                    },
                    idleAnimationSettings
                        .lookHoldDuration
                );

        }
    );

}


/* ==========================
   ANIMATE BLINK
========================== */

function animateBlinkValue(
    targetValue,
    duration,
    callback
) {

    if (!window.eyeAnimationState) {
        return;
    }


    if (blinkAnimationFrame) {

        cancelAnimationFrame(
            blinkAnimationFrame
        );

    }


    const startValue =
        window.eyeAnimationState.blink;

    const startTime =
        performance.now();


    function animationStep(currentTime) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );

        const easedProgress =
            idleEaseInOut(
                progress
            );


        window.eyeAnimationState.blink =
            startValue +
            (targetValue - startValue) *
            easedProgress;


        if (
            typeof window.drawEyes ===
            "function"
        ) {

            window.drawEyes();

        }


        if (progress < 1) {

            blinkAnimationFrame =
                requestAnimationFrame(
                    animationStep
                );

        } else {

            blinkAnimationFrame =
                null;


            if (
                typeof callback ===
                "function"
            ) {

                callback();

            }

        }

    }


    blinkAnimationFrame =
        requestAnimationFrame(
            animationStep
        );

}


/* ==========================
   BLINK
========================== */

function blinkEyes() {

    if (!idleAnimationRunning) {
        return;
    }


    animateBlinkValue(
        1,
        idleAnimationSettings
            .blinkCloseDuration,
        function () {

            blinkTimeout =
                setTimeout(
                    function () {

                        animateBlinkValue(
                            0,
                            idleAnimationSettings
                                .blinkOpenDuration,
                            scheduleNextBlink
                        );

                    },
                    idleAnimationSettings
                        .blinkHoldDuration
                );

        }
    );

}


/* ==========================
   SCHEDULE NEXT BLINK
========================== */

function scheduleNextBlink() {

    if (!idleAnimationRunning) {
        return;
    }


    const delay =
        randomIdleNumber(
            idleAnimationSettings
                .minimumBlinkDelay,

            idleAnimationSettings
                .maximumBlinkDelay
        );


    blinkTimeout =
        setTimeout(
            blinkEyes,
            delay
        );

}


/* ==========================
   START IDLE ANIMATION
========================== */

function startIdleAnimation() {

    if (idleAnimationRunning) {
        return;
    }


    idleAnimationRunning =
        true;


    scheduleNextIdleLook();

    scheduleNextBlink();

}


/* ==========================
   STOP IDLE ANIMATION
========================== */

function stopIdleAnimation() {

    idleAnimationRunning =
        false;


    if (lookTimeout) {

        clearTimeout(
            lookTimeout
        );

        lookTimeout =
            null;

    }


    if (blinkTimeout) {

        clearTimeout(
            blinkTimeout
        );

        blinkTimeout =
            null;

    }


    if (lookAnimationFrame) {

        cancelAnimationFrame(
            lookAnimationFrame
        );

        lookAnimationFrame =
            null;

    }


    if (blinkAnimationFrame) {

        cancelAnimationFrame(
            blinkAnimationFrame
        );

        blinkAnimationFrame =
            null;

    }


    if (window.eyeAnimationState) {

        window.eyeAnimationState.lookX = 0;

        window.eyeAnimationState.lookY = 0;

        window.eyeAnimationState.blink = 0;

    }


    if (
        typeof window.drawEyes ===
        "function"
    ) {

        window.drawEyes();

    }

}


/* ==========================
   LOOK DIRECTION HELPERS
========================== */

function lookCenter() {

    animateEyeLook(
        0,
        0,
        idleAnimationSettings
            .returnDuration
    );

}


function lookLeft() {

    animateEyeLook(
        -idleAnimationSettings
            .lookDistanceX,
        0,
        idleAnimationSettings
            .lookDuration
    );

}


function lookRight() {

    animateEyeLook(
        idleAnimationSettings
            .lookDistanceX,
        0,
        idleAnimationSettings
            .lookDuration
    );

}


function lookUp() {

    animateEyeLook(
        0,
        -idleAnimationSettings
            .lookDistanceY,
        idleAnimationSettings
            .lookDuration
    );

}


function lookDown() {

    animateEyeLook(
        0,
        idleAnimationSettings
            .lookDistanceY,
        idleAnimationSettings
            .lookDuration
    );

}


/* ==========================
   MAKE FUNCTIONS AVAILABLE
========================== */

window.startIdleAnimation =
    startIdleAnimation;

window.stopIdleAnimation =
    stopIdleAnimation;

window.blinkEyes =
    blinkEyes;

window.lookCenter =
    lookCenter;

window.lookLeft =
    lookLeft;

window.lookRight =
    lookRight;

window.lookUp =
    lookUp;

window.lookDown =
    lookDown;
