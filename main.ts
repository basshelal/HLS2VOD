import * as electron from "electron";
import {newStream, Schedule, Stream, StreamListener} from "./stream";
import {Settings, SettingsEntryKey, StreamEntry, Streams} from "./database/database";
import extensions from "./extensions";
import * as path from "path";
import {logD} from "./utils";
import BrowserWindow = electron.BrowserWindow;
import IpcMainInvokeEvent = Electron.IpcMainInvokeEvent;

extensions()

let browserWindow: BrowserWindow

function handle<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

function send<T>(name: string, args: T) {
    browserWindow.webContents.send(name, args)
}

electron.app.whenReady().then(async () => {
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
        if (streams.length === 0) {
            addStream(alHiwar)
            streams.push(alHiwar)
        }
        send("displayStreams", streams)
        send("displaySettings", settings)
    })

    browserWindow.once("close", async (event: Electron.Event) => {
        event.preventDefault()
        await Promise.all(activeStreams.map(it => it.stopDownloading()))
        browserWindow.close()
        electron.app.quit()
    })
})

handle<StreamEntry>("addStream", async (event, streamEntry) => {
    await addStream(streamEntry)
    return streamEntry
})

handle<Map<string, string>>("saveSettings", (event, settings) => {
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const outputDirectory = settings.get("outputDirectory")
    Settings.setOffsetSeconds(offsetSeconds)
    Settings.setOutputDirectory(outputDirectory)
})

handle<StreamEntry>("outputButtonClicked", async (event, streamEntry) => {
    const rootDirectory = await Settings.getOutputDirectory()
    electron.shell.openItem(path.join(rootDirectory, streamEntry.name))
})

handle<StreamEntry>("recordingButtonClicked", async (event, streamEntry) => {
    let stream = activeStreams.find(it => it.name === streamEntry.name)
    if (stream) {
        stream.stopDownloading()
        activeStreams.remove(stream)
    } else {
        stream = await addStream(alHiwar)
        await stream.startDownloading()
        activeStreams.push(stream)
    }
})

const activeStreams: Array<Stream> = []

export const momentFormat = "dddd Do MMMM YYYY, HH:mm:ss"
export const momentFormatSafe = "dddd Do MMMM YYYY HH-mm-ss"
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"

const defaultOutputDirectory = path.join(electron.app.getPath("downloads"), "HLS2VOD")
const defaultOffsetSeconds = 120

const schedulePath = path.join(electron.app.getAppPath(), "res/schedule.csv")

const alHiwar: StreamEntry = {
    name: "AlHiwar",
    playlistUrl: alHiwarUrl,
    schedulePath: schedulePath
}

const streamListener: StreamListener = {
    onStarted(stream: Stream) {
        logD(`Started ${stream}`)
        send("streamStarted", stream.toStreamEntry())
    },
    onStopped(stream: Stream) {
        logD(`Stopped ${stream}`)
        send("streamStopped", stream.toStreamEntry())
    },
    onPaused(stream: Stream) {
        logD(`Paused ${stream}`)
        send("streamPaused", stream.toStreamEntry())
    },
    onResumed(stream: Stream) {
        logD(`Resumed ${stream}`)
        send("streamResumed", stream.toStreamEntry())
    },
    onMerging(stream: Stream) {
        logD(`Merging ${stream}`)
        send("streamMerging", stream.toStreamEntry())
    },
    onNewCurrentShow(stream: Stream) {
        logD(`New Current Show ${stream}`)
        const streamEntry = stream.toStreamEntry()
        streamEntry["currentShow"] = stream.currentShow
        streamEntry["nextShow"] = stream.nextShow
        send("streamNewCurrentShow", streamEntry)
    },
}

async function addStream(streamEntry: StreamEntry): Promise<Stream> {
    const settings = await Settings.getAllSettings()
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const outputDirectory = settings.get("outputDirectory")
    const schedule = await Schedule.fromCSV(streamEntry.schedulePath)

    const stream = await newStream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath,
        schedule, offsetSeconds, outputDirectory, streamListener)
    await Streams.addStream(stream)
    return stream
}
