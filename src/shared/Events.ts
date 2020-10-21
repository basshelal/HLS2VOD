import {BrowserWindow, ipcMain, IpcMainInvokeEvent, ipcRenderer, IpcRendererEvent} from "electron"

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

export class EventBus {
    private constructor() {}

    public static browserWindow: BrowserWindow

    public static handleFromRenderer<T>(name: string, listener: (event: IpcMainInvokeEvent, args: T) => Promise<T> | any) {
        ipcMain.handle(name, listener)
    }

    public static sendToRenderer<T>(name: string, args: T) {
        this.browserWindow.webContents.send(name, args)
    }

    public static handleFromMain<T>(name: string, listener: (event: IpcRendererEvent, args: T) => void) {
        ipcRenderer.on(name, listener)
    }

    public static sendToMain<T>(name: string, args?: T): Promise<T> {
        return ipcRenderer.invoke(name, args)
    }

}