/* ==========================
   VECTOR
========================== */

(function () {

    class Vector {

        constructor(x = 0, y = 0) {

            this.x = Number(x);
            this.y = Number(y);

        }

        static fromPoints(startPoint, endPoint) {

            return new Vector(
                endPoint.x - startPoint.x,
                endPoint.y - startPoint.y
            );

        }

        clone() {

            return new Vector(
                this.x,
                this.y
            );

        }

        length() {

            return Math.hypot(
                this.x,
                this.y
            );

        }

        lengthSquared() {

            return (
                (this.x * this.x) +
                (this.y * this.y)
            );

        }

        normalize() {

            const vectorLength = this.length();

            if (vectorLength === 0) {

                return new Vector(
                    0,
                    0
                );

            }

            return new Vector(
                this.x / vectorLength,
                this.y / vectorLength
            );

        }

        add(vector) {

            return new Vector(
                this.x + vector.x,
                this.y + vector.y
            );

        }

        subtract(vector) {

            return new Vector(
                this.x - vector.x,
                this.y - vector.y
            );

        }

        multiply(amount) {

            return new Vector(
                this.x * amount,
                this.y * amount
            );

        }

        divide(amount) {

            if (amount === 0) {
                return this.clone();
            }

            return new Vector(
                this.x / amount,
                this.y / amount
            );

        }

        dot(vector) {

            return (
                (this.x * vector.x) +
                (this.y * vector.y)
            );

        }

        perpendicularLeft() {

            return new Vector(
                -this.y,
                this.x
            );

        }

        perpendicularRight() {

            return new Vector(
                this.y,
                -this.x
            );

        }

        angle() {

            return Math.atan2(
                this.y,
                this.x
            );

        }

        rotate(angleRadians) {

            const cosine = Math.cos(angleRadians);
            const sine = Math.sin(angleRadians);

            return new Vector(
                (this.x * cosine) - (this.y * sine),
                (this.x * sine) + (this.y * cosine)
            );

        }

        toPoint() {

            return new Point(
                this.x,
                this.y
            );

        }

    }

    window.Vector = Vector;

})();
