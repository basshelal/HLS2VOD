import * as electron from "electron"
import {BrowserWindow, dialog, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {Schedule, Show, Stream, StreamEntry} from "./Stream"
import {Database} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "../shared/utils/Extensions"
import {Events} from "../shared/Events"
import {getPath, json} from "../shared/utils/Utils"
import {StreamData} from "../renderer/ui/components/AddStreamButton"
import {logD} from "../shared/utils/Log"
import {SettingsData} from "../renderer/ui/components/SettingsButton"

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

async function openDirectoryPicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog(browserWindow, {properties: ["openDirectory"]})
}

async function openFilePicker(): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog(browserWindow, {properties: ["openFile"]})
}

async function addStream(name: string, playlistUrl: string, schedulePath?: string): Promise<Stream> {
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

// Add New Stream
handleFromBrowser<StreamData>(Events.NewStream, async (event, streamData: StreamData) => {
    const schedulePath: string = streamData.schedulePath === "" ? undefined : streamData.schedulePath
    const stream: Stream = await addStream(streamData.name, streamData.playlistUrl, schedulePath)
    sendToBrowser(Events.RefreshAllStreams, null)
    return stream.toStreamEntry()
})

// Get Streams
handleFromBrowser(Events.GetStreams, async (event) => {
    return await Database.Streams.getAllStreams()
})

// Browse Schedule
handleFromBrowser(Events.BrowseSchedule, async (event) => {
    const pickerResult = await openFilePicker()
    if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
    else return pickerResult.filePaths[0]
})

// Get All Settings
handleFromBrowser(Events.GetSettings, async (event) => {
    return await Database.Settings.getAllSettings()
})

// Update Settings
handleFromBrowser(Events.UpdateSettings, async (event, settingsData: SettingsData) => {
    await Database.Settings.setOffsetSeconds(settingsData.offsetSeconds)
    await Database.Settings.setOutputDirectory(settingsData.outputDir)
})

// Browse Output Dir
handleFromBrowser(Events.BrowseOutputDir, async (event) => {
    const pickerResult = await openDirectoryPicker()
    logD(json(pickerResult))
    if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
    else return pickerResult.filePaths[0]
})