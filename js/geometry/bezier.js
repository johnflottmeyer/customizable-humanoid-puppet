/* ==========================
   CUBIC BEZIER
========================== */

(function () {

    class CubicBezier {

        constructor(
            startPoint,
            controlPoint1,
            controlPoint2,
            endPoint
        ) {

            this.startPoint =
                CubicBezier.resolvePoint(startPoint);

            this.controlPoint1 =
                CubicBezier.resolvePoint(controlPoint1);

            this.controlPoint2 =
                CubicBezier.resolvePoint(controlPoint2);

            this.endPoint =
                CubicBezier.resolvePoint(endPoint);

        }

        /* ==========================
           RESOLVE POINT
        ========================== */

        static resolvePoint(point) {

            if (point instanceof Point) {
                return point.clone();
            }

            if (
                point &&
                Number.isFinite(Number(point.x)) &&
                Number.isFinite(Number(point.y))
            ) {

                return new Point(
                    Number(point.x),
                    Number(point.y)
                );

            }

            return new Point();

        }

        /* ==========================
           POINT ON CURVE
        ========================== */

        getPoint(t) {

            const amount =
                CubicBezier.clamp01(t);

            const inverse =
                1 - amount;

            const inverseSquared =
                inverse * inverse;

            const amountSquared =
                amount * amount;

            const startWeight =
                inverseSquared * inverse;

            const control1Weight =
                3 * inverseSquared * amount;

            const control2Weight =
                3 * inverse * amountSquared;

            const endWeight =
                amountSquared * amount;

            return new Point(

                (
                    this.startPoint.x * startWeight
                ) +
                (
                    this.controlPoint1.x * control1Weight
                ) +
                (
                    this.controlPoint2.x * control2Weight
                ) +
                (
                    this.endPoint.x * endWeight
                ),

                (
                    this.startPoint.y * startWeight
                ) +
                (
                    this.controlPoint1.y * control1Weight
                ) +
                (
                    this.controlPoint2.y * control2Weight
                ) +
                (
                    this.endPoint.y * endWeight
                )

            );

        }

        /* ==========================
           TANGENT
        ========================== */

        getTangent(t) {

            const amount =
                CubicBezier.clamp01(t);

            const inverse =
                1 - amount;

            const x =
                (
                    3 * inverse * inverse *
                    (
                        this.controlPoint1.x -
                        this.startPoint.x
                    )
                ) +
                (
                    6 * inverse * amount *
                    (
                        this.controlPoint2.x -
                        this.controlPoint1.x
                    )
                ) +
                (
                    3 * amount * amount *
                    (
                        this.endPoint.x -
                        this.controlPoint2.x
                    )
                );

            const y =
                (
                    3 * inverse * inverse *
                    (
                        this.controlPoint1.y -
                        this.startPoint.y
                    )
                ) +
                (
                    6 * inverse * amount *
                    (
                        this.controlPoint2.y -
                        this.controlPoint1.y
                    )
                ) +
                (
                    3 * amount * amount *
                    (
                        this.endPoint.y -
                        this.controlPoint2.y
                    )
                );

            return new Vector(
                x,
                y
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

        getLength(sampleCount = 40) {

            const samples =
                Math.max(
                    2,
                    Math.floor(sampleCount)
                );

            let length = 0;

            let previousPoint =
                this.getPoint(0);

            for (
                let index = 1;
                index <= samples;
                index += 1
            ) {

                const amount =
                    index / samples;

                const currentPoint =
                    this.getPoint(amount);

                length +=
                    previousPoint.distanceTo(
                        currentPoint
                    );

                previousPoint =
                    currentPoint;

            }

            return length;

        }

        /* ==========================
           SAMPLE CURVE
        ========================== */

        sample(sampleCount = 20) {

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
           SPLIT CURVE
        ========================== */

        split(t = 0.5) {

            const amount =
                CubicBezier.clamp01(t);

            const pointA =
                this.startPoint.lerpTo(
                    this.controlPoint1,
                    amount
                );

            const pointB =
                this.controlPoint1.lerpTo(
                    this.controlPoint2,
                    amount
                );

            const pointC =
                this.controlPoint2.lerpTo(
                    this.endPoint,
                    amount
                );

            const pointD =
                pointA.lerpTo(
                    pointB,
                    amount
                );

            const pointE =
                pointB.lerpTo(
                    pointC,
                    amount
                );

            const splitPoint =
                pointD.lerpTo(
                    pointE,
                    amount
                );

            return {

                left: new CubicBezier(
                    this.startPoint,
                    pointA,
                    pointD,
                    splitPoint
                ),

                right: new CubicBezier(
                    splitPoint,
                    pointE,
                    pointC,
                    this.endPoint
                ),

                point: splitPoint

            };

        }

        /* ==========================
           SVG PATH COMMAND
        ========================== */

        toPathCommand() {

            const builder =
                new PathBuilder();

            builder.cubicTo(
                this.controlPoint1,
                this.controlPoint2,
                this.endPoint
            );

            return builder.build();

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

    window.CubicBezier = CubicBezier;

})();
