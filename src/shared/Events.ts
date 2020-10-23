import {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, ipcRenderer} from "electron"
import {StreamEntry} from "../main/Stream"
import {sendToMain} from "../renderer/ui/UICommons"
import {Database} from "../main/Database"

export class Events {
    private constructor() {}

    public static GetSettings = "GetSettings"
    public static UpdateSettings = "SetSettings"
    public static GetStreams = "GetStreams"
    public static NewStream = "NewStream"
    public static RefreshAllStreams = "RefreshAllStreams"
    public static UpdateStream = "UpdateStream"
    public static DeleteStream = "DeleteStream"
    public static ForceRecordStream = "ForceRecordStream"
    public static UnForceRecordStream = "UnForceRecordStream"
    public static PauseStream = "PauseStream"
    public static StartStream = "StartStream"
    public static ViewStreamDir = "ViewStreamDir"
    public static BrowseSchedule = "BrowseSchedule"
    public static BrowseOutputDir = "BrowseOutputDir"
}

/**
 * A central location where all IPC events are implemented.
 * IPC events should follow the general server-client model as if this application is a web page meaning
 * the only events sent should be from the renderer to main which will then handle the events and can send a response.
 * This deliberate architectural choice simplifies the application and makes the behavior significantly more
 * predictable.
 */
export class EventBus {
    private constructor() {}

    public static browserWindow: BrowserWindow

    /** Initialize and set all handles for main, ie events from renderer to be handled by main */
    public static initializeMainHandles() {
        this.handleGetAllStreams()
        this.handleBrowseOutputDir()
    }

    public static handleFromRenderer<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
        ipcMain.handle(name, listener)
    }

    public static sendToMain<T>(name: string, args?: T): Promise<T> {
        return ipcRenderer.invoke(name, args)
    }

    public static async getAllStreams(): Promise<Array<StreamEntry>> {
        return sendToMain<Array<StreamEntry>>(Events.GetStreams)
    }

    public static handleGetAllStreams() {
        this.handleFromRenderer<Array<StreamEntry>>(Events.GetStreams,
            async (): Promise<Array<StreamEntry>> => await Database.Streams.getAllStreams())
    }

    public static async browseOutputDir(): Promise<string | undefined> {
        return this.sendToMain<string | undefined>(Events.BrowseOutputDir)
    }

    public static handleBrowseOutputDir() {
        this.handleFromRenderer(Events.BrowseOutputDir,
            async (): Promise<string | undefined> => {
                const pickerResult = await dialog.showOpenDialog(this.browserWindow, {properties: ["openDirectory"]})
                if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
                else return pickerResult.filePaths[0]
            })
    }
}