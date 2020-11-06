import {StreamState} from "../main/models/Stream"

/** The {@link serialize} method is used for IPC and Database to transfer and write objects */
export interface Serializable<S> {

    serialize(): S | PromiseLike<S>
}

export interface SerializedShow {
    name: string
    startTime: number
    offsetStartTime: number
    endTime: number
    offsetEndTime: number
}

export interface SerializedStream {
    name: string
    url: string
    state: StreamState
    scheduledShows: Array<SerializedShow>
    isForced: boolean
    streamDirectory: string
}