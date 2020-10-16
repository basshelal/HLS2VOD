import Datastore from "nedb"
import Nedb from "nedb"
import {Stream} from "./stream/Stream"
import {awaitAll, getPath} from "./utils/Utils"

export type SettingsEntryKey = "outputDirectory" | "offsetSeconds"

export interface SettingsEntry {
    key: SettingsEntryKey
    value: string
}

export interface StreamEntry {
    name: string,
    playlistUrl: string,
    schedulePath: string,
}

// TODO: Cache values in memory and use a mirror methodology??

export class Settings {
    private constructor() {}

    public static isInitialized = false

    private static settingsDatabase: Nedb<SettingsEntry>

    public static async initialize({filePath = getPath("database/settings.db")}: { filePath?: string }): Promise<void> {
        this.settingsDatabase = new Datastore({
            filename: filePath,
            autoload: true,
            onload: async (error) => {
                try {
                    await this.getOutputDirectory()
                } catch (e) {
                    await this.setOutputDirectory(getPath("streams"))
                }
            }
        })
        this.isInitialized = true
    }

    public static async getAllSettings(): Promise<Map<SettingsEntryKey, string>> {
        return new Promise<Map<SettingsEntryKey, string>>((resolve, reject) => {
            this.settingsDatabase.find({}, (err: Error, documents: Array<SettingsEntry>) => {
                if (err) reject(err)
                else resolve(new Map(documents.map(it => [it.key, it.value])))
            })
        })
    }

    // region outputDirectory

    public static async setOutputDirectory(newOutputDirectory: string): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            this.settingsDatabase.update<SettingsEntry>({key: "outputDirectory"},
                {key: "outputDirectory", value: newOutputDirectory},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve((affectedDocuments as SettingsEntry).value)
                }))
    }

    public static async getOutputDirectory(): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            this.settingsDatabase.find<SettingsEntry>({key: "outputDirectory"},
                (err: Error, documents: Array<SettingsEntry>) => {
                    if (err) reject(err)
                    else if (!documents || documents.length == 0) reject("Documents is null or empty")
                    else resolve(documents[0].value)
                })
        )
    }

    // endregion outputDirectory

    // region offsetSeconds

    public static async setOffsetSeconds(newOffsetSeconds: number): Promise<number> {
        return new Promise<number>((resolve, reject) =>
            this.settingsDatabase.update<SettingsEntry>({key: "offsetSeconds"},
                {key: "offsetSeconds", value: newOffsetSeconds},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve(Number.parseInt((affectedDocuments as SettingsEntry).value))
                }))
    }

    public static async getOffsetSeconds(): Promise<number> {
        return new Promise<number>((resolve, reject) =>
            this.settingsDatabase.find<SettingsEntry>({key: "offsetSeconds"},
                (err: Error, documents: Array<SettingsEntry>) => {
                    if (err) reject(err)
                    else if (!documents || documents.length == 0) reject("Documents is null or empty")
                    else resolve(Number.parseInt(documents[0].value))
                })
        )
    }

    // endregion offsetSeconds
}

export class Streams {
    private constructor() {}

    public static isInitialized = false

    private static streamsDatabase: Nedb<StreamEntry>

    public static async initialize({filePath = getPath("database/streams.db")}: { filePath?: string }): Promise<void> {
        this.streamsDatabase = new Datastore({
            filename: getPath("database/streams.db"),
            autoload: true,
            onload: (error) => {
                // TODO: Implement
            }
        })
        this.isInitialized = true
    }

    public static async addStream(stream: Stream): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            this.streamsDatabase.update({name: stream.name}, stream.toStreamEntry(),
                {upsert: true},
                (err: Error) => {
                    if (err) reject(err)
                    else resolve()
                }
            )
        )
    }

    public static async getAllStreams(): Promise<Array<StreamEntry>> {
        return new Promise<Array<StreamEntry>>((resolve, reject) =>
            this.streamsDatabase.find<StreamEntry>({}, (err: Error, documents: Array<StreamEntry>) => {
                if (err) reject(err)
                else resolve(documents)
            })
        )
    }

    public static async deleteStream(stream: Stream): Promise<void> {
        return new Promise<void>((resolve, reject) =>
            this.streamsDatabase.remove(stream.toStreamEntry(), (err: Error) => {
                if (err) reject(err)
                else resolve()
            })
        )
    }

    public static async updateStream(streamName: string, updatedStream: Stream): Promise<StreamEntry> {
        return new Promise<StreamEntry>((resolve, reject) =>
            this.streamsDatabase.update({name: streamName}, updatedStream.toStreamEntry(),
                {upsert: false, returnUpdatedDocs: true},
                (err: Error, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else resolve(affectedDocuments as StreamEntry)
                }
            )
        )
    }

    public static async getStreamByName(streamName: string): Promise<StreamEntry> {
        return new Promise<StreamEntry>((resolve, reject) =>
            this.streamsDatabase.find<StreamEntry>({name: streamName}, (err: Error, documents: Array<StreamEntry>) => {
                if (err) reject(err)
                else if (!documents || documents.length == 0) reject("Documents is null or empty")
                else resolve(documents[0])
            })
        )
    }
}

export class Database {
    private constructor() {}

    public static isInitialized = false

    public static Settings = Settings
    public static Streams = Streams

    public static async initialize() {
        awaitAll(
            Settings.initialize({}),
            Streams.initialize({})
        )
        this.isInitialized = true
    }

    public static async testInitialize() {
        awaitAll(
            Settings.initialize({filePath: getPath("tests/database/settings.db")}),
            Streams.initialize({filePath: getPath("tests/database/settings.db")})
        )
        this.isInitialized = true
    }
}