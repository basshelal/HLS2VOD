import {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {SerializedStream} from "./Stream"
import {Database, SettingsEntry} from "./Database"
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
    }

    private static handle<T>(name: string, listener: (args: T, event: IpcMainInvokeEvent) => Promise<T> | any) {
        ipcMain.handle(name, (event, args) => listener(args, event))
    }

    public static getAllStreams() {
        this.handle<Array<SerializedStream>>(Requests.GetStreams,
            async (): Promise<Array<SerializedStream>> => await Database.Streams.getAllStreams())
    }

    public static newStream() {
        this.handle<DialogStreamEntry>(Requests.NewStream,
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

    public static getAllSettings() {
        this.handle<Array<SettingsEntry>>(Requests.GetSettings,
            async (): Promise<Array<SettingsEntry>> => {
                return await Database.Settings.getAllSettings()
            })
    }
}