import * as electron from "electron"
import {BrowserWindow, IpcMainInvokeEvent, session} from "electron"
import {Stream} from "./models/Stream"
import {Database} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import Extensions from "../shared/Extensions"
import {getPath} from "../shared/Utils"
import {logD} from "../shared/Log"
import {RequestHandler} from "./RequestHandler"
import {Show} from "./models/Show"
import {Schedule} from "./models/Schedule"

Extensions()

let streams: Array<Stream> = []

function findStream(name: string): Stream | undefined { return streams.find(it => it.name === name) }

let mainWindow: BrowserWindow
electron.app.allowRendererProcessReuse = true
electron.app.whenReady().then(onAppReady)

function handleFromBrowser<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
    electron.ipcMain.handle(name, listener)
}

function isDevEnv(): boolean { return process.env.NODE_ENV === "development" }

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

async function onAppReady(): Promise<void> {
    mainWindow = new BrowserWindow({
        center: true,
        width: 1200,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    RequestHandler.initialize({browserWindow: mainWindow})

    if (isDevEnv()) {
        installExtension(REACT_DEVELOPER_TOOLS)
        installExtension(REDUX_DEVTOOLS)
        mainWindow.loadURL("http://localhost:4000")
    } else {
        mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, "renderer/index.html"),
                protocol: "file:",
                slashes: true
            })
        )
    }

    await Database.initialize()
    const dbStreamEntries = await Database.Streams.getAllSerializedStreams()
    streams = await Promise.all(dbStreamEntries.map(async (streamEntry) => await Stream.fromSerializedStream(streamEntry)))

    // Default settings
    await Database.Settings.setOutputDirectory(getPath("./Streams"))
    await Database.Settings.setOffsetSeconds(120)

    mainWindow.once("close", async (event: Electron.Event) => {
        event.preventDefault()
        // Finalization code here
        mainWindow.close()
        electron.app.quit()
        process.exit(0)
    })
}

// Web request testing stuff
function testWebRequest() {
    let masterPlaylist: string
    session.defaultSession.webRequest.onBeforeRequest({
        urls: [
            "http://*/*.m3u8",
            "https://*/*.m3u8",
            "http://*/*.m3u8?*",
            "https://*/*.m3u8?*"]
    }, (details, callback) => {
        if (!masterPlaylist) masterPlaylist = details.url
        logD(masterPlaylist)
        // detach listener now
        session.defaultSession.webRequest.onBeforeRequest(null)
        // The very first .m3u8 request will be the master playlist, we can remove the webRequest listener after that
        // callback({}) // We don't need this because we only need to run once!
    })

    // Must have autoplay, though most do
    const streamUrl = "https://www.aljazeera.com/live/"
    // Using an invisible window will simulate a visit
    const invisibleWindow = new BrowserWindow({
        show: false, width: 0, height: 0
    })
    invisibleWindow.loadURL(streamUrl)
    invisibleWindow.webContents.setAudioMuted(true)
}
