"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const stream_1 = require("./stream");
const database_1 = require("./database/database");
const extensions_1 = require("./extensions");
const path = require("path");
const utils_1 = require("./utils");
var BrowserWindow = electron.BrowserWindow;
extensions_1.default();
let browserWindow;
function handle(name, listener) {
    electron.ipcMain.handle(name, listener);
}
function send(name, args) {
    browserWindow.webContents.send(name, args);
}
electron.app.whenReady().then(async () => {
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
        if (streams.length === 0) {
            addStream(alHiwar);
            streams.push(alHiwar);
        }
        send("displayStreams", streams);
        send("displaySettings", settings);
    });
    browserWindow.once("close", async (event) => {
        event.preventDefault();
        await Promise.all(activeStreams.map(it => it.stopDownloading()));
        browserWindow.close();
        electron.app.quit();
    });
});
handle("addStream", async (event, streamEntry) => {
    await addStream(streamEntry);
    return streamEntry;
});
handle("saveSettings", (event, settings) => {
    const offsetSeconds = parseInt(settings.get("offsetSeconds"));
    const outputDirectory = settings.get("outputDirectory");
    database_1.Settings.setOffsetSeconds(offsetSeconds);
    database_1.Settings.setOutputDirectory(outputDirectory);
});
handle("outputButtonClicked", async (event, streamEntry) => {
    const rootDirectory = await database_1.Settings.getOutputDirectory();
    electron.shell.openItem(path.join(rootDirectory, streamEntry.name));
});
handle("recordingButtonClicked", async (event, streamEntry) => {
    let stream = activeStreams.find(it => it.name === streamEntry.name);
    if (stream) {
        stream.stopDownloading();
        activeStreams.remove(stream);
    }
    else {
        stream = await addStream(alHiwar);
        await stream.startDownloading();
        activeStreams.push(stream);
    }
});
const activeStreams = [];
exports.momentFormat = "dddd Do MMMM YYYY, HH:mm:ss";
exports.momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss";
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const defaultOutputDirectory = path.join(__dirname, "Streams");
const defaultOffsetSeconds = 120;
const schedulePath = "res/schedule.csv";
const alHiwar = {
    name: "AlHiwar",
    playlistUrl: alHiwarUrl,
    schedulePath: schedulePath
};
const streamListener = {
    onStarted(stream) {
        utils_1.logD(`Started ${stream}`);
        send("streamStarted", stream.toStreamEntry());
    },
    onStopped(stream) {
        utils_1.logD(`Stopped ${stream}`);
        send("streamStopped", stream.toStreamEntry());
    },
    onPaused(stream) {
        utils_1.logD(`Paused ${stream}`);
        send("streamPaused", stream.toStreamEntry());
    },
    onResumed(stream) {
        utils_1.logD(`Resumed ${stream}`);
        send("streamResumed", stream.toStreamEntry());
    },
    onMerging(stream) {
        utils_1.logD(`Merging ${stream}`);
        send("streamMerging", stream.toStreamEntry());
    },
    onNewCurrentShow(stream) {
        utils_1.logD(`New Current Show ${stream}`);
        const streamEntry = stream.toStreamEntry();
        streamEntry["currentShow"] = stream.currentShow;
        streamEntry["nextShow"] = stream.nextShow;
        send("streamNewCurrentShow", streamEntry);
    },
};
async function addStream(streamEntry) {
    const settings = await database_1.Settings.getAllSettings();
    const offsetSeconds = parseInt(settings.get("offsetSeconds"));
    const outputDirectory = settings.get("outputDirectory");
    const schedule = await stream_1.Schedule.fromCSV(streamEntry.schedulePath);
    const stream = await stream_1.newStream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, outputDirectory, streamListener);
    await database_1.Streams.addStream(stream);
    return stream;
}
