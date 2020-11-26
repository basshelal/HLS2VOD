import {ipcRenderer} from "electron"
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
    ViewStreamDirArgsType,
    ViewStreamDirReturnType
} from "../shared/Requests"

export class RequestSender {
    private constructor() {}

    private static send<R>(name: string, args: any): Promise<R> {
        return ipcRenderer.invoke(name, args)
    }

    public static async getAllStreams(args: GetStreamsArgsType): Promise<GetStreamsReturnType> {
        return this.send(Requests.GetAllStreams, args)
    }

    public static async newStream(args: NewStreamArgsType): Promise<NewStreamReturnType> {
        return this.send(Requests.NewStream, args)
    }

    public static async browseOutputDir(args: BrowseOutputDirArgsType): Promise<BrowseOutputDirReturnType> {
        return this.send(Requests.BrowseOutputDir, args)
    }

    public static async getAllSettings(args: GetSettingsArgsType): Promise<GetSettingsReturnType> {
        return this.send(Requests.GetSettings, args)
    }

    public static async updateSettings(args: UpdateSettingsArgsType): Promise<UpdateSettingsReturnType> {
        return this.send(Requests.UpdateSettings, args)
    }

    public static async startStream(args: StartStreamArgsType): Promise<StartStreamReturnType> {
        return this.send(Requests.StartStream, args)
    }

    public static async pauseStream(args: PauseStreamArgsType): Promise<PauseStreamReturnType> {
        return this.send(Requests.PauseStream, args)
    }

    public static async forceRecordStream(args: ForceRecordStreamArgsType): Promise<ForceRecordStreamReturnType> {
        return this.send(Requests.ForceRecordStream, args)
    }

    public static async unForceRecordStream(args: UnForceRecordStreamArgsType): Promise<UnForceRecordStreamReturnType> {
        return this.send(Requests.UnForceRecordStream, args)
    }

    public static async deleteStream(args: DeleteStreamArgsType): Promise<DeleteStreamReturnType> {
        return this.send(Requests.DeleteStream, args)
    }

    public static async updateStream(args: UpdateStreamArgsType): Promise<UpdateSettingsReturnType> {
        return this.send(Requests.UpdateStream, args)
    }

    public static async viewStreamDir(args: ViewStreamDirArgsType): Promise<ViewStreamDirReturnType> {
        return this.send(Requests.ViewStreamDir, args)
    }

    public static async getStreamState(args: GetStreamStateArgsType): Promise<GetStreamStateReturnType> {
        return this.send(Requests.GetStreamState, args)
    }

}