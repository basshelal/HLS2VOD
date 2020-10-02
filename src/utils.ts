import * as electron from "electron";
import * as path from "path";

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"

export function getPath(pathString: string): string {
    return path.join(electron.app.getAppPath(), pathString)
}

export function logD(message: any, calledFrom: string = "") {
    if (!electron.app.isPackaged)
        console.log(
            `${message.toString()}
    ${calledFrom}`)
}

export function logE(message: any, calledFrom: string = "") {
    if (!electron.app.isPackaged)
        console.error(
            `${message.toString()}
    ${calledFrom}`)
}

export function assert(condition: boolean, message: string) {
    if (!electron.app.isPackaged)
        console.assert(condition, message)
}