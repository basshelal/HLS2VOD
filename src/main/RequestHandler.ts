import electron, {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {AllSettings, Database} from "./Database"
import {DialogStreamEntry} from "../renderer/ui/components/AddStreamDialog"
import {Requests} from "../shared/Requests"
import {addStream} from "./Main"
import {SerializedStream} from "../shared/Serialized"
import {Stream} from "./models/Stream"

export class RequestHandler {
    private constructor() {}

    public static browserWindow: BrowserWindow

    /** Initialize and set all handles for main, ie events from renderer to be handled by main */
    public static initialize({browserWindow}: { browserWindow: BrowserWindow }) {
        this.browserWindow = browserWindow
        this.handle(Requests.GetStreams, this.getAllStreams.bind(this))
        this.handle(Requests.NewStream, this.newStream.bind(this))
        this.handle(Requests.BrowseOutputDir, this.browseOutputDir.bind(this))
        this.handle(Requests.BrowseSchedule, this.browseSchedule.bind(this))
        this.handle(Requests.GetSettings, this.getAllSettings.bind(this))
        this.handle(Requests.UpdateSettings, this.updateSettings.bind(this))
        this.handle(Requests.StartStream, this.startStream.bind(this))
        this.handle(Requests.PauseStream, this.pauseStream.bind(this))
        this.handle(Requests.ForceRecordStream, this.forceRecordStream.bind(this))
        this.handle(Requests.UnForceRecordStream, this.unForceRecordStream.bind(this))
        this.handle(Requests.ViewStreamDir, this.viewStreamDir.bind(this))
    }

    private static handle<T, R>(name: string, listener: (args: T, event: IpcMainInvokeEvent) => Promise<R> | R) {
        ipcMain.handle(name, (event, args) => listener(args, event))
    }

    public static async getAllStreams(): Promise<Array<SerializedStream>> {
        return await Database.Streams.getAllSerializedStreams()
    }

    public static async newStream(streamEntry: DialogStreamEntry): Promise<boolean> {
        const schedulePath: string | undefined = streamEntry.schedulePath === "" ? undefined : streamEntry.schedulePath
        await addStream(streamEntry.streamName, streamEntry.playlistUrl, schedulePath)
        return true
    }

    public static async browseOutputDir(): Promise<string | undefined> {
        const pickerResult: OpenDialogReturnValue = await dialog.showOpenDialog(
            this.browserWindow, {properties: ["openDirectory"]})
        if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
        else return pickerResult.filePaths.first()
    }

    public static async browseSchedule(): Promise<string | undefined> {
        const pickerResult = await dialog.showOpenDialog(this.browserWindow, {properties: ["openFile"]})
        if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
        else return pickerResult.filePaths[0]
    }

    public static async getAllSettings(): Promise<AllSettings> {
        return await Database.Settings.getAllSettings()
    }

    public static async updateSettings(allSettings: AllSettings): Promise<void> {
        return await Database.Settings.updateSettings(allSettings)
    }

    public static async startStream(serializedStream: SerializedStream): Promise<SerializedStream | undefined> {
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.start()
            return found.serialize()
        } else return undefined
    }

    public static async pauseStream(serializedStream: SerializedStream): Promise<SerializedStream | undefined> {
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.pause()
            return found.serialize()
        } else return undefined
    }

    public static async forceRecordStream(serializedStream: SerializedStream): Promise<SerializedStream | undefined> {
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.forceRecord()
            return found.serialize()
        } else return undefined
    }

    public static async unForceRecordStream(serializedStream: SerializedStream): Promise<SerializedStream | undefined> {
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.unForceRecord()
            return found.serialize()
        } else return undefined
    }

    public static async viewStreamDir(serializedStream: SerializedStream): Promise<SerializedStream | undefined> {
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            electron.shell.openItem(found.streamDirectory)
            return found.serialize()
        } else return undefined
    }

}