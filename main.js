"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader");
const electron = require("electron");
const stream_1 = require("./stream");
const utils_1 = require("./utils");
const database_1 = require("./database/database");
const moment = require("moment");
var BrowserWindow = electron.BrowserWindow;
let browserWindow;
function onReady() {
    electron.app.allowRendererProcessReuse = true;
    browserWindow = new BrowserWindow({
        center: true,
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    browserWindow.loadFile('layouts/main.html');
}
function onClose() {
    downloader_1.stopAllDownloaders().then(electron.app.quit);
}
electron.app.whenReady().then(onReady);
electron.app.on('window-all-closed', onClose);
electron.ipcMain.on('invokeAction', (event, data) => {
    if (data === "alJazeera") {
        if (!currentDownloading.find(it => it === aljazeeraUrl)) {
            downloader_1.startDownloader(aljazeeraUrl);
            currentDownloading.push(aljazeeraUrl);
        }
    }
    if (data === "alHiwar") {
        if (!currentDownloading.find(it => it === alHiwarUrl)) {
            downloader_1.startDownloader(alHiwarUrl);
            currentDownloading.push(alHiwarUrl);
        }
    }
    if (data === "alAraby") {
        if (!currentDownloading.find(it => it === alArabyUrl)) {
            downloader_1.startDownloader(alArabyUrl);
            currentDownloading.push(alArabyUrl);
        }
    }
});
electron.ipcMain.on("devTools", () => browserWindow.webContents.toggleDevTools());
let currentDownloading = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
stream_1.Schedule.fromCSV("res/schedule.csv").then((schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new stream_1.Stream("AlJazeera", aljazeeraUrl, "res/schedule.csv", schedule, 30);
    // stream.startDownloading()
    database_1.Streams.addNewStream(stream);
    utils_1.print(moment().format(exports.momentFormat));
});
