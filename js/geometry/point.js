/* ==========================
   POINT
========================== */

(function () {

    class Point {

        constructor(x = 0, y = 0) {

            this.x = Number(x);
            this.y = Number(y);

        }

        clone() {

            return new Point(
                this.x,
                this.y
            );

        }

        add(value) {

            return new Point(
                this.x + value.x,
                this.y + value.y
            );

        }

        subtract(value) {

            return new Point(
                this.x - value.x,
                this.y - value.y
            );

        }

        multiply(amount) {

            return new Point(
                this.x * amount,
                this.y * amount
            );

        }

        divide(amount) {

            if (amount === 0) {
                return this.clone();
            }

            return new Point(
                this.x / amount,
                this.y / amount
            );

        }

        distanceTo(point) {

            return Math.hypot(
                point.x - this.x,
                point.y - this.y
            );

        }

        midpointTo(point) {

            return new Point(
                (this.x + point.x) / 2,
                (this.y + point.y) / 2
            );

        }

        lerpTo(point, amount) {

            return new Point(
                this.x + ((point.x - this.x) * amount),
                this.y + ((point.y - this.y) * amount)
            );

        }

        equals(point, tolerance = 0.0001) {

            return (
                Math.abs(this.x - point.x) <= tolerance &&
                Math.abs(this.y - point.y) <= tolerance
            );

        }

        toObject() {

            return {
                x: this.x,
                y: this.y
            };

        }

    }

    window.Point = Point;

})();
