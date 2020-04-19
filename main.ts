import {startDownloader} from "./downloader/downloader";
import * as electron from "electron";
import {Schedule, Stream} from "./stream";
import {Streams} from "./database/database";
import BrowserWindow = electron.BrowserWindow;
import OnCompletedListenerDetails = electron.OnCompletedListenerDetails;

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
    browserWindow.on("close", onClose)
    browserWindow.loadFile('layouts/home/home.html')

    electron.session.defaultSession.webRequest.onCompleted(
        (details: OnCompletedListenerDetails) => {
            console.log(details.url)
        })

}

function onClose() {
    Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit)
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

electron.ipcMain.on('buttonClick', (event, data) => {
    if (data === "addStream") {
        browserWindow.webContents.send("message", "ass")
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
        })
        addNewStreamWindow.removeMenu()
        addNewStreamWindow.on("blur", () => {
            browserWindow.webContents.send("modalClosed")
            addNewStreamWindow.close()
        })
        addNewStreamWindow.loadFile("layouts/add_stream/add_stream.html")
    }
})

let activeStreams: Array<Stream> = []

let currentDownloading = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8"
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8"

const rootDirectory = "C:/Users/bassh/Desktop/HLS2VOD"

Schedule.fromCSV("res/schedule.csv").then((schedule: Schedule) => {
    //console.log(JSON.stringify(schedule, null, 1))
    let stream = new Stream("AlJazeera", aljazeeraUrl, "res/schedule.csv", schedule, 30, rootDirectory)
    // stream.startDownloading()

    Streams.addStream(stream)
    stream.initialize()
    // .then(() => stream.startDownloading())
    activeStreams.push(stream)
})