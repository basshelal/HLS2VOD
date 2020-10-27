import {ipcRenderer} from "electron"
import {SerializedStream} from "../main/models/Stream"
import {DialogStreamEntry} from "./ui/components/AddStreamDialog"
import {Requests} from "../shared/Requests"
import {SettingsEntry} from "../main/Database"

export class RequestSender {
    private constructor() {}

    private static send<T>(name: string, args?: T): Promise<T> {
        return ipcRenderer.invoke(name, args)
    }

    public static async getAllStreams(): Promise<Array<SerializedStream>> {
        return this.send<Array<SerializedStream>>(Requests.GetStreams)
    }

    public static async newStream(stream: DialogStreamEntry): Promise<DialogStreamEntry> {
        return this.send(Requests.NewStream, stream)
    }

    public static async browseOutputDir(): Promise<string | undefined> {
        return this.send<string | undefined>(Requests.BrowseOutputDir)
    }

    public static async getAllSettings(): Promise<Array<SettingsEntry>> {
        return this.send<Array<SettingsEntry>>(Requests.GetSettings)
    }

}