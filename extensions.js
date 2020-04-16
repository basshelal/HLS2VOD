Object.prototype.print = function () {
    console.log(this);
};
Array.prototype.contains = function (element) {
    return this.indexOf(element) >= 0;
};
