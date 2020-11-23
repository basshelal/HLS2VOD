import Datastore from "nedb"
import Nedb from "nedb"
import {Stream} from "./models/Stream"
import {getPath, promises} from "../shared/Utils"
import {SerializedStream} from "../shared/Serialized"
import {loadExtensions} from "../shared/Extensions"
import path from "path"
import {mkdirpSync} from "fs-extra"

loadExtensions()

export type SettingsEntryKey = "outputDirectory" | "offsetSeconds"

export interface SettingsEntry<T = any> {
    key: SettingsEntryKey
    value: T
}

export interface SomeSettings {
    outputDirectory?: string
    offsetSeconds?: number
    // TODO: Add the below settings later at some point
    //  appTheme: AppTheme
    //  fileExtension: string
}

export interface AllSettings extends SomeSettings {
    outputDirectory: string
    offsetSeconds: number
}

export class Settings {
    private constructor() {}

    private static settingsDatabase: Nedb<SettingsEntry>

    public static isInitialized: boolean = false

    private static defaultSettings: AllSettings

    public static async initialize({dbPath = getPath("database/settings.db"), defaultSettings}: {
        dbPath?: string, defaultSettings: AllSettings
    }): Promise<void> {
        this.defaultSettings = defaultSettings
        return new Promise((resolve, reject) => {
            this.settingsDatabase = new Datastore({
                filename: dbPath,
                autoload: true,
                onload: async (error: Error | null) => {
                    if (error) reject(error)
                    else {
                        try { await this.getOutputDirectory() } catch (e) { await this.setOutputDirectory(defaultSettings.outputDirectory) }
                        try { await this.getOffsetSeconds() } catch (e) { await this.setOffsetSeconds(defaultSettings.offsetSeconds) }
                        this.isInitialized = true
                        resolve()
                    }
                }
            })
        })
    }

    public static async getAllSettingsArray(): Promise<Array<SettingsEntry>> {
        return new Promise<Array<SettingsEntry>>((resolve, reject) => {
            this.settingsDatabase.find({}, (err: Error | null, documents: Array<SettingsEntry>) => {
                if (err) reject(err)
                else resolve(documents)
            })
        })
    }

    public static async getAllSettings(): Promise<AllSettings> {
        const settingsArray: Array<SettingsEntry> = await this.getAllSettingsArray()
        const foundOutputDir: SettingsEntry | undefined = settingsArray.find(it => it.key === "outputDirectory")
        const outputDir: string = foundOutputDir ? foundOutputDir.value : this.defaultSettings.outputDirectory
        const foundOffsetSeconds: SettingsEntry | undefined = settingsArray.find(it => it.key === "offsetSeconds")
        const offsetSeconds: number = foundOffsetSeconds ? Number.parseInt(foundOffsetSeconds.value) : this.defaultSettings.offsetSeconds
        return {outputDirectory: outputDir, offsetSeconds: offsetSeconds}
    }

    public static async updateSettings(settings: SomeSettings): Promise<AllSettings> {
        const toAwait: Array<Promise<any>> = []
        if (settings.outputDirectory) toAwait.push(this.setOutputDirectory(settings.outputDirectory))
        if (settings.offsetSeconds) toAwait.push(this.setOffsetSeconds(settings.offsetSeconds))
        await promises(...toAwait)
        return await this.getAllSettings()
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
                        mkdirpSync(result)
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

    public static isInitialized: boolean = false
    public static actualStreams: Array<Stream>

    public static async initialize({dbPath = getPath("database/streams.db")}: { dbPath?: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            // Settings must be initialized first!
            if (!Database.Settings.isInitialized) throw Error("Settings Database must be initialized before Streams Database!")
            this.streamsDatabase = new Datastore({
                filename: dbPath,
                autoload: true,
                onload: async (error: Error | null) => {
                    if (error) reject(error)
                    else {
                        const allSettings = await Database.Settings.getAllSettings()
                        const serializedStreams: Array<SerializedStream> = await this.getAllSerializedStreams()
                        this.actualStreams = serializedStreams.map(it =>
                            Stream.fromSerializedStream({
                                serializedStream: it,
                                allSettings: allSettings
                            }))
                        this.isInitialized = true
                        resolve()
                    }
                }
            })
        })
    }

    public static async addStream(stream: Stream): Promise<void> {
        const streamEntry: SerializedStream = stream.serialize()
        return new Promise<void>((resolve, reject) =>
            this.streamsDatabase.update({name: stream.name}, streamEntry,
                {upsert: true},
                (err: Error | null) => {
                    if (err) reject(err)
                    else {
                        this.actualStreams.push(stream)
                        resolve()
                    }
                }
            )
        )
    }

    public static async getAllSerializedStreams(): Promise<Array<SerializedStream>> {
        return new Promise<Array<SerializedStream>>((resolve, reject) =>
            this.streamsDatabase.find<SerializedStream>({}, (err: Error | null, documents: Array<SerializedStream>) => {
                if (err) reject(err)
                else {
                    documents.onEach((it: SerializedStream) => {
                        //@ts-ignore
                        if (it["_id"]) delete it["_id"]
                    })
                    resolve(documents)
                }
            })
        )
    }

    public static async deleteStream(streamName: string): Promise<void> {
        const serializedStream: SerializedStream | undefined = await this.getSerializedStreamByName(streamName)
        const actualStream: Stream | undefined = await this.getActualStreamByName(streamName)
        if (serializedStream)
            return new Promise<void>((resolve, reject) =>
                this.streamsDatabase.remove(serializedStream, (err: Error | null) => {
                    if (err) reject(err)
                    else {
                        if (actualStream) this.actualStreams.remove(actualStream)
                        resolve()
                    }
                })
            )
    }

    public static async updateStream(streamName: string, updatedStream: Stream): Promise<SerializedStream> {
        const streamEntry: SerializedStream = updatedStream.serialize()
        return new Promise<SerializedStream>((resolve, reject) =>
            this.streamsDatabase.update({name: streamName}, streamEntry,
                {upsert: false, returnUpdatedDocs: true},
                (err: Error | null, numberOfUpdated: number, affectedDocuments: any) => {
                    if (err) reject(err)
                    else {
                        const oldStream: Stream | undefined = this.getActualStreamByName(streamName)
                        if (oldStream) this.actualStreams.update(oldStream, updatedStream)
                        const result: SerializedStream = affectedDocuments as SerializedStream
                        resolve(result)
                    }
                }
            )
        )
    }

    public static async getSerializedStreamByName(streamName: string): Promise<SerializedStream | undefined> {
        const allStreams: Array<SerializedStream> = await this.getAllSerializedStreams()
        return allStreams.find(it => it.name === streamName)
    }

    public static getActualStreamByName(streamName: string): Stream | undefined {
        return this.actualStreams.find(it => it.name === streamName)
    }
}

export class Database {
    private constructor() {}

    public static isInitialized = false

    public static Settings = Settings
    public static Streams = Streams

    public static async initialize({databasePath = getPath("database/"), defaultSettings}: {
        databasePath?: string, defaultSettings: AllSettings
    }): Promise<void> {
        const settingsDbPath = path.join(databasePath, "settings.db")
        const streamsDbPath = path.join(databasePath, "streams.db")
        await Database.Settings.initialize({dbPath: settingsDbPath, defaultSettings: defaultSettings})
        await Database.Streams.initialize({dbPath: streamsDbPath})
        this.isInitialized = true
    }

    public static async destroy(): Promise<void> {
        await Database.Streams.actualStreams.awaitForEach((stream: Stream) => stream.destroy())
    }
}