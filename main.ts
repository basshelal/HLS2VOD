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
            //console.log(details.url)
        })
}

function onClose() {
    Promise.all(activeStreams.map(it => it.stopDownloading())).then(electron.app.quit)
}

electron.app.whenReady().then(onReady)

electron.app.on('window-all-closed', onClose)

let activeStreams: Array<Stream> = []

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