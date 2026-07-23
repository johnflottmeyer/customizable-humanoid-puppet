/* ==========================
   SPLINE
========================== */

(function () {

    class Spline {

        constructor(segments = []) {

            this.segments = [];

            segments.forEach((segment) => {

                this.addSegment(segment);

            });

        }

        /* ==========================
           ADD SEGMENT
        ========================== */

        addSegment(segment) {

            if (!(segment instanceof CubicBezier)) {

                console.warn(
                    "Spline segment must be a CubicBezier."
                );

                return this;

            }

            this.segments.push(segment);

            return this;

        }

        /* ==========================
           CLEAR
        ========================== */

        clear() {

            this.segments = [];

            return this;

        }

        /* ==========================
           SEGMENT COUNT
        ========================== */

        getSegmentCount() {

            return this.segments.length;

        }

        /* ==========================
           GLOBAL PARAMETER
        ========================== */

        resolveParameter(t) {

            if (this.segments.length === 0) {

                return {
                    segment: null,
                    segmentIndex: -1,
                    localT: 0
                };

            }

            const amount =
                Spline.clamp01(t);

            if (amount === 1) {

                const finalIndex =
                    this.segments.length - 1;

                return {
                    segment:
                        this.segments[finalIndex],

                    segmentIndex:
                        finalIndex,

                    localT:
                        1
                };

            }

            const scaled =
                amount * this.segments.length;

            const segmentIndex =
                Math.floor(scaled);

            const localT =
                scaled - segmentIndex;

            return {
                segment:
                    this.segments[segmentIndex],

                segmentIndex:
                    segmentIndex,

                localT:
                    localT
            };

        }

        /* ==========================
           POINT ON SPLINE
        ========================== */

        getPoint(t) {

            const resolved =
                this.resolveParameter(t);

            if (!resolved.segment) {

                return new Point();

            }

            return resolved.segment.getPoint(
                resolved.localT
            );

        }

        /* ==========================
           TANGENT
        ========================== */

        getTangent(t) {

            const resolved =
                this.resolveParameter(t);

            if (!resolved.segment) {

                return new Vector();

            }

            return resolved.segment.getTangent(
                resolved.localT
            );

        }

        /* ==========================
           NORMAL
        ========================== */

        getNormal(t, direction = "left") {

            const tangent =
                this.getTangent(t).normalize();

            if (direction === "right") {

                return tangent
                    .perpendicularRight()
                    .normalize();

            }

            return tangent
                .perpendicularLeft()
                .normalize();

        }

        /* ==========================
           APPROXIMATE LENGTH
        ========================== */

        getLength(samplesPerSegment = 40) {

            return this.segments.reduce(
                (total, segment) => {

                    return total +
                        segment.getLength(
                            samplesPerSegment
                        );

                },
                0
            );

        }

        /* ==========================
           SAMPLE SPLINE
        ========================== */

        sample(sampleCount = 40) {

            const samples =
                Math.max(
                    2,
                    Math.floor(sampleCount)
                );

            const points = [];

            for (
                let index = 0;
                index <= samples;
                index += 1
            ) {

                points.push(
                    this.getPoint(
                        index / samples
                    )
                );

            }

            return points;

        }

        /* ==========================
           BUILD SVG PATH
        ========================== */

        toPath() {

            if (this.segments.length === 0) {
                return "";
            }

            const firstSegment =
                this.segments[0];

            const builder =
                new PathBuilder();

            builder.moveTo(
                firstSegment.startPoint
            );

            this.segments.forEach((segment) => {

                builder.cubicTo(
                    segment.controlPoint1,
                    segment.controlPoint2,
                    segment.endPoint
                );

            });

            return builder.build();

        }

        /* ==========================
           CREATE FROM LANDMARKS
        ========================== */

        static fromPoints(
            points,
            tension = 0.35
        ) {

            if (
                !Array.isArray(points) ||
                points.length < 2
            ) {

                return new Spline();

            }

            const resolvedPoints =
                points.map((point) => {

                    if (point instanceof Point) {
                        return point.clone();
                    }

                    return new Point(
                        point.x,
                        point.y
                    );

                });

            const segments = [];

            for (
                let index = 0;
                index <
                resolvedPoints.length - 1;
                index += 1
            ) {

                const previousPoint =
                    resolvedPoints[
                        Math.max(
                            0,
                            index - 1
                        )
                    ];

                const startPoint =
                    resolvedPoints[index];

                const endPoint =
                    resolvedPoints[index + 1];

                const nextPoint =
                    resolvedPoints[
                        Math.min(
                            resolvedPoints.length - 1,
                            index + 2
                        )
                    ];

                const controlPoint1 =
                    new Point(

                        startPoint.x +
                        (
                            endPoint.x -
                            previousPoint.x
                        ) * tension,

                        startPoint.y +
                        (
                            endPoint.y -
                            previousPoint.y
                        ) * tension

                    );

                const controlPoint2 =
                    new Point(

                        endPoint.x -
                        (
                            nextPoint.x -
                            startPoint.x
                        ) * tension,

                        endPoint.y -
                        (
                            nextPoint.y -
                            startPoint.y
                        ) * tension

                    );

                segments.push(

                    new CubicBezier(
                        startPoint,
                        controlPoint1,
                        controlPoint2,
                        endPoint
                    )

                );

            }

            return new Spline(
                segments
            );

        }

        /* ==========================
           CLAMP
        ========================== */

        static clamp01(value) {

            const numberValue =
                Number(value);

            if (!Number.isFinite(numberValue)) {
                return 0;
            }

            return Math.max(
                0,
                Math.min(
                    1,
                    numberValue
                )
            );

        }

    }

    window.Spline = Spline;

})();
