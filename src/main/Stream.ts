import {Downloader} from "./downloader/Downloader"
import * as fs from "fs"
import {createReadStream, createWriteStream, WriteStream} from "fs"
import csv from "csvtojson"
import {fileMoment, json, momentFormat, promises, TimeOut, timer} from "../shared/utils/Utils"
import {Database} from "./Database"
import * as path from "path"
import {EventEmitter} from "events"
import moment, {duration, Duration, Moment} from "moment"
import {mkdirpSync, removeSync} from "fs-extra"
import {Ffmpeg} from "./downloader/Ffmpeg"

export interface StreamEntry {
    name: string
    playlistUrl: string
    state: StreamState
    schedulePath?: string
    scheduledShows: Array<ShowEntry>
    isForced: boolean
    streamDirectory: string
}

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
        this.activeShows = new Array<Show>()
        this.isForced = false
        this.forcedFileConcatter = null
        this.state = "waiting" // anything other than "paused"
        this.mainTimerIntervalMs = 5000
        this.mainTimer = timer(this.mainTimerIntervalMs, this.mainTimerCallback)
    }

    /**
     * Must be called after creation! {@link new} does this for us
     * Only after this function is complete (successfully) can we begin downloading
     */
    private async initialize(): Promise<this> {
        // Initialize directories
        this.streamDirectory = path.join(await Database.Settings.getOutputDirectory(), this.name)
        mkdirpSync(this.streamDirectory)

        // Initialize downloader
        this.downloader = await Downloader.new(this.playlistUrl)
        this.downloader.onDownloadSegment = this.onDownloadSegment

        return this
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

    public toStreamEntry(): StreamEntry {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            state: this.state,
            scheduledShows: this.scheduledShows.map(show => show.toShowEntry()),
            isForced: this.isForced,
            streamDirectory: this.streamDirectory
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

    public static async fromStreamEntry(streamEntry: StreamEntry): Promise<Stream> {
        return Stream.new({
            name: streamEntry.name,
            playlistUrl: streamEntry.playlistUrl,
            scheduledShows: await Promise.all(streamEntry.scheduledShows.map(async (showEntry) => await Show.fromShowEntry(showEntry))),
            offsetSeconds: 0
        })
    }
}

export class Schedule {
    private constructor() {}

    public static async fromJson(jsonFilePath: string): Promise<Array<Show>> {
        return new Promise<Array<Show>>((resolve, reject) => {
            fs.readFile(jsonFilePath, ((error: NodeJS.ErrnoException, data: Buffer) => {
                if (error) reject(error)
                else getScheduleFromFileData(JSON.parse(data.toString())).then(it => resolve(it))
            }))
        })
    }

    public static async fromCSV(csvFilePath: string): Promise<Array<Show>> {
        const jsonFromCSV = await csv().fromFile(csvFilePath)
        return await getScheduleFromFileData(jsonFromCSV)
    }
}

async function getScheduleFromFileData(data: any): Promise<Array<Show>> {
    if (Array.isArray(data))
        return promises(...data.filter(it => it.name && it.startTime && it.durationMinutes)
            .map((it) => Show.fromFile({name: it.name, time: it.startTime, duration: it.durationMinutes})))
    else return []
}

export interface ShowEntry {
    name: string
    startTime: number
    offsetStartTime: number
    endTime: number
    offsetEndTime: number
}

export class Show {

    public startTime: number
    public offsetStartTime: number
    public endTime: number
    public offsetEndTime: number
    public fileConcatter: FileConcatter

    private constructor(public name: string,
                        public time: Moment,
                        public duration: Duration,
                        public offsetSeconds: number = 0) {

        this.startTime = time.date()
        this.endTime = time.add(duration).date()
        this.setOffsetSeconds(offsetSeconds)
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
        this.offsetSeconds = value
        this.offsetStartTime = moment(this.startTime).subtract(value, "seconds").date()
        this.offsetEndTime = moment(this.endTime).add(value, "seconds").date()
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

    public async initialize(): Promise<this> {
        this.fileConcatter = new FileConcatter(path.join(await Database.Settings.getOutputDirectory(), this.name, `${fileMoment()}`))
        return this
    }

    public toShowEntry(): ShowEntry {
        return {
            name: this.name,
            startTime: this.startTime,
            offsetStartTime: this.offsetStartTime,
            endTime: this.endTime,
            offsetEndTime: this.offsetEndTime
        }
    }

    public static async new({name, time, duration, offsetSeconds = 0}: {
        name: string
        time: Moment
        duration: Duration
        offsetSeconds?: number
    }): Promise<Show> {
        return await (new Show(name, time, duration, offsetSeconds)).initialize()
    }

    public static async fromShowEntry(showEntry: ShowEntry): Promise<Show> {
        const show = await Show.new({
            name: showEntry.name,
            time: moment(showEntry.startTime),
            duration: duration()
        })
        show.startTime = showEntry.startTime
        show.offsetStartTime = showEntry.offsetStartTime
        show.endTime = showEntry.endTime
        show.offsetEndTime = showEntry.offsetEndTime
        return show
    }

    public static async fromFile({name, time, duration}: { name: string, time: string, duration: string }): Promise<Show> {
        const startTime = moment(time, "dddd HH:mm")
        const momentDuration = moment.duration(duration, "minutes")
        return await Show.new({name: name, time: startTime, duration: momentDuration})
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