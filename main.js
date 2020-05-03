"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const stream_1 = require("./stream");
const database_1 = require("./database/database");
const extensions_1 = require("./extensions");
const path = require("path");
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
    const streams = await database_1.Streams.getAllStreams();
    let settings = await database_1.Settings.getAllSettings();
    if (!settings.get("offsetSeconds")) {
        await database_1.Settings.setOffsetSeconds(defaultOffsetSeconds);
        settings = await database_1.Settings.getAllSettings();
    }
    if (!settings.get("outputDirectory")) {
        await database_1.Settings.setOutputDirectory(defaultOutputDirectory);
        settings = await database_1.Settings.getAllSettings();
    }
    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams);
        browserWindow.webContents.send("displaySettings", settings);
        start(settings);
    });
}
async function onClose() {
    console.log(activeStreams.length);
    await Promise.all(activeStreams.map(it => it.stopDownloading()));
    electron.app.quit();
}
electron.app.whenReady().then(onReady);
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
electron.ipcMain.handle("outputButtonClicked", async (event, args) => {
    const streamEntry = args;
    const rootDirectory = await database_1.Settings.getOutputDirectory();
    electron.shell.openItem(path.join(rootDirectory, streamEntry.name));
});
electron.ipcMain.handle("recordingButtonClicked", async (event, args) => {
    const streamEntry = args;
    const stream = activeStreams.find(it => it.name === streamEntry.name);
    if (stream) {
        stream.stopDownloading();
        activeStreams.remove(stream);
    }
    else {
        await start(await database_1.Settings.getAllSettings());
    }
});
const activeStreams = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const defaultOutputDirectory = path.join(__dirname, "Streams");
const defaultOffsetSeconds = 120;
const schedulePath = "res/schedule.csv";
async function addStream(streamEntry) {
    /*const schedule: Schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    const stream = new Stream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, defaultOutputDirectory)

    Streams.addStream(stream)*/
}
async function start(settings) {
    const offsetSeconds = parseInt(settings.get("offsetSeconds"));
    const outputDirectory = settings.get("outputDirectory");
    const schedule = await stream_1.Schedule.fromCSV(schedulePath);
    const stream = await stream_1.newStream("AlHiwar", alHiwarUrl, schedulePath, schedule, offsetSeconds, outputDirectory);
    if (!activeStreams.contains(stream)) {
        await database_1.Streams.addStream(stream);
        activeStreams.push(stream);
        await stream.startDownloading();
    }
}
