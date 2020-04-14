"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader");
const electron = require("electron");
function stop() {
    if (downloader_1.downloader) {
        downloader_1.downloader.stop();
        downloader_1.mergeAll().then(() => electron.app.quit());
    }
    else
        electron.app.quit();
}
function createWindow() {
    let window = new electron.BrowserWindow({
        center: true,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    window.loadFile('layouts/main.html');
}
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
