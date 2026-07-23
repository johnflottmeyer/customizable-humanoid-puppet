/* ==========================
   SVG PATH BUILDER
========================== */

(function () {

    class PathBuilder {

        constructor() {

            this.commands = [];

        }

        clear() {

            this.commands = [];

            return this;

        }

        moveTo(x, y) {

            const point = this.resolvePoint(x, y);

            this.commands.push(
                `M ${this.format(point.x)} ${this.format(point.y)}`
            );

            return this;

        }

        lineTo(x, y) {

            const point = this.resolvePoint(x, y);

            this.commands.push(
                `L ${this.format(point.x)} ${this.format(point.y)}`
            );

            return this;

        }

        horizontalTo(x) {

            this.commands.push(
                `H ${this.format(x)}`
            );

            return this;

        }

        verticalTo(y) {

            this.commands.push(
                `V ${this.format(y)}`
            );

            return this;

        }

        quadraticTo(controlX, controlY, endX, endY) {

            const controlPoint =
                this.resolvePoint(
                    controlX,
                    controlY
                );

            const endPoint =
                this.resolvePoint(
                    endX,
                    endY
                );

            this.commands.push(
                `Q ${this.format(controlPoint.x)} ${this.format(controlPoint.y)} ` +
                `${this.format(endPoint.x)} ${this.format(endPoint.y)}`
            );

            return this;

        }

        cubicTo(
    control1X,
    control1Y,
    control2X,
    control2Y,
    endX,
    endY
) {

    let controlPoint1;
    let controlPoint2;
    let endPoint;

    if (
        typeof control1X === "object" &&
        typeof control1Y === "object" &&
        typeof control2X === "object"
    ) {

        controlPoint1 =
            this.resolvePoint(control1X);

        controlPoint2 =
            this.resolvePoint(control1Y);

        endPoint =
            this.resolvePoint(control2X);

    } else {

        controlPoint1 =
            this.resolvePoint(
                control1X,
                control1Y
            );

        controlPoint2 =
            this.resolvePoint(
                control2X,
                control2Y
            );

        endPoint =
            this.resolvePoint(
                endX,
                endY
            );

    }

    this.commands.push(
        `C ${this.format(controlPoint1.x)} ${this.format(controlPoint1.y)} ` +
        `${this.format(controlPoint2.x)} ${this.format(controlPoint2.y)} ` +
        `${this.format(endPoint.x)} ${this.format(endPoint.y)}`
    );

    return this;

}

        close() {

            this.commands.push("Z");

            return this;

        }

        build() {

            return this.commands.join(" ");

        }

        resolvePoint(x, y) {

            if (
                typeof x === "object" &&
                x !== null &&
                "x" in x &&
                "y" in x
            ) {

                return {
                    x: Number(x.x),
                    y: Number(x.y)
                };

            }

            return {
                x: Number(x),
                y: Number(y)
            };

        }

        format(value) {

            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
                return "0";
            }

            return Number(
                numberValue.toFixed(3)
            );

        }

    }

    window.PathBuilder = PathBuilder;

})();
