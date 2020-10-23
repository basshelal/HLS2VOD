import {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {Unit} from "../shared/Utils"
import {StreamEntry} from "./Stream"
import {Database} from "./Database"
import {DialogStreamEntry} from "../renderer/ui/components/AddStreamDialog"
import {Requests} from "../shared/Requests"
import {addStream} from "./Main"

export class RequestHandler {
    private constructor() {}

    public static browserWindow: BrowserWindow

    /** Initialize and set all handles for main, ie events from renderer to be handled by main */
    public static initializeMainHandles() {
        this.handleGetAllStreams()
        this.handleNewStream()
        this.handleBrowseOutputDir()
    }

    private static handle<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
        ipcMain.handle(name, listener)
    }

    public static handleGetAllStreams(): Unit {
        this.handle<Array<StreamEntry>>(Requests.GetStreams,
            async (): Promise<Array<StreamEntry>> => await Database.Streams.getAllStreams())
    }

    public static handleNewStream(): Unit {
        this.handle<DialogStreamEntry>(Requests.NewStream,
            async (event, streamEntry: DialogStreamEntry): Promise<boolean> => {
                const schedulePath: string | undefined = streamEntry.schedulePath === "" ? undefined : streamEntry.schedulePath
                await addStream(streamEntry.streamName, streamEntry.playlistUrl, schedulePath)
                return true
            })
    }

    public static handleBrowseOutputDir(): Unit {
        this.handle(Requests.BrowseOutputDir,
            async (): Promise<string | undefined> => {
                const pickerResult: OpenDialogReturnValue = await dialog.showOpenDialog(
                    this.browserWindow, {properties: ["openDirectory"]}
                )
                if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
                else return pickerResult.filePaths.first()
            })
    }
}