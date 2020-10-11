import * as electron from "electron"
import {BrowserWindow, IpcMainInvokeEvent} from "electron"
import {Schedule, Stream, StreamListener} from "./Stream"
import {Settings, SettingsEntryKey, StreamEntry, Streams} from "./Database"
import extensions from "./Extensions"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import {logD} from "./Log"

extensions()

const activeStreams: Array<Stream> = []
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
    }
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
    const outputDirectory = settings.get("outputDirectory")
    const schedule = await Schedule.fromCSV(streamEntry.schedulePath)

    const stream = await Stream.new({
        name: streamEntry.name,
        playlistUrl: streamEntry.playlistUrl,
        schedulePath: streamEntry.schedulePath,
        schedule: schedule,
        offsetSeconds: offsetSeconds,
        rootDirectory: outputDirectory,
        listener: streamListener
    })
    await Streams.addStream(stream)
    return stream
}

function startElectronApp() {
    electron.app.whenReady().then(async () => {
        electron.app.allowRendererProcessReuse = true
        browserWindow = new BrowserWindow({
            backgroundColor: "#0e0e0e",
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

        // browserWindow.loadFile(getPath("./src/layouts/home/home.html"))

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
                await stream.startDownloading()
                activeStreams.push(stream)
            }
        })
}

startElectronApp()