declare global {
    interface Array<T> {
        contains(element: T): boolean

        lastIndex(): number

        remove(element: T)
    }
}
export default function () {
    if (!Array.prototype.contains)
        Array.prototype.contains = function <T>(this: Array<T>, element: T): boolean {
            return this.indexOf(element) >= 0
        }

    if (!Array.prototype.lastIndex)
        Array.prototype.lastIndex = function (): number {
            return this.length - 1
        }

    if (!Array.prototype.remove)
        Array.prototype.remove = function <T>(this: Array<T>, element: T) {
            const index = this.indexOf(element)
            if (index >= 0) this.splice(index)
        }
}