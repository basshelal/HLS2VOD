import * as electron from "electron"
import {BrowserWindow, IpcMainInvokeEvent} from "electron"
import {Schedule, Stream} from "./stream/Stream"
import {Database, Settings, StreamEntry, Streams} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "./utils/Extensions"
import {logD} from "./utils/Log"

Extensions()

const activeStreams: Array<Stream> = []
const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"

const schedulePath = path.join(electron.app.getAppPath(), "res/schedule.csv")

const alHiwar: StreamEntry = {
    name: "AlHiwar",
    playlistUrl: alHiwarUrl,
    schedulePath: schedulePath
}

let browserWindow: BrowserWindow

function handle<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

function send<T>(name: string, args: T) {
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

function startElectronApp() {
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

        browserWindow.webContents.once("did-finish-load", () => {
            logD("Finished Loading!")
        })

        browserWindow.once("close", async (event: Electron.Event) => {
            event.preventDefault()
            // Finalization code here
            browserWindow.close()
            electron.app.quit()
        })
    })

    handle<StreamEntry>("addStream",
        async (event, streamEntry) => {
            await addStream(streamEntry)
            return streamEntry
        })

    handle<Map<string, string>>("saveSettings",
        (event, settings) => {
            const offsetSeconds = parseInt(settings.get("offsetSeconds"))
            const outputDirectory = settings.get("outputDirectory")
            Settings.setOffsetSeconds(offsetSeconds)
            Settings.setOutputDirectory(outputDirectory)
        })

    handle<StreamEntry>("outputButtonClicked",
        async (event, streamEntry) => {
            const rootDirectory = await Settings.getOutputDirectory()
            electron.shell.openItem(path.join(rootDirectory, streamEntry.name))
        })

    handle<StreamEntry>("recordingButtonClicked",
        async (event, streamEntry) => {
            let stream = activeStreams.find(it => it.name === streamEntry.name)
            if (stream) {
                stream.stopDownloading()
                activeStreams.remove(stream)
            } else {
                stream = await addStream(alHiwar)
                await stream.start()
                activeStreams.push(stream)
            }
        })
}

startElectronApp()