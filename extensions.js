"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    if (!Array.prototype.contains)
        Array.prototype.contains = function (element) {
            return this.indexOf(element) >= 0;
        };
    if (!Array.prototype.lastIndex)
        Array.prototype.lastIndex = function () {
            return this.length - 1;
        };
    if (!Array.prototype.remove)
        Array.prototype.remove = function (element) {
            const index = this.indexOf(element);
            if (index >= 0)
                this.splice(index);
        };
}
exports.default = default_1;
