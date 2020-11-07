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
        this.getAllStreams()
        // this.handle(Requests.GetStreams, this._getAllStreams.bind(this))
        this.newStream()
        this.browseOutputDir()
        this.browseSchedule()
        this.getAllSettings()
        this.updateSettings()
        this.startStream()
        this.pauseStream()
        this.forceRecordStream()
        this.unForceRecordStream()
        this.viewStreamDir()
    }

    private static handle<T, R>(name: string, listener: (args: T, event: IpcMainInvokeEvent) => Promise<R> | R) {
        ipcMain.handle(name, (event, args) => listener(args, event))
    }

    public static getAllStreams() {
        this.handle(Requests.GetStreams,
            async (): Promise<Array<SerializedStream>> => await Database.Streams.getAllSerializedStreams())
    }

    public static async _getAllStreams(): Promise<Array<SerializedStream>> {
        return await Database.Streams.getAllSerializedStreams()
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

    public static startStream() {
        this.handle(Requests.StartStream,
            async (serializedStream: SerializedStream) => {
                const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
                if (found) {
                    await found.start()
                    return found.serialize()
                } else return undefined
            })
    }

    public static pauseStream() {
        this.handle(Requests.PauseStream,
            async (serializedStream: SerializedStream) => {
                const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
                if (found) {
                    await found.pause()
                    return found.serialize()
                } else return undefined
            })
    }

    public static forceRecordStream() {
        this.handle(Requests.ForceRecordStream,
            async (serializedStream: SerializedStream) => {
                const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
                if (found) {
                    await found.forceRecord()
                    return found.serialize()
                } else return undefined
            })
    }

    public static unForceRecordStream() {
        this.handle(Requests.UnForceRecordStream,
            async (serializedStream: SerializedStream) => {
                const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
                if (found) {
                    await found.unForceRecord()
                    return found.serialize()
                } else return undefined
            })
    }

    public static viewStreamDir() {
        this.handle(Requests.ViewStreamDir,
            async (serializedStream: SerializedStream) => {
                const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
                if (found) {
                    electron.shell.openItem(found.streamDirectory)
                    return found.serialize()
                } else return undefined
            })
    }

}