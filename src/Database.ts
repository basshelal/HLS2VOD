import Datastore from "nedb"
import {Stream} from "./stream/Stream"
import {getPath} from "./utils/Utils"

const settingsDatabase = new Datastore({
    filename: getPath("database/settings.db"),
    autoload: true
})
const streamsDatabase = new Datastore({
    filename: getPath("database/streams.db"),
    autoload: true
})

export type SettingsEntryKey = "outputDirectory" | "offsetSeconds"

export interface SettingsEntry {
    key: SettingsEntryKey
    value: string
}

export const Settings = {
    async getAllSettings(): Promise<Map<SettingsEntryKey, string>> {
        return new Promise<Map<SettingsEntryKey, string>>((resolve, reject) => {
            settingsDatabase.find({}, (err: Error, documents: Array<SettingsEntry>) => {
                if (err) reject(err)
                else resolve(new Map(documents.map(it => [it.key, it.value])))
            })
        })
    },

    // region outputDirectory
    async setOutputDirectory(newOutputDirectory: string): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            settingsDatabase.update<SettingsEntry>({key: "outputDirectory"},
                {key: "outputDirectory", value: newOutputDirectory},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve((affectedDocuments as SettingsEntry).value)
                }))
    },
    async getOutputDirectory(): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            settingsDatabase.find<SettingsEntry>({key: "outputDirectory"},
                (err: Error, documents: Array<SettingsEntry>) => {
                    if (err) reject(err)
                    else if (!documents || documents.length == 0) reject("Documents is null or empty")
                    else resolve(documents[0].value)
                })
        )
    },
    // endregion outputDirectory

    // region offsetSeconds
    async setOffsetSeconds(newOffsetSeconds: number): Promise<number> {
        return new Promise<number>((resolve, reject) =>
            settingsDatabase.update<SettingsEntry>({key: "offsetSeconds"},
                {key: "offsetSeconds", value: newOffsetSeconds},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve(Number.parseInt((affectedDocuments as SettingsEntry).value))
                }))
    },
    async getOffsetSeconds(): Promise<number> {
        return new Promise<number>((resolve, reject) =>
            settingsDatabase.find<SettingsEntry>({key: "offsetSeconds"},
                (err: Error, documents: Array<SettingsEntry>) => {
                    if (err) reject(err)
                    else if (!documents || documents.length == 0) reject("Documents is null or empty")
                    else resolve(Number.parseInt(documents[0].value))
                })
        )
    }
    // endregion offsetSeconds
}

export interface StreamEntry {
    name: string,
    playlistUrl: string,
    schedulePath: string,
}

export const Streams = {
    async addStream(stream: Stream): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            streamsDatabase.update({name: stream.name}, stream.toStreamEntry(),
                {upsert: true},
                (err: Error) => {
                    if (err) reject(err)
                    else resolve()
                }
            )
        )
    },
    async getAllStreams(): Promise<Array<StreamEntry>> {
        return new Promise<Array<StreamEntry>>((resolve, reject) =>
            streamsDatabase.find<StreamEntry>({}, (err: Error, documents: Array<StreamEntry>) => {
                if (err) reject(err)
                else resolve(documents)
            })
        )
    },
    async deleteStream(stream: Stream): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            streamsDatabase.remove(stream.toStreamEntry(), (err: Error) => {
                if (err) reject(err)
                else resolve()
            })
        )
    },
    async updateStream(streamName: string, updatedStream: Stream): Promise<StreamEntry> {
        return new Promise<StreamEntry>((resolve, reject) =>
            streamsDatabase.update({name: streamName}, updatedStream.toStreamEntry(),
                {upsert: false, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve(affectedDocuments as StreamEntry)
                }
            )
        )
    },
    async getStreamByName(streamName: string): Promise<StreamEntry> {
        return new Promise<StreamEntry>((resolve, reject) =>
            streamsDatabase.find<StreamEntry>({name: streamName}, (err: Error, documents: Array<StreamEntry>) => {
                if (err) reject(err)
                else if (!documents || documents.length == 0) reject("Documents is null or empty")
                else resolve(documents[0])
            })
        )
    }
}
