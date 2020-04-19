"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader/downloader");
const electron = require("electron");
const stream_1 = require("./stream");
const database_1 = require("./database/database");
var BrowserWindow = electron.BrowserWindow;
let browserWindow;
function onReady() {
    electron.app.allowRendererProcessReuse = true;
    browserWindow = new BrowserWindow({
        center: true,
        width: 1200,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    browserWindow.on("close", onClose);
    browserWindow.loadFile('layouts/home/home.html');
    electron.session.defaultSession.webRequest.onCompleted((details) => {
        console.log(details.url);
    });
}
function onClose() {
    Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit);
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
electron.ipcMain.on('buttonClick', (event, data) => {
    if (data === "addStream") {
        browserWindow.webContents.send("message", "ass");
        const addNewStreamWindow = new BrowserWindow({
            modal: true,
            center: true,
            width: 800,
            height: 300,
            autoHideMenuBar: true,
            frame: false,
            skipTaskbar: true,
            movable: false,
            resizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        });
        addNewStreamWindow.removeMenu();
        addNewStreamWindow.on("blur", () => {
            browserWindow.webContents.send("modalClosed");
            addNewStreamWindow.close();
        });
        addNewStreamWindow.loadFile("layouts/add_stream/add_stream.html");
    }
});
let activeStreams = [];
let currentDownloading = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
const rootDirectory = "C:/Users/bassh/Desktop/HLS2VOD";
stream_1.Schedule.fromCSV("res/schedule.csv").then((schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new stream_1.Stream("AlJazeera", aljazeeraUrl, "res/schedule.csv", schedule, 30, rootDirectory);
    // stream.startDownloading()
    database_1.Streams.addStream(stream);
    stream.initialize();
    // .then(() => stream.startDownloading())
    activeStreams.push(stream);
});
