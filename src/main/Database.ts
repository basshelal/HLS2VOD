import Datastore from "nedb"
import Nedb from "nedb"
import {SerializedStream, Stream} from "./Stream"
import {getPath, promises} from "../shared/Utils"

export type SettingsEntryKey = "outputDirectory" | "offsetSeconds"

export interface SettingsEntry<T = any> {
    key: SettingsEntryKey
    value: T
}

export interface AllSettings {
    outputDirectory: string
    offsetSeconds: number
    // appTheme: string
    // fileExtension: string
}

export class Settings {
    private constructor() {}

    private static settingsDatabase: Nedb<SettingsEntry>

    public static isInitialized = false
    public static outputDirectory: string
    public static offsetSeconds: number

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
            onload: async (error: Error | null) => {
                try { this.outputDirectory = await this.getOutputDirectory() } catch (e) { await this.setOutputDirectory(initialOutputDir) }
                try {this.offsetSeconds = await this.getOffsetSeconds() } catch (e) { await this.setOffsetSeconds(initialOffsetSeconds)}
                this.isInitialized = true
            }
        })
    }

    // TODO: Make a function that returns an object instead of an array for easy querying
    //  and another to accompany it that allows us to set/update all settings
    public static async getAllSettings(): Promise<Array<SettingsEntry>> {
        return new Promise<Array<SettingsEntry>>((resolve, reject) => {
            this.settingsDatabase.find({}, (err: Error | null, documents: Array<SettingsEntry>) => {
                if (err) reject(err)
                else resolve(documents)
            })
        })
    }

    // region outputDirectory

    public static async setOutputDirectory(newOutputDirectory: string): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            this.settingsDatabase.update<SettingsEntry<string>>({key: "outputDirectory"},
                {key: "outputDirectory", value: newOutputDirectory},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error | null, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else {
                        const result: string = (affectedDocuments as SettingsEntry<string>).value
                        this.outputDirectory = result
                        resolve(result)
                    }
                }))
    }

    public static async getOutputDirectory(): Promise<string> {
        return new Promise<string>((resolve, reject) =>
            this.settingsDatabase.find<SettingsEntry<string>>({key: "outputDirectory"},
                (err: Error | null, documents: Array<SettingsEntry>) => {
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
            this.settingsDatabase.update<SettingsEntry<number>>({key: "offsetSeconds"},
                {key: "offsetSeconds", value: newOffsetSeconds},
                {upsert: true, returnUpdatedDocs: true},
                (err: Error | null, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else {
                        const result: number = Number.parseInt((affectedDocuments as SettingsEntry).value)
                        this.offsetSeconds = result
                        resolve(result)
                    }
                }))
    }

    public static async getOffsetSeconds(): Promise<number> {
        return new Promise<number>((resolve, reject) =>
            this.settingsDatabase.find<SettingsEntry<number>>({key: "offsetSeconds"},
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

    private static streamsDatabase: Nedb<SerializedStream>

    public static isInitialized = false
    public static streams: Array<SerializedStream>

    public static async initialize({dbPath = getPath("database/streams.db")}: { dbPath?: string }): Promise<void> {
        this.streamsDatabase = new Datastore({
            filename: dbPath,
            autoload: true,
            onload: async (error: Error | null) => {
                this.streams = await this.getAllStreams()
                this.isInitialized = true
            }
        })
    }

    public static async addStream(stream: Stream): Promise<void> {
        const streamEntry: SerializedStream = stream.toStreamEntry()
        return new Promise<void>((resolve, reject) =>
            this.streamsDatabase.update({name: stream.name}, streamEntry,
                {upsert: true},
                (err: Error | null) => {
                    if (err) reject(err)
                    else {
                        this.streams.push(streamEntry)
                        resolve()
                    }
                }
            )
        )
    }

    public static async getAllStreams(): Promise<Array<SerializedStream>> {
        return new Promise<Array<SerializedStream>>((resolve, reject) =>
            this.streamsDatabase.find<SerializedStream>({}, (err: Error, documents: Array<SerializedStream>) => {
                if (err) reject(err)
                else resolve(documents)
            })
        )
    }

    public static async deleteStream(stream: Stream): Promise<void> {
        const streamEntry: SerializedStream = stream.toStreamEntry()
        return new Promise<void>((resolve, reject) =>
            this.streamsDatabase.remove(streamEntry, (err: Error | null) => {
                if (err) reject(err)
                else {
                    this.streams.remove(streamEntry)
                    resolve()
                }
            })
        )
    }

    public static async updateStream(streamName: string, updatedStream: Stream): Promise<SerializedStream> {
        const streamEntry: SerializedStream = updatedStream.toStreamEntry()
        return new Promise<SerializedStream>((resolve, reject) =>
            this.streamsDatabase.update({name: streamName}, streamEntry,
                {upsert: false, returnUpdatedDocs: true},
                (err: Error | null, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else {
                        const result: SerializedStream = affectedDocuments as SerializedStream
                        this.streams.push(result)
                        resolve(result)
                    }
                }
            )
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