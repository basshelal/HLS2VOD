import * as electron from "electron";
import {newStream, Schedule, Stream} from "./stream";
import {StreamEntry, Streams} from "./database/database";
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

    const streams: Array<StreamEntry> = await Streams.getAllStreams()
    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams)
    })
}

function onClose() {
    Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit)
}

electron.app.whenReady().then(onReady)

electron.app.on('window-all-closed', onClose)

electron.ipcMain.handle("addStream", (event, args) => {
    const streamEntry: StreamEntry = args as StreamEntry
    addStream(streamEntry)
})

let activeStreams: Array<Stream> = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8"
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8"

const rootDirectory = "F:/HLS2VOD"
const offsetSeconds = 30

async function addStream(streamEntry: StreamEntry) {
    //  const schedule: Schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    //   const stream = new Stream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, rootDirectory)
    const schedule: Schedule = await Schedule.fromCSV("res/schedule.csv")
    const stream = await newStream(moment().format(momentFormatSafe), aljazeeraUrl, "res/schedule.csv", schedule, offsetSeconds, rootDirectory)

    Streams.addStream(stream)
    activeStreams.push(stream)
}

async function start() {
    const schedule = await Schedule.fromCSV("res/largeschedule.csv")
    const stream = await newStream("AlHiwar", alHiwarUrl, "res/largeschedule.csv", schedule, offsetSeconds, rootDirectory)
    Streams.addStream(stream)
    activeStreams.push(stream)
    stream.startDownloading()
}

start()
