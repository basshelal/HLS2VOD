import {startDownloader, stopAllDownloaders} from "./downloader";
import * as electron from "electron";
import {Schedule, Stream} from "./stream";
import {print} from "./utils";
import {Streams} from "./database/database";
import moment = require("moment");
import BrowserWindow = electron.BrowserWindow;

let browserWindow: BrowserWindow

function onReady() {
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

    browserWindow.loadFile('layouts/home.html')
}

function onClose() {
    stopAllDownloaders().then(electron.app.quit)
}

electron.app.whenReady().then(onReady)

electron.app.on('window-all-closed', onClose)

electron.ipcMain.on('invokeAction', (event, data) => {
    if (data === "alJazeera") {
        if (!currentDownloading.find(it => it === aljazeeraUrl)) {
            startDownloader(aljazeeraUrl)
            currentDownloading.push(aljazeeraUrl)
        }
    }
    if (data === "alHiwar") {
        if (!currentDownloading.find(it => it === alHiwarUrl)) {
            startDownloader(alHiwarUrl)
            currentDownloading.push(alHiwarUrl)
        }
    }
    if (data === "alAraby") {
        if (!currentDownloading.find(it => it === alArabyUrl)) {
            startDownloader(alArabyUrl)
            currentDownloading.push(alArabyUrl)
        }
    }
})

electron.ipcMain.on("devTools", () => browserWindow.webContents.toggleDevTools())

let currentDownloading = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8"
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8"

//TODO make offsetSeconds a global setting!

Schedule.fromCSV("res/schedule.csv").then((schedule: Schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new Stream("AlJazeera", aljazeeraUrl, "res/schedule.csv", schedule, 30)
    // stream.startDownloading()

    Streams.addStream(stream)

    print(moment().format(momentFormat))
})