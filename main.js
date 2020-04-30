"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const stream_1 = require("./stream");
const database_1 = require("./database/database");
const moment = require("moment");
var BrowserWindow = electron.BrowserWindow;
let browserWindow;
async function onReady() {
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
    const streams = await database_1.Streams.getAllStreams();
    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams);
    });
}
function onClose() {
    Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit);
}
electron.app.whenReady().then(onReady);
electron.app.on('window-all-closed', onClose);
electron.ipcMain.handle("addStream", (event, args) => {
    const streamEntry = args;
    addStream(streamEntry);
});
let activeStreams = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
const rootDirectory = "C:/Users/bassh/Desktop/HLS2VOD";
const offsetSeconds = 30;
async function addStream(streamEntry) {
    //  const schedule: Schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    //   const stream = new Stream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, rootDirectory)
    const schedule = await stream_1.Schedule.fromCSV("res/schedule.csv");
    let stream = new stream_1.Stream(moment().format(exports.momentFormatSafe), aljazeeraUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory);
    database_1.Streams.addStream(stream);
    stream.initialize();
    activeStreams.push(stream);
}
stream_1.Schedule.fromCSV("res/schedule.csv").then((schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new stream_1.Stream("AlJazeera", aljazeeraUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory);
    // stream.startDownloading()
    database_1.Streams.addStream(stream);
    stream.initialize();
    // .then(() => stream.startDownloading())
    activeStreams.push(stream);
});
