import * as electron from "electron";
import {newStream, Schedule, Stream} from "./stream";
import {Settings, StreamEntry, Streams} from "./database/database";
import extensions from "./extensions";
import moment = require("moment");
import BrowserWindow = electron.BrowserWindow;

extensions()

let browserWindow: BrowserWindow

async function onReady() {
    electron.app.allowRendererProcessReuse = true
    browserWindow = new BrowserWindow({
        center: true,
        width: 1200,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    browserWindow.on("close", onClose)
    browserWindow.loadFile('layouts/home/home.html')

    await Settings.setOffsetSeconds(offsetSeconds)
    await Settings.setOutputDirectory(rootDirectory)
    const streams: Array<StreamEntry> = await Streams.getAllStreams()
    const settings: Map<string, string> = await Settings.getAllSettingsMapped()
    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams)
        browserWindow.webContents.send("displaySettings", settings)
    })
}

function onClose() {
    //  Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit)
}

electron.app.whenReady().then(onReady)

electron.app.on('window-all-closed', onClose)

electron.ipcMain.handle("addStream", (event, args) => {
    const streamEntry: StreamEntry = args as StreamEntry
    addStream(streamEntry)
})

electron.ipcMain.handle("saveSettings", (event, args) => {
    const settings = args as Map<string, string>
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const outputDirectory = settings.get("outputDirectory")
    Settings.setOffsetSeconds(offsetSeconds)
    Settings.setOutputDirectory(outputDirectory)
})

const activeStreams: Array<Stream> = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8"
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8"

const rootDirectory = "F:/HLS2VOD"
const offsetSeconds = 120

async function addStream(streamEntry: StreamEntry) {
    //  const schedule: Schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    //   const stream = new Stream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, rootDirectory)
    const schedule: Schedule = await Schedule.fromCSV("res/schedule.csv")
    const stream = await newStream(moment().format(momentFormatSafe), aljazeeraUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory)

    Streams.addStream(stream)
    activeStreams.push(stream)
}

async function start() {
    const schedule = await Schedule.fromCSV("res/schedule.csv")
    const stream = await newStream("AlHiwar", alHiwarUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory)
    Streams.addStream(stream)
    activeStreams.push(stream)
    //  await stream.startDownloading()
}

start()
