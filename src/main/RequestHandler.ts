import electron, {BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, OpenDialogReturnValue} from "electron"
import {Database} from "./Database"
import {
    BrowseOutputDirArgsType,
    BrowseOutputDirReturnType,
    DeleteStreamArgsType,
    DeleteStreamReturnType,
    ForceRecordStreamArgsType,
    ForceRecordStreamReturnType,
    GetSettingsArgsType,
    GetSettingsReturnType,
    GetStreamsArgsType,
    GetStreamsReturnType,
    GetStreamStateArgsType,
    GetStreamStateReturnType,
    NewStreamArgsType,
    NewStreamReturnType,
    PauseStreamArgsType,
    PauseStreamReturnType,
    Requests,
    StartStreamArgsType,
    StartStreamReturnType,
    UnForceRecordStreamArgsType,
    UnForceRecordStreamReturnType,
    UpdateSettingsArgsType,
    UpdateSettingsReturnType,
    UpdateStreamArgsType,
    UpdateStreamReturnType,
    ViewStreamDirArgsType,
    ViewStreamDirReturnType
} from "../shared/Requests"
import {Stream} from "./models/Stream"
import {logD, logE} from "../shared/Log"
import {json} from "../shared/Utils"

export class RequestHandler {
    private constructor() {}

    public static browserWindow: BrowserWindow

    private static bindAll() {
        this.getAllStreams = this.getAllStreams.bind(this)
        this.newStream = this.newStream.bind(this)
        this.browseOutputDir = this.browseOutputDir.bind(this)
        this.getAllSettings = this.getAllSettings.bind(this)
        this.updateSettings = this.updateSettings.bind(this)
        this.startStream = this.startStream.bind(this)
        this.pauseStream = this.pauseStream.bind(this)
        this.forceRecordStream = this.forceRecordStream.bind(this)
        this.unForceRecordStream = this.unForceRecordStream.bind(this)
        this.updateStream = this.updateStream.bind(this)
        this.deleteStream = this.deleteStream.bind(this)
        this.viewStreamDir = this.viewStreamDir.bind(this)
        this.getStreamState = this.getStreamState.bind(this)
    }

    private static handle<T, R>(name: string, listener: (args: T, event: IpcMainInvokeEvent) => Promise<R> | R) {
        ipcMain.handle(name, (event, args) => listener(args, event))
    }

    private static log(request: string, args: any): void { logD(`Received Request ${request}\nargs:\n${json(args)}`) }

    /** Initialize and set all handles for main, ie events from renderer to be handled by main */
    public static initialize({browserWindow}: { browserWindow: BrowserWindow }) {
        this.browserWindow = browserWindow
        this.bindAll()
        this.handle(Requests.GetAllStreams, this.getAllStreams)
        this.handle(Requests.NewStream, this.newStream)
        this.handle(Requests.BrowseOutputDir, this.browseOutputDir)
        this.handle(Requests.GetSettings, this.getAllSettings)
        this.handle(Requests.UpdateSettings, this.updateSettings)
        this.handle(Requests.StartStream, this.startStream)
        this.handle(Requests.PauseStream, this.pauseStream)
        this.handle(Requests.ForceRecordStream, this.forceRecordStream)
        this.handle(Requests.UnForceRecordStream, this.unForceRecordStream)
        this.handle(Requests.UpdateStream, this.updateStream)
        this.handle(Requests.DeleteStream, this.deleteStream)
        this.handle(Requests.ViewStreamDir, this.viewStreamDir)
        this.handle(Requests.GetStreamState, this.getStreamState)
    }

    public static async getAllStreams(_: GetStreamsArgsType): Promise<GetStreamsReturnType> {
        this.log(Requests.GetAllStreams, _)
        return await Database.Streams.getAllSerializedStreams()
    }

    public static async newStream(streamEntry: NewStreamArgsType): Promise<NewStreamReturnType> {
        this.log(Requests.NewStream, streamEntry)
        const stream = new Stream({
            name: streamEntry.name,
            url: streamEntry.url,
            scheduledShows: [],
            allSettings: await Database.Settings.getAllSettings()
        })
        try {
            await Database.Streams.addStream(stream)
            return true
        } catch (e) {
            logE(`Could not add new stream.\nStream:\n${streamEntry}\nReason:\n${e}`)
            return false
        }
    }

    public static async browseOutputDir(_: BrowseOutputDirArgsType): Promise<BrowseOutputDirReturnType> {
        this.log(Requests.BrowseOutputDir, _)
        const pickerResult: OpenDialogReturnValue = await dialog.showOpenDialog(
            this.browserWindow, {properties: ["openDirectory"]})
        if (pickerResult.canceled || !pickerResult.filePaths || pickerResult.filePaths.length === 0) return undefined
        else return pickerResult.filePaths.first()
    }

    public static async getAllSettings(_: GetSettingsArgsType): Promise<GetSettingsReturnType> {
        this.log(Requests.GetSettings, _)
        return await Database.Settings.getAllSettings()
    }

    public static async updateSettings(allSettings: UpdateSettingsArgsType): Promise<UpdateSettingsReturnType> {
        this.log(Requests.UpdateSettings, allSettings)
        return await Database.Settings.updateSettings(allSettings)
    }

    public static async startStream(serializedStream: StartStreamArgsType): Promise<StartStreamReturnType> {
        this.log(Requests.StartStream, serializedStream)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.start()
            return found.serialize()
        } else return undefined
    }

    public static async pauseStream(serializedStream: PauseStreamArgsType): Promise<PauseStreamReturnType> {
        this.log(Requests.PauseStream, serializedStream)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.pause()
            return found.serialize()
        } else return undefined
    }

    public static async forceRecordStream(serializedStream: ForceRecordStreamArgsType): Promise<ForceRecordStreamReturnType> {
        this.log(Requests.ForceRecordStream, serializedStream)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.forceRecord()
            return found.serialize()
        } else return undefined
    }

    public static async unForceRecordStream(serializedStream: UnForceRecordStreamArgsType): Promise<UnForceRecordStreamReturnType> {
        this.log(Requests.UnForceRecordStream, serializedStream)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            await found.unForceRecord()
            return found.serialize()
        } else return undefined
    }

    public static async updateStream(args: UpdateStreamArgsType): Promise<UpdateStreamReturnType> {
        this.log(Requests.UpdateStream, args)
        try {
            return await Database.Streams.updateStream(args.streamName, args.updatedStream)
        } catch (e) {
            return undefined
        }
    }

    public static async deleteStream(streamName: DeleteStreamArgsType): Promise<DeleteStreamReturnType> {
        this.log(Requests.DeleteStream, streamName)
        try {
            await Database.Streams.deleteStream(streamName)
            return true
        } catch (e) {
            return false
        }
    }

    public static async viewStreamDir(serializedStream: ViewStreamDirArgsType): Promise<ViewStreamDirReturnType> {
        this.log(Requests.ViewStreamDir, serializedStream)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(serializedStream.name)
        if (found) {
            electron.shell.openItem(found.streamDirectory)
            return found.serialize()
        } else return undefined
    }

    public static async getStreamState(streamName: GetStreamStateArgsType): Promise<GetStreamStateReturnType> {
        this.log(Requests.GetStreamState, streamName)
        const found: Stream | undefined = Database.Streams.getActualStreamByName(streamName)
        if (found) {
            return found.state
        } else return undefined
    }

}