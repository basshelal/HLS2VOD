declare global {
    interface Array<T> {
        contains(element: T): boolean

        lastIndex(): number

        remove(element: T)

        isEmpty(): boolean
    }
}
export default function () {
    if (!Array.prototype.contains)
        Array.prototype.contains = function <T>(this: Array<T>, element: T): boolean {
            return this.indexOf(element) >= 0
        }

    if (!Array.prototype.lastIndex)
        Array.prototype.lastIndex = function (this: Array<any>): number {
            return this.length - 1
        }

    if (!Array.prototype.remove)
        Array.prototype.remove = function <T>(this: Array<T>, element: T) {
            const index = this.indexOf(element)
            if (index >= 0) this.splice(index)
        }

    if (!Array.prototype.isEmpty)
        Array.prototype.isEmpty = function (this: Array<any>) {
            return this.length === 0
        }
}