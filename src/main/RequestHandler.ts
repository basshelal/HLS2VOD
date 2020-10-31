import {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {SerializedStream} from "./models/Stream"
import {AllSettings, Database} from "./Database"
import {DialogStreamEntry} from "../renderer/ui/components/AddStreamDialog"
import {Requests} from "../shared/Requests"
import {addStream} from "./Main"

export class RequestHandler {
    private constructor() {}

    public static browserWindow: BrowserWindow

    /** Initialize and set all handles for main, ie events from renderer to be handled by main */
    public static initializeMainHandles() {
        this.getAllStreams()
        this.newStream()
        this.browseOutputDir()
        this.browseSchedule()
        this.getAllSettings()
        this.updateSettings()
    }

    private static handle<T>(name: string, listener: (args: T, event: IpcMainInvokeEvent) => Promise<T> | any) {
        ipcMain.handle(name, (event, args) => listener(args, event))
    }

    public static getAllStreams() {
        this.handle(Requests.GetStreams,
            async (): Promise<Array<SerializedStream>> => await Database.Streams.getAllStreams())
    }

    public static newStream() {
        this.handle(Requests.NewStream,
            async (streamEntry: DialogStreamEntry): Promise<boolean> => {
                const schedulePath: string | undefined = streamEntry.schedulePath === "" ? undefined : streamEntry.schedulePath
                await addStream(streamEntry.streamName, streamEntry.playlistUrl, schedulePath)
                return true
            })
    }

    public static browseOutputDir() {
        this.handle(Requests.BrowseOutputDir,
            async (): Promise<string | undefined> => {
                const pickerResult: OpenDialogReturnValue = await dialog.showOpenDialog(
                    this.browserWindow, {properties: ["openDirectory"]}
                )
                if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
                else return pickerResult.filePaths.first()
            })
    }

    public static browseSchedule() {
        this.handle(Requests.BrowseSchedule,
            async (): Promise<string | undefined> => {
                const pickerResult = await dialog.showOpenDialog(this.browserWindow, {properties: ["openFile"]})
                if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
                else return pickerResult.filePaths[0]
            })
    }

    public static getAllSettings() {
        this.handle(Requests.GetSettings,
            async (): Promise<AllSettings> => {
                return await Database.Settings.getAllSettings()
            })
    }

    public static updateSettings() {
        this.handle(Requests.UpdateSettings,
            async (allSettings: AllSettings): Promise<void> => {
                return await Database.Settings.updateSettings(allSettings)
            })
    }
}