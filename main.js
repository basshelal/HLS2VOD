"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const stream_1 = require("./stream");
const database_1 = require("./database/database");
const extensions_1 = require("./extensions");
const moment = require("moment");
var BrowserWindow = electron.BrowserWindow;
extensions_1.default();
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
    await database_1.Settings.setOffsetSeconds(offsetSeconds);
    await database_1.Settings.setOutputDirectory(rootDirectory);
    const streams = await database_1.Streams.getAllStreams();
    const settings = await database_1.Settings.getAllSettingsMapped();
    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams);
        browserWindow.webContents.send("displaySettings", settings);
    });
}
function onClose() {
    //  Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit)
}
electron.app.whenReady().then(onReady);
electron.app.on('window-all-closed', onClose);
electron.ipcMain.handle("addStream", (event, args) => {
    const streamEntry = args;
    addStream(streamEntry);
});
electron.ipcMain.handle("saveSettings", (event, args) => {
    const settings = args;
    const offsetSeconds = parseInt(settings.get("offsetSeconds"));
    const outputDirectory = settings.get("outputDirectory");
    database_1.Settings.setOffsetSeconds(offsetSeconds);
    database_1.Settings.setOutputDirectory(outputDirectory);
});
const activeStreams = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";
const rootDirectory = "F:/HLS2VOD";
const offsetSeconds = 120;
async function addStream(streamEntry) {
    //  const schedule: Schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    //   const stream = new Stream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, rootDirectory)
    const schedule = await stream_1.Schedule.fromCSV("res/schedule.csv");
    const stream = await stream_1.newStream(moment().format(exports.momentFormatSafe), aljazeeraUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory);
    database_1.Streams.addStream(stream);
    activeStreams.push(stream);
}
async function start() {
    const schedule = await stream_1.Schedule.fromCSV("res/schedule.csv");
    const stream = await stream_1.newStream("AlHiwar", alHiwarUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory);
    database_1.Streams.addStream(stream);
    activeStreams.push(stream);
    //  await stream.startDownloading()
}
start();
