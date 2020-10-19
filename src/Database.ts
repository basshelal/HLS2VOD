import Datastore from "nedb"
import Nedb from "nedb"
import {Stream, StreamEntry} from "./stream/Stream"
import {getPath, promises} from "./utils/Utils"

export type SettingsEntryKey = "outputDirectory" | "offsetSeconds"

export interface SettingsEntry {
    key: SettingsEntryKey
    value: string
}

// TODO: Cache values in memory and use a mirror methodology??

export class Settings {
    private constructor() {}

    public static isInitialized = false

    private static settingsDatabase: Nedb<SettingsEntry>

    public static async initialize({
                                       dbPath = getPath("database/settings.db"),
                                       initialOutputDir = getPath("streams"),
                                       initialOffsetSeconds = 60
                                   }: {
        dbPath?: string, initialOutputDir?: string, initialOffsetSeconds?: number
    }): Promise<void> {
        this.settingsDatabase = new Datastore({
            filename: dbPath,
            autoload: true,
            onload: async (error) => {
                try { await this.getOutputDirectory() } catch (e) { await this.setOutputDirectory(initialOutputDir) }
                try { await this.getOffsetSeconds() } catch (e) { await this.setOffsetSeconds(initialOffsetSeconds)}
            }
        })
        this.isInitialized = true
    }

    public static async getAllSettings(): Promise<Array<SettingsEntry>> {
        return new Promise<Array<SettingsEntry>>((resolve, reject) => {
            this.settingsDatabase.find({}, (err: Error, documents: Array<SettingsEntry>) => {
                if (err) reject(err)
                else resolve(documents)
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
                    else if (!documents) reject(`Output Directory documents is null`)
                    else if (documents.length === 0) reject(`Output Directory documents is empty`)
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
                    else if (!documents) reject(`Offset Seconds documents is null`)
                    else if (documents.length === 0) reject(`Offset Seconds documents is empty`)
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

    public static async initialize({dbPath = getPath("database/streams.db")}: { dbPath?: string }): Promise<void> {
        this.streamsDatabase = new Datastore({
            filename: dbPath,
            autoload: true,
            onload: (error) => {

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
        await promises(
            Settings.initialize({}),
            Streams.initialize({})
        )
        this.isInitialized = true
    }
}