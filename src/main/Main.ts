import * as electron from "electron"
import {BrowserWindow} from "electron"
import {Database} from "./Database"
import * as path from "path"
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer"
import url from "url"
import {getPath} from "../shared/Utils"
import {RequestHandler} from "./RequestHandler"
import {loadExtensions} from "../shared/Extensions"

loadExtensions()

let mainWindow: BrowserWindow
electron.app.allowRendererProcessReuse = true
electron.app.whenReady().then(onAppReady)

function isDev(): boolean { return process.env.NODE_ENV === "development" }

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

    if (isDev()) {
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

    mainWindow.once("close", async (event: Electron.Event) => {
        event.preventDefault()
        // Finalization code here
        mainWindow.close()
        electron.app.quit()
        process.exit(0)
    })

    await Database.initialize({defaultSettings: {outputDirectory: getPath("Streams"), offsetSeconds: 120}})
    RequestHandler.initialize({browserWindow: mainWindow})

}
