import * as electron from "electron"
import {BrowserWindow, IpcMainInvokeEvent} from "electron"
import {Schedule, Stream, StreamEntry} from "./stream/Stream"
import {Database, Settings, Streams} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "./utils/Extensions"
import {Events} from "./Events"

Extensions()

let browserWindow: BrowserWindow

function handleFromBrowser<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

function sendToBrowser<T>(name: string, args: T) {
    browserWindow.webContents.send(name, args)
}

async function addStream(streamEntry: StreamEntry): Promise<Stream> {
    const settings = await Settings.getAllSettings()
    const offsetSeconds = parseInt(settings.get("offsetSeconds"))
    const schedule = await Schedule.fromCSV(streamEntry.schedulePath)

    const stream = await Stream.new({
        name: streamEntry.name,
        playlistUrl: streamEntry.playlistUrl,
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

    /*await addStream({
        name: "NEW",
        playlistUrl: "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8",
        schedulePath: getPath("res/schedule.csv")
    })*/

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

handleFromBrowser<StreamEntry>("addStream",
    async (event, streamEntry) => {
        await addStream(streamEntry)
        return streamEntry
    })

handleFromBrowser<Map<string, string>>("saveSettings",
    (event, settings) => {
        const offsetSeconds = parseInt(settings.get("offsetSeconds"))
        const outputDirectory = settings.get("outputDirectory")
        Settings.setOffsetSeconds(offsetSeconds)
        Settings.setOutputDirectory(outputDirectory)
    })

handleFromBrowser<StreamEntry>("outputButtonClicked",
    async (event, streamEntry) => {
        const rootDirectory = await Settings.getOutputDirectory()
        electron.shell.openItem(path.join(rootDirectory, streamEntry.name))
    })

handleFromBrowser(Events.GetStreams, async (event) => {
    return await Database.Streams.getAllStreams()
})