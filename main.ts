import {startDownloader, stopAllDownloaders} from "./downloader";
import * as electron from "electron";
import {Schedule, Stream} from "./stream";
import {print} from "./utils";
import moment = require("moment");
import BrowserWindow = electron.BrowserWindow;

function stop() {
    stopAllDownloaders().then(electron.app.quit)
}

let browserWindow: BrowserWindow

function createWindow() {
    electron.app.allowRendererProcessReuse = true
    browserWindow = new BrowserWindow({
        center: true,
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    browserWindow.loadFile('layouts/main.html')
}

electron.app.whenReady().then(createWindow)

electron.app.on('window-all-closed', stop)

let currentDownloading = []

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
});

electron.ipcMain.on("devTools", (event, data) => {
    browserWindow.webContents.toggleDevTools()
})

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";

Schedule.fromCSV("res/schedule.csv").then((schedule: Schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new Stream("AlJazeera", aljazeeraUrl, schedule)
    stream.startDownloading()

    print(moment().format(momentFormat))
})