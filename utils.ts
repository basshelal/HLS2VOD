import * as electron from "electron";

export function print(message: any) {
    console.log(message.toString())
}

export function logD(message: any, calledFrom: string = "") {
    if (!electron.app.isPackaged)
        console.log(
            `${message.toString()}
    ${calledFrom}`)
}