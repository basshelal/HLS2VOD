import {createReadStream, createWriteStream, WriteStream} from "fs"
import {fileMoment, json, timer} from "../shared/Utils"
import * as path from "path"
import {mkdirpSync, removeSync} from "fs-extra"
import {Ffmpeg} from "./downloader/Ffmpeg"
import {Show, ShowEntry} from "./Show"
import {TimeOut} from "../shared/Types"
import {StreamDownloader} from "./downloader/StreamDownloader"
import {Serializable} from "../shared/Serializable"

export interface SerializedStream {
    name: string
    playlistUrl: string
    state: StreamState
    schedulePath?: string
    scheduledShows: Array<ShowEntry>
    isForced: boolean
    streamDirectory: string
}

export type StreamState =
/** Actively downloading segments */
    "downloading"
    /** Ready to download but waiting for shows to be active */
    | "waiting"
    /** Not downloading, even if shows are active */
    | "paused"

export class Stream
    implements Serializable<SerializedStream> {

    /** Name of stream, must be unique so can be used as identifier */
    public name: string

    /** Url of m3u8 playlist, this is used by {@link downloader} */
    public playlistUrl: string

    /** The list of shows that have a scheduled time, see {@link Show} */
    public scheduledShows: Array<Show>

    /** The list of shows that are currently active, ie, should be recorded */
    public activeShows: Array<Show>

    /** Has the user forced to record even when no shows active? */
    public isForced: boolean

    /** The {@link FileConcatter} to use when forced to record */
    public forcedFileConcatter: FileConcatter | null

    /** Current state of Stream, see {@link StreamState} */
    public state: StreamState

    /** The {@link TimeOut} that currently manages {@link activeShows} */
    public mainTimer: TimeOut

    /** Milliseconds used for {@link mainTimer}*/
    public mainTimerIntervalMs: number

    /** Directory where this stream will be downloaded */
    public streamDirectory: string

    public forcedDownloader: StreamDownloader

    /** Private because of async initializer code, use {@link new} instead */
    public constructor({name, playlistUrl, scheduledShows, offsetSeconds, outputDirectory}: {
        name: string
        playlistUrl: string
        scheduledShows: Array<Show>
        offsetSeconds: number
        outputDirectory: string
    }) {
        this.name = name
        this.playlistUrl = playlistUrl
        this.scheduledShows = scheduledShows.map(show => show.setOffsetSeconds(offsetSeconds))
        this.activeShows = new Array<Show>()
        this.isForced = false
        this.forcedFileConcatter = null
        this.state = "waiting" // anything other than "paused"
        this.mainTimerIntervalMs = 5000
        this.mainTimer = timer(this.mainTimerIntervalMs, this.mainTimerCallback)
        this.streamDirectory = path.join(outputDirectory, this.name)
        mkdirpSync(this.streamDirectory)
    }

    private onDownloadSegment = (arrayBuffer: ArrayBuffer) => {
        // A segment has been downloaded, lets send it to where it needs to go
        if (this.state !== "paused") {
            // Send segment to active shows if we're not paused
            this.activeShows.forEach((show: Show) => {
                if (show.isActive(true)) // this is just a safety, should always be true
                    show.fileConcatter.concatData(arrayBuffer)
            })
        }
        if (this.isForced && this.forcedFileConcatter) {
            this.forcedFileConcatter.concatData(arrayBuffer)
        }
    }

    private mainTimerCallback = () => {
        // Manage active shows
        this.scheduledShows.forEach((show: Show) => {
            if (show.isActive(true) && this.activeShows.notContains(show)) {
                this.activeShows.push(show)
                // Show has started
                show.fileConcatter.initialize()
            } else if (!show.isActive(true) && this.activeShows.contains(show)) {
                this.activeShows.remove(show)
                // Show has finished
                show.fileConcatter.end()
                Ffmpeg.transmuxTsToMp4(show.fileConcatter.masterFilePath, show.fileConcatter.masterFilePath + ".mp4")
                removeSync(show.fileConcatter.masterFilePath)
            }
        })
        if (this.activeShows.isEmpty() && this.state === "downloading") this.state = "waiting"
        else if (this.activeShows.isNotEmpty() && this.state === "waiting") this.state = "downloading"
    }

    /** Indicates we are now ready to begin downloading shows when they become active */
    public async start(): Promise<void> {
        if (this.state === "paused")
            if (this.activeShows.isEmpty()) this.state = "waiting"
            else this.state = "downloading"
    }

    /** Indicates we want to pause downloading shows even if they are active */
    public async pause(): Promise<void> {
        this.state = "paused"
    }

    /** Indicates we want to download stream anyway even if there are no active shows */
    public async forceRecord(): Promise<void> {
        await this.start()
        this.isForced = true
        this.forcedFileConcatter = new FileConcatter(path.join(this.streamDirectory, `${fileMoment()}.ts`))
        this.forcedFileConcatter.initialize()
    }

    /** Indicates we want to go back to normal behavior, ie download only when there are active shows */
    public async unForceRecord(): Promise<void> {
        this.isForced = false
        await this.forcedFileConcatter.end()
        await Ffmpeg.transmuxTsToMp4(this.forcedFileConcatter.masterFilePath, this.forcedFileConcatter.masterFilePath + ".mp4")
        removeSync(this.forcedFileConcatter.masterFilePath)
        this.forcedFileConcatter = null
    }

    /*override*/
    public serialize(): SerializedStream {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            state: this.state,
            scheduledShows: this.scheduledShows.map(show => show.toShowEntry()),
            isForced: this.isForced,
            streamDirectory: this.streamDirectory
        }
    }

    public toString(): string { return json(this, 2) }

    public static async fromStreamEntry(streamEntry: SerializedStream): Promise<Stream> {
        return Stream.new({
            name: streamEntry.name,
            playlistUrl: streamEntry.playlistUrl,
            scheduledShows: await Promise.all(streamEntry.scheduledShows.map(async (showEntry) => await Show.fromShowEntry(showEntry))),
            offsetSeconds: 0
        })
    }
}

// Concats data to a single file
export class FileConcatter {

    public writeStream: WriteStream

    constructor(public masterFilePath: string) {}

    public initialize(): this {
        this.writeStream = createWriteStream(this.masterFilePath)
        return this
    }

    public async concatFromFile(...filePaths: Array<string>): Promise<this> {
        await Promise.all(filePaths.map((file: string) => (
            new Promise((resolve, reject) => {
                createReadStream(file).pipe(this.writeStream, {end: false})
                    .on("finish", resolve)
                    .on("error", reject)
            }))
        ))
        return this
    }

    public async concatData(data: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.writeStream.write(data, (error: Error) => {
                if (error) reject(error)
                else resolve()
            })
        })
    }

    public async end(): Promise<void> {
        return new Promise<void>((resolve) => this.writeStream.end(() => resolve()))
    }
}