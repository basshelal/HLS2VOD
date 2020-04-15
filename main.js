"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader");
const electron = require("electron");
const stream_1 = require("./stream");
const utils_1 = require("./utils");
var DateTimeFormat = Intl.DateTimeFormat;
function stop() {
    downloader_1.stopAllDownloaders().then(electron.app.quit);
}
function createWindow() {
    let window = new electron.BrowserWindow({
        center: true,
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    window.loadFile('layouts/main.html');
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
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
stream_1.scheduleFromJson("res/schedule.json").then(schedule => {
    console.log(schedule);
    console.log(schedule[0]);
    console.log(schedule.length);
    console.log(schedule[0].date);
    console.log(schedule[0].date.day);
    console.log(schedule[0].date.time);
    let now = new Date();
    let show = schedule[1];
    utils_1.print(show.date.time.hour);
    utils_1.print(show.date.time.minute);
    let scheduledTime = new Date(2020, 3, 15, show.date.time.hour, show.date.time.minute);
    utils_1.print(scheduledTime.getHours());
    utils_1.print(scheduledTime.getSeconds());
    let dateTimeFormat = DateTimeFormat("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", hour12: false
    });
    utils_1.print(dateTimeFormat.format(now));
    utils_1.print(dateTimeFormat.format(scheduledTime));
});
