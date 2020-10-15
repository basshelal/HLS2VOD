import {Downloader} from "../downloader/Downloader"
import * as fs from "fs"
import {createReadStream, createWriteStream, WriteStream} from "fs"
import csv from "csvtojson"
import {json, momentFormat, momentFormatSafe, TimeOut, timer} from "../utils/Utils"
import {Database, StreamEntry} from "../Database"
import * as path from "path"
import {hideSync} from "hidefile"
import {EventEmitter} from "events"
import moment, {Duration, Moment} from "moment"
import {mkdirpSync, removeSync} from "fs-extra"
import {logE} from "../utils/Log"

// TODO merging .ts files should (or could) be done inline instead of at the end
// TODO should be able to have multiple active shows, so we'll need a show checker and a segment writer
// TODO: Should be able to be forced to start or stop download
export class Stream extends EventEmitter {

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

    // TODO at some point we can get rid of this below
    public segmentsDirectory: string

    /** The {@link Downloader} that downloads segments from the {@link playlistUrl} */
    public downloader: Downloader

    /** Private because of async initializer code, use {@link new} instead */
    private constructor({name, playlistUrl, scheduledShows, offsetSeconds}: {
        name: string
        playlistUrl: string
        scheduledShows: Array<Show>
        offsetSeconds: number
    }) {
        super()
        this.name = name
        this.playlistUrl = playlistUrl
        this.scheduledShows = scheduledShows.map(show => show.setOffsetSeconds(offsetSeconds))
        this.activeShows = []
        this.isForced = false
        this.forcedFileConcatter = null
        this.state = "waiting" // anything other than "paused"
        this.mainTimerIntervalMs = 5000
        this.mainTimer = timer(this.mainTimerIntervalMs, this.mainTimerCallback)

        this.streamDirectory = path.join(Database.getOutputDirectory(), this.name)
        this.segmentsDirectory = path.join(this.streamDirectory, ".segments")
        mkdirpSync(this.streamDirectory)
        mkdirpSync(this.segmentsDirectory)
        this.segmentsDirectory = hideSync(this.segmentsDirectory)

    }

    /**
     * Must be called after creation! {@link new} does this for us
     * Only after this function is complete (successfully) can we begin downloading
     */
    private async initialize(): Promise<this> {
        // Initialize downloader
        const playlistUrl = await Downloader.chooseStream(this.playlistUrl)
        if (!playlistUrl)
            throw logE(`Failed to initialize Stream, invalid playlistUrl:\n${this.playlistUrl}`)

        this.downloader = new Downloader(playlistUrl, this.segmentsDirectory)
        this.downloader.onDownloadSegment = this.onDownloadSegment
        return this
    }

    // TODO: Ideally we'd like to write data from the download and not from the file
    private async onDownloadSegment(segmentPath: string) {
        // A segment has been downloaded, lets send it to where it needs to go
        if (this.state !== "paused") {
            // Send segment to active shows if we're not paused
            this.activeShows.forEach((show: Show) => {
                if (show.isActive(true)) // this is just a safety, should always be true
                    show.fileConcatter.concatFromFile(segmentPath)
            })
        }
        if (this.isForced && this.forcedFileConcatter) {
            this.forcedFileConcatter.concatFromFile(segmentPath)
        }
        // Delete segment, we're done with it
        removeSync(segmentPath)
    }

    private async mainTimerCallback() {
        // Manage active shows
        this.scheduledShows.forEach(async (show: Show) => {
            if (show.isActive(true) && this.activeShows.notContains(show)) {
                this.activeShows.push(show)
                // Show has started
                show.fileConcatter.initialize()
            } else if (!show.isActive(true) && this.activeShows.contains(show)) {
                this.activeShows.remove(show)
                // Show has finished
                show.fileConcatter.end()
            }
        })
        if (this.activeShows.isEmpty() && this.state === "downloading") this.state = "waiting"
        else if (this.activeShows.isNotEmpty() && this.state === "waiting") this.state = "downloading"
    }

    /** Indicates we are now ready to begin downloading shows when they become active */
    public async start(): Promise<void> {
        await this.downloader.start()
        if (this.state === "paused")
            if (this.activeShows.isEmpty()) this.state = "waiting"
            else this.state = "downloading"
    }

    /** Indicates we want to pause downloading shows even if they are active */
    public async pause(): Promise<void> {
        await this.downloader.pause()
        this.state = "paused"
    }

    /** Indicates we want to download stream anyway even if there are no active shows */
    public async forceRecord(): Promise<void> {
        await this.start()
        this.isForced = true
        this.forcedFileConcatter = new FileConcatter(path.join(this.streamDirectory, `${momentFormatSafe}.ts`))
        this.forcedFileConcatter.initialize()
    }

    /** Indicates we want to go back to normal behavior, ie download only when there are active shows */
    public async unForceRecord(): Promise<void> {
        this.isForced = false
        await this.forcedFileConcatter.end()
        this.forcedFileConcatter = null
    }

    // TODO: Remove this function
    public toStreamEntry(): StreamEntry {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            schedulePath: "null"
        }
    }

    public emit(event: StreamState): boolean {
        return super.emit(event, this)
    }

    public on(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.on(event, listener)
    }

    public off(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.off(event, listener)
    }

    public once(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.once(event, listener)
    }

    public toString(): string { return json(this, 2) }

    /** The correct way to instantiate a {@link Stream}, does all the initialization for us */
    public static async new({name, playlistUrl, scheduledShows, offsetSeconds}: {
        name: string
        playlistUrl: string
        scheduledShows: Array<Show>
        offsetSeconds: number
    }): Promise<Stream> {
        return await (new Stream({name, playlistUrl, scheduledShows, offsetSeconds})).initialize()
    }
}

export const Schedule = {
    async fromJson(jsonFilePath: string): Promise<Array<Show>> {
        return new Promise<Array<Show>>((resolve, reject) => {
            fs.readFile(jsonFilePath, ((error: NodeJS.ErrnoException, data: Buffer) => {
                if (error) reject(error)
                else resolve(getScheduleFromFileData(JSON.parse(data.toString())))
            }))
        })
    },
    async fromCSV(csvFilePath: string): Promise<Array<Show>> {
        return new Promise<Array<Show>>(resolve =>
            csv().fromFile(csvFilePath).then(data => resolve(getScheduleFromFileData(data)))
        )
    }
}

function getScheduleFromFileData(data: any): Array<Show> {
    if (Array.isArray(data))
        return data.map(it => new Show(it.name, it.time, it.duration))
    else return []
}

export class Show {

    public startTime: number
    public offsetStartTime: number
    public endTime: number
    public offsetEndTime: number
    public fileConcatter: FileConcatter

    constructor(public name: string,
                public time: Moment,
                public duration: Duration,
                public offsetSeconds: number = 0) {

        // TODO: File concatter needs the file! Join the file name as well
        this.fileConcatter = new FileConcatter(path.join(Database.getOutputDirectory(), this.name))

        // TODO: Calculate start and end times, we need the offsetSeconds

        // Time is in day HH:mm format => Monday 23:59
        moment(5, "HH:mm")
        moment.duration()
    }

    public hasStarted(withOffset: boolean = true): boolean {
        let now: number = Date.now()
        if (withOffset) return now >= this.offsetStartTime
        else return now >= this.startTime
    }

    public hasEnded(withOffset: boolean = true): boolean {
        let now: number = Date.now()
        if (withOffset) return now >= this.offsetEndTime
        else return now >= this.endTime
    }

    public isActive(withOffset: boolean = true): boolean {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset)
    }

    public setOffsetSeconds(value: number): this {
        // TODO: Implement!
        return this
    }

    public toString(): string {
        const obj: any = JSON.parse(json(this, 2))
        obj["startTimeFormatted"] = moment(this.startTime).format(momentFormat)
        obj["offsetStartTimeFormatted"] = moment(this.offsetStartTime).format(momentFormat)
        obj["endTimeFormatted"] = moment(this.endTime).format(momentFormat)
        obj["offsetEndTimeFormatted"] = moment(this.offsetEndTime).format(momentFormat)
        return json(obj, 2)
    }
}

export type StreamState =
/** Actively downloading segments */
    "downloading"
    /** Ready to download but waiting for shows to be active */
    | "waiting"
    /** Not downloading, even if shows are active */
    | "paused"

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