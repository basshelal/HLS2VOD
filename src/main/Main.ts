import * as electron from "electron"
import {BrowserWindow, dialog, IpcMainInvokeEvent, session} from "electron"
import {Schedule, Show, Stream, StreamEntry} from "./Stream"
import {Database} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "../shared/Extensions"
import {Requests} from "../shared/Requests"
import {getPath, json} from "../shared/Utils"
import {logD} from "../shared/Log"
import {SettingsData} from "../renderer/ui/components/SettingsButton"
import {RequestHandler} from "./RequestHandler"

Extensions()

let streams: Array<Stream> = []

function findStream(name: string): Stream | undefined { return streams.find(it => it.name === name) }

let browserWindow: BrowserWindow

function handleFromBrowser<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

// TODO: This is ugly! Fix!
export async function addStream(name: string, playlistUrl: string, schedulePath?: string): Promise<Stream> {
    const offsetSeconds = await Database.Settings.getOffsetSeconds()
    const schedule: Array<Show> = schedulePath ? await Schedule.fromCSV(schedulePath) : []

    const stream = await Stream.new({
        name: name,
        playlistUrl: playlistUrl,
        scheduledShows: schedule,
        offsetSeconds: offsetSeconds
    })
    await Database.Streams.addStream(stream)
    if (!findStream(stream.name)) streams.push(stream)
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
    RequestHandler.browserWindow = browserWindow
    RequestHandler.initializeMainHandles()
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
        session.defaultSession.webRequest.onBeforeRequest({urls: ["*://*/*"]}, (details, callback) => {
            logD(json(details))
            callback({})
        })
    } else {
        logD("Loading html")
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

    browserWindow.once("close", async (event: Electron.Event) => {
        event.preventDefault()
        // Finalization code here
        browserWindow.close()
        electron.app.quit()
    })
})

// Start Stream
handleFromBrowser<StreamEntry>(Requests.StartStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.start()
        return found.toStreamEntry()
    } else return null
})

// Pause Stream
handleFromBrowser<StreamEntry>(Requests.PauseStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.pause()
        return found.toStreamEntry()
    } else return null
})

// Force Record Stream
handleFromBrowser<StreamEntry>(Requests.ForceRecordStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.forceRecord()
        return found.toStreamEntry()
    } else return null
})

// UnForce Record Stream
handleFromBrowser<StreamEntry>(Requests.UnForceRecordStream, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        await found.unForceRecord()
        return found.toStreamEntry()
    } else return null
})

// View Stream Dir
handleFromBrowser<StreamEntry>(Requests.ViewStreamDir, async (event, streamEntry: StreamEntry) => {
    const found = findStream(streamEntry.name)
    if (found) {
        electron.shell.openItem(found.streamDirectory)
        return found.toStreamEntry()
    } else return null
})

// Browse Schedule
handleFromBrowser(Requests.BrowseSchedule, async (event) => {
    const pickerResult = await dialog.showOpenDialog(browserWindow, {properties: ["openFile"]})
    if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
    else return pickerResult.filePaths[0]
})

// Update Settings
handleFromBrowser(Requests.UpdateSettings, async (event, settingsData: SettingsData) => {
    await Database.Settings.setOffsetSeconds(settingsData.offsetSeconds)
    await Database.Settings.setOutputDirectory(settingsData.outputDir)
})