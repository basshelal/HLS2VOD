interface Object {
    print()
}

Object.prototype.print = function () {
    console.log(this)
}

interface Array<T> {
    contains(element: T): boolean
}

Array.prototype.contains = function <T>(element: T): boolean {
    return this.indexOf(element) >= 0
}

