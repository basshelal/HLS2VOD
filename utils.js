"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
function print(message) {
    console.log(message.toString());
}
exports.print = print;
function logD(message, calledFrom = "") {
    if (!electron.app.isPackaged)
        console.log(`${message.toString()}
    ${calledFrom}`);
}
exports.logD = logD;
