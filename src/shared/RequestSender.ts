import {ipcRenderer} from "electron"
import {StreamEntry} from "../main/Stream"
import {DialogStreamEntry} from "../renderer/ui/components/AddStreamDialog"
import {Requests} from "./Requests"

export class RequestSender {
    private constructor() {}

    private static send<T>(name: string, args?: T): Promise<T> {
        return ipcRenderer.invoke(name, args)
    }

    public static async getAllStreams(): Promise<Array<StreamEntry>> {
        return this.send<Array<StreamEntry>>(Requests.GetStreams)
    }

    public static async newStream(stream: DialogStreamEntry): Promise<DialogStreamEntry> {
        return this.send(Requests.NewStream, stream)
    }

    public static async browseOutputDir(): Promise<string | undefined> {
        return this.send<string | undefined>(Requests.BrowseOutputDir)
    }


}