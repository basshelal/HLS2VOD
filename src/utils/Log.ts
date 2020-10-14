import {json, now} from "./Utils"
import chalk from "chalk"
import {AssertionError} from "assert"

export type LogFunction = (message: any, calledFrom: Function) => void

const emptyLogFunction: LogFunction = () => {}

export interface LogOptions {
    enabled: boolean,
    beforeLog: LogFunction,
    afterLog: LogFunction
}

export const logOptions: LogOptions = {
    enabled: true,
    beforeLog: emptyLogFunction,
    afterLog: emptyLogFunction
}

function log(logFunction: Function) {
    if (logOptions.enabled) {
        logOptions.beforeLog()
        logFunction()
        logOptions.afterLog()
    }
}

export function logD(message: any, calledFrom: string = "") {
    log(() => {
        console.debug(`${now()}\n` +
            chalk.blueBright(`${message.toString()}\n`)
        )
    })
}

export function logW(message: any, calledFrom: string = "") {
    log(() => {
        console.warn(`${now()}\n` +
            chalk.yellowBright(`${message.toString()}\n`)
        )
    })
}

export function logI(message: any, calledFrom: string = "") {
    log(() => {
        console.info(`${now()}\n` +
            chalk.whiteBright(`${message.toString()}\n`)
        )
    })
}

export function logE(message: any, calledFrom: string = "") {
    log(() => {
        console.error(`${now()}\n` +
            chalk.red(`${message.toString()}\n`)
        )
    })
}

export function assert(condition: boolean, message: string, args?: IArguments, func?: Function) {
    if (logOptions.enabled && !condition) {
        logE(`Assertion Error${func ? ` at ${func.name}` : ``}!\n${message}\nargs:\n${json(args)}\n`)
        throw new AssertionError({message: ``, stackStartFn: func})
    }
}
