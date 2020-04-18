import * as Datastore from "nedb";
import {Stream} from "../stream";

export const settingsDatabase = new Datastore({filename: "database/settings.db", autoload: true})
export const streamsDatabase = new Datastore({filename: "database/streams.db", autoload: true})

interface SettingsEntry {
    key: string
    value: string
}

export const Settings = {
    async setRootDirectory(newRootDirectory: string): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            settingsDatabase.update<SettingsEntry>({key: "rootDirectory"},
                {key: "rootDirectory", value: newRootDirectory},
                {},
                (err: Error, numberOfUpdated: number, upsert: boolean) => {
                    if (err) reject(err)
                    else resolve()
                }))
    },
    async getRootDirectory(): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            settingsDatabase.find<SettingsEntry>({key: "rootDirectory"},
                (err: Error, documents: Array<SettingsEntry>) => {
                    if (err) reject(err)
                    else if (!documents || documents.length == 0) reject("Documents is null or empty")
                    else resolve(documents[0].value)
                })
        )
    }
}

interface StreamEntry {
    name: string,
    playlistUrl: string,
    schedulePath: string,
    offsetSeconds: number
}

function streamToStreamEntry(stream: Stream): StreamEntry {
    return {
        name: stream.name,
        playlistUrl: stream.playlistUrl,
        schedulePath: stream.schedulePath,
        offsetSeconds: stream.offsetSeconds
    }
}

export const Streams = {
    async addNewStream(stream: Stream): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            streamsDatabase.update({name: stream.name}, streamToStreamEntry(stream),
                {upsert: true},
                (err: Error, numberOfUpdated: number, upsert: boolean) => {
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
        return null
    },
    async updateStream(streamName: string, updatedStream: Stream): Promise<StreamEntry> {
        return null
    },
    async getStreamByName(streamName: string): Promise<StreamEntry> {
        return new Promise<StreamEntry>((resolve, reject) =>
            streamsDatabase.find<StreamEntry>({name: streamName}, (err: Error, documents: Array<StreamEntry>) => {
                if (err) reject(err)
                else if (!documents || documents.length == 0) reject("Documents is null or empty")
                else resolve(documents[0])
            })
        )
    },
}
