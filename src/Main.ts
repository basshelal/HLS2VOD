import * as electron from "electron"
import {BrowserWindow, IpcMainInvokeEvent} from "electron"
import {Schedule, Show, Stream, StreamEntry} from "./stream/Stream"
import {Database, Settings, Streams} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "./utils/Extensions"
import {Events} from "./Events"
import {getPath} from "./utils/Utils"

Extensions()

let streams: Array<Stream> = []

function findStream(name: string): Stream | undefined { return streams.find(it => it.name === name) }

let browserWindow: BrowserWindow

function handleFromBrowser<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

function sendToBrowser<T>(name: string, args: T) {
    browserWindow.webContents.send(name, args)
}

async function addStream(name: string, playlistUrl: string, schedulePath?: string): Promise<Stream> {
    const settings = await Settings.getAllSettings()
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const schedule: Array<Show> = schedulePath ? await Schedule.fromCSV(schedulePath) : []

    const stream = await Stream.new({
        name: name,
        playlistUrl: playlistUrl,
        scheduledShows: schedule,
        offsetSeconds: offsetSeconds
    })
    await Streams.addStream(stream)
    return stream
}

electron.app.allowRendererProcessReuse = true
electron.app.whenReady().then(async () => {
    browserWindow = new BrowserWindow({
        center: true,
        width: 1200,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    if (process.env.NODE_ENV === "development") {
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log("An error occurred: ", err))
        installExtension(REDUX_DEVTOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log("An error occurred: ", err))
    }

    if (process.env.NODE_ENV === "development") {
        browserWindow.loadURL("http://localhost:4000")
    } else {
        browserWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "renderer/index.html"),
                protocol: "file:",
                slashes: true
            })
        )
    }

    await Database.initialize()
    const dbStreamEntries = await Database.Streams.getAllStreams()
    streams = await Promise.all(dbStreamEntries.map(async (streamEntry) => await Stream.fromStreamEntry(streamEntry)))

    // Default settings
    await Database.Settings.setOutputDirectory(getPath("./Streams"))
    await Database.Settings.setOffsetSeconds(120)

    await addStream(
        "TESTING",
        "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8",
        getPath("res/schedule.csv")
    )

    browserWindow.webContents.once("did-finish-load", async () => {
        // Web contents have loaded
        const streamEntries: Array<StreamEntry> = await Database.Streams.getAllStreams()
        sendToBrowser(Events.GetStreams, streamEntries)
    })

    browserWindow.once("close", async (event: Electron.Event) => {
        event.preventDefault()
        // Finalization code here
        browserWindow.close()
        electron.app.quit()
    })
})

// Start Stream
handleFromBrowser<StreamEntry>(Events.StartStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.start()
        return found.toStreamEntry()
    } else return null
})

// Pause Stream
handleFromBrowser<StreamEntry>(Events.PauseStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.pause()
        return found.toStreamEntry()
    } else return null
})

// Force Record Stream
handleFromBrowser<StreamEntry>(Events.ForceRecordStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.forceRecord()
        return found.toStreamEntry()
    } else return null
})

// UnForce Record Stream
handleFromBrowser<StreamEntry>(Events.UnForceRecordStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.unForceRecord()
        return found.toStreamEntry()
    } else return null
})

// View Stream Dir
handleFromBrowser<StreamEntry>(Events.ViewStreamDir, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        electron.shell.openItem(found.streamDirectory)
        return found.toStreamEntry()
    } else return null
})


handleFromBrowser<StreamEntry>("addStream",
    async (event, streamEntry) => {
        await addStream(streamEntry.name, streamEntry.playlistUrl, streamEntry.schedulePath)
        return streamEntry
    })

handleFromBrowser<Map<string, string>>("saveSettings",
    (event, settings) => {
        const offsetSeconds = parseInt(settings.get("offsetSeconds"))
        const outputDirectory = settings.get("outputDirectory")
        Settings.setOffsetSeconds(offsetSeconds)
        Settings.setOutputDirectory(outputDirectory)
    })

handleFromBrowser(Events.GetStreams, async (event) => {
    return await Database.Streams.getAllStreams()
})