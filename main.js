"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader");
const electron = require("electron");
const stream_1 = require("./stream");
const utils_1 = require("./utils");
var DateTimeFormat = Intl.DateTimeFormat;
var BrowserWindow = electron.BrowserWindow;
function stop() {
    downloader_1.stopAllDownloaders().then(electron.app.quit);
}
let browserWindow;
function createWindow() {
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
electron.app.allowRendererProcessReuse = true;
electron.app.whenReady().then(createWindow);
electron.app.on('window-all-closed', stop);
let currentDownloading = [];
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
electron.ipcMain.on("devTools", (event, data) => {
    browserWindow.webContents.toggleDevTools();
});
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
stream_1.Schedule.fromCSV("res/schedule.csv").then(schedule => {
    console.log(JSON.stringify(schedule, null, 2));
    console.log(schedule[0]);
    console.log(schedule.length);
    console.log(schedule[0].day);
    console.log(schedule[0].hour);
    console.log(schedule[0].minute);
    let now = new Date();
    let show = schedule[1];
    utils_1.print(show.hour);
    utils_1.print(show.minute);
    let dateTimeFormat = DateTimeFormat("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", hour12: false
    });
    utils_1.print(dateTimeFormat.format(now));
});
