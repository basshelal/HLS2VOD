import {ipcRenderer} from "electron"
import {DialogStreamEntry} from "./ui/components/AddStreamDialog"
import {Requests} from "../shared/Requests"
import {AllSettings} from "../main/Database"
import {SerializedStream} from "../shared/Serialized"

export class RequestSender {
    private constructor() {}

    private static send<R>(name: string, args?: any): Promise<R> {
        return ipcRenderer.invoke(name, args)
    }

    public static async getAllStreams(): Promise<Array<SerializedStream>> {
        return this.send<Array<SerializedStream>>(Requests.GetStreams)
    }

    public static async newStream(stream: DialogStreamEntry): Promise<boolean> {
        return this.send<boolean>(Requests.NewStream, stream)
    }

    public static async browseOutputDir(): Promise<string | undefined> {
        return this.send<string | undefined>(Requests.BrowseOutputDir)
    }

    public static async getAllSettings(): Promise<AllSettings> {
        return this.send<AllSettings>(Requests.GetSettings)
    }

    public static async updateSettings(allSettings: AllSettings): Promise<AllSettings> {
        return this.send<AllSettings>(Requests.UpdateSettings, allSettings)
    }

}