import {AllSettings} from "../main/Database"
import {SerializedStream} from "./Serialized"
import {DialogStreamEntry} from "../renderer/ui/components/AddStreamDialog"

export class Requests {
    private constructor() {}

    public static GetSettings = "GetSettings"
    public static UpdateSettings = "SetSettings"
    public static GetAllStreams = "GetAllStreams"
    public static NewStream = "NewStream"
    public static UpdateStream = "UpdateStream"
    public static DeleteStream = "DeleteStream"
    public static ForceRecordStream = "ForceRecordStream"
    public static UnForceRecordStream = "UnForceRecordStream"
    public static PauseStream = "PauseStream"
    public static StartStream = "StartStream"
    public static ViewStreamDir = "ViewStreamDir"
    public static BrowseOutputDir = "BrowseOutputDir"
}

// Get Settings
export type GetSettingsArgsType = void
export type GetSettingsReturnType = AllSettings

// Update Settings
export type UpdateSettingsArgsType = AllSettings
export type UpdateSettingsReturnType = AllSettings

// Get Streams
export type GetStreamsArgsType = void
export type GetStreamsReturnType = Array<SerializedStream>

// New Stream
export type NewStreamArgsType = DialogStreamEntry
export type NewStreamReturnType = boolean

// UpdateStream
export type UpdateStreamArgsType = { streamName: string, updatedStream: SerializedStream }
export type UpdateStreamReturnType = SerializedStream | undefined

// DeleteStream
export type DeleteStreamArgsType = string
export type DeleteStreamReturnType = boolean

// ForceRecordStream
export type ForceRecordStreamArgsType = SerializedStream
export type ForceRecordStreamReturnType = SerializedStream | undefined

// UnForceRecordStream
export type UnForceRecordStreamArgsType = SerializedStream
export type UnForceRecordStreamReturnType = SerializedStream | undefined

// PauseStream
export type PauseStreamArgsType = SerializedStream
export type PauseStreamReturnType = SerializedStream | undefined

// StartStream
export type StartStreamArgsType = SerializedStream
export type StartStreamReturnType = SerializedStream | undefined

// ViewStreamDir
export type ViewStreamDirArgsType = SerializedStream
export type ViewStreamDirReturnType = SerializedStream | undefined

// BrowseOutputDir
export type BrowseOutputDirArgsType = void
export type BrowseOutputDirReturnType = string | undefined