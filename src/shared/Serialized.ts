import {StreamState} from "../main/models/Stream"
import {Day, HMTime, SDuration} from "./Types"

/** The {@link serialize} method is used for IPC and Database to transfer and write objects */
export interface Serializable<S> {

    serialize(): S | PromiseLike<S>
}

export interface SerializedShow {
    name: string
    day: Day
    startTime: HMTime
    duration: SDuration
    offsetDuration: SDuration
}

export interface SerializedStream {
    name: string
    url: string
    state: StreamState
    scheduledShows: Array<SerializedShow>
    isForced: boolean
    streamDirectory: string
}