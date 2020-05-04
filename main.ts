import * as electron from "electron";
import {newStream, Schedule, Stream} from "./stream";
import {Settings, SettingsEntryKey, StreamEntry, Streams} from "./database/database";
import extensions from "./extensions";
import * as path from "path";
import {logD} from "./utils";
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
    let settings: Map<SettingsEntryKey, string> = await Settings.getAllSettings()

    if (!settings.get("offsetSeconds")) {
        await Settings.setOffsetSeconds(defaultOffsetSeconds)
        settings = await Settings.getAllSettings()
    }
    if (!settings.get("outputDirectory")) {
        await Settings.setOutputDirectory(defaultOutputDirectory)
        settings = await Settings.getAllSettings()
    }

    browserWindow.webContents.once("did-finish-load", () => {
        browserWindow.webContents.send("displayStreams", streams)
        browserWindow.webContents.send("displaySettings", settings)
        start()
    })
}

async function onClose() {
    await Promise.all(activeStreams.map(it => it.stopDownloading()))
    electron.app.quit()
}

electron.app.whenReady().then(onReady)

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

electron.ipcMain.handle("outputButtonClicked", async (event, args) => {
    const streamEntry = args as StreamEntry
    const rootDirectory = await Settings.getOutputDirectory()
    electron.shell.openItem(path.join(rootDirectory, streamEntry.name))
})

electron.ipcMain.handle("recordingButtonClicked", async (event, args) => {
    const streamEntry = args as StreamEntry
    const stream = activeStreams.find(it => it.name === streamEntry.name)
    if (stream) {
        stream.stopDownloading()
        activeStreams.remove(stream)
    } else {
        await start()
    }
})

const activeStreams: Array<Stream> = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"

const defaultOutputDirectory = path.join(__dirname, "Streams")
const defaultOffsetSeconds = 120

const schedulePath = "res/schedule.csv"

const alHiwar: StreamEntry = {
    name: "AlHiwar",
    playlistUrl: alHiwarUrl,
    schedulePath: schedulePath
}

async function addStream(streamEntry: StreamEntry) {
    const settings = await Settings.getAllSettings()
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const outputDirectory = settings.get("outputDirectory")
    const schedule = await Schedule.fromCSV(streamEntry.schedulePath)
    const stream = await newStream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath, schedule, offsetSeconds, outputDirectory)

    stream.addStreamListener({
        onStarted(stream: Stream) {
            logD(`Started ${stream}`)
        },
        onStopped(stream: Stream) {
            logD(`Stopped ${stream}`)
        },
        onPaused(stream: Stream) {
            logD(`Paused ${stream}`)
        },
        onResumed(stream: Stream) {
            logD(`Resumed ${stream}`)
        },
        onMerging(stream: Stream) {
            logD(`Merging ${stream}`)
        },
        onNewCurrentShow(stream: Stream) {
            logD(`New Current Show ${stream}`)
        },
    })
    if (stream.notIn(activeStreams)) {
        await Streams.addStream(stream)
        activeStreams.push(stream)
        await stream.startDownloading()
    }
}

async function start() {
    addStream(alHiwar)
}
