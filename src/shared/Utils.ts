import * as electron from "electron"
import * as path from "path"
import moment from "moment"
import {setInterval} from "timers"
import {removeSync} from "fs-extra"
import {Day, TimeOut, TimeUnit} from "./Types"

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
export const momentFormatShorter = "dddd Do MMMM YYYY, HH:mm:ss:SSS"

export function fileMoment(): string { return moment().format(momentFormatSafe) }

export function getPath(pathString: string): string {
    if (electron.app) return path.join(electron.app.getAppPath(), pathString)
    else return path.join("./", pathString)
}

export function now(): string { return moment().format(momentFormat) }

export function json(value: any, space: number = 2): string { return JSON.stringify(value, null, space) }

export function abs(x: number): number { return Math.abs(x) }

export function floor(x: number): number { return Math.floor(x) }

export function ceil(x: number): number { return Math.ceil(x) }

export function sqrt(x: number): number { return Math.sqrt(x) }

export function pow(x: number, y: number): number { return Math.pow(x, y) }

export function round(x: number): number { return Math.round(x) }

export function random(): number { return Math.random() }

export function average(...values: Array<number>): number {
    if (values.isNotEmpty()) {
        return values.reduce(((prev, curr) => prev + curr), 0) / values.length
    } else return 0
}

export class NumberRangeIterator implements Iterator<number> {

    private current: number = 0

    constructor(public fromInclusive: number, public toExclusive: number, public step: number) {
        this.current = fromInclusive
        if (step === 0) throw new Error("Step cannot equal 0, must be positive or negative")
    }

    next(...args: [] | [undefined]): IteratorResult<number> {
        const value = this.current
        const done = this.current === this.toExclusive
        const result = {value: value, done: done}
        this.current += this.step
        return result
    }

    return(value?: any): IteratorResult<number> {
        const done = this.current === this.toExclusive
        return {value: value, done: done}
    }

    throw(e?: any): IteratorResult<number> {
        const done = this.current === this.toExclusive
        return {value: this.current, done: done}
    }

}

export class NumberRange implements Iterable<number> {

    constructor(public fromInclusive: number, public toExclusive: number, public stepBy: number = 1) {
    }

    [Symbol.iterator](): Iterator<number> {
        return new NumberRangeIterator(this.fromInclusive, this.toExclusive, this.stepBy)
    }

    step(step: number): NumberRange {
        this.stepBy = step
        return this
    }

    forEach(callback: (number: number) => void): void { for (let i of this) callback(i) }

    map<T>(callback: (number: number) => T): Array<T> {
        const result: Array<T> = []
        for (let i of this) result[i] = callback(i)
        return result
    }

    get toArray(): Array<number> { return Array.from(this) }
}

export function range(fromInclusive: number, toExclusive: number, step: number = 1): NumberRange {
    return new NumberRange(fromInclusive, toExclusive, step)
}

export function from(from: number) {
    return {
        to: function (to: number): NumberRange {
            return range(from, to)
        }
    }
}

export type NumberObject = { it: number }

export function timer(millis: number, callback: (...args: any[]) => void): TimeOut { return setInterval(callback, millis) }

export function delay(millis: number): Promise<TimeOut> { return new Promise(resolve => setTimeout(() => resolve(), millis)) }

export async function promises(...promises: Array<PromiseLike<any>>): Promise<Array<any>> { return Promise.all(promises) }

export function removeAllSync(...paths: Array<string>) { paths.forEach(it => removeSync(it)) }

export function update<T extends object, K extends keyof T>(original: T, to: Pick<T, K>): T {
    const result: T = original
    for (const key in to) {
        if (to.hasOwnProperty(key) && result.hasOwnProperty(key)) {
            result[key] = to[key]
        }
    }
    return result
}

export const allDays: Array<Day> = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const allTimeUnits: Array<TimeUnit> = ["Minutes", "Hours"]

export function todayDay(): Day { return moment().format("dddd") as Day }