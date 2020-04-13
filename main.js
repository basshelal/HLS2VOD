"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader");
const electron = require("electron");
function stop() {
    if (downloader_1.downloader) {
        downloader_1.downloader.stop();
        downloader_1.mergeAll_().then(() => electron.app.quit());
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
    window.loadFile('html/main.html');
}
electron.app.whenReady().then(createWindow);
electron.app.on('window-all-closed', stop);
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
//startDownloader(aljazeeraUrl);
