import {Downloader} from "../downloader/Downloader"
import * as fs from "fs"
import {createReadStream, createWriteStream, WriteStream} from "fs"
import csv from "csvtojson"
import {json, momentFormat, momentFormatSafe, timer} from "../utils/Utils"
import {StreamEntry} from "../Database"
import * as path from "path"
import {hideSync} from "hidefile"
import {EventEmitter} from "events"
import moment, {Duration, Moment} from "moment"
import {mkdirpSync} from "fs-extra"
import {assert, logD, logE} from "../utils/Log"

// TODO merging .ts files should (or could) be done inline instead of at the end
// TODO should be able to have multiple active shows, so we'll need a show checker and a segment writer
// TODO: Should be able to be forced to start or stop download
export class Stream extends EventEmitter {

    public name: string
    public playlistUrl: string

    public schedulePath: string
    public currentShow: Show
    public nextShow: Show
    public isDownloading: boolean = false

    private streamDirectory: string
    private segmentsDirectory: string
    private downloader: Downloader
    private mergerTimer: NodeJS.Timeout
    private nextEventTime: number
    private rootDirectory: string
    private schedule: Schedule
    private isRunning: boolean = true

    constructor({name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory, listener}: {
        name: string
        playlistUrl: string
        schedulePath: string
        schedule: Schedule
        offsetSeconds: number
        rootDirectory: string
        listener?: StreamListener
    }) {
        super()
        this.name = name
        this.playlistUrl = playlistUrl
        this.schedulePath = schedulePath
        this.rootDirectory = rootDirectory

        this.schedule = schedule.map(it => Show.fromSchedule(it, schedule, offsetSeconds))

        this.streamDirectory = path.join(this.rootDirectory, this.name)
        this.segmentsDirectory = path.join(this.streamDirectory, ".segments")
        mkdirpSync(this.streamDirectory)
        mkdirpSync(this.segmentsDirectory)
        this.segmentsDirectory = hideSync(this.segmentsDirectory)

        if (listener) this.addStreamListener(listener)

        this.setCurrentShow()

        this.mergerTimer = timer(1000, async () => {
            const now: number = Date.now()
            if (now > this.nextEventTime && this.isRunning) {
                // TODO if schedule has changed we should probably re-read it here
                this.pauseDownloading()
                this.isRunning = false
                if (this.nextShow.hasStarted(true)) {
                    logD("Next show has started!")
                    if (!this.nextShow.startChunkName)
                        this.nextShow.startChunkName = this.getLastChunkPath()
                    logD(`It is ${this.nextShow}`)
                    this.nextEventTime = this.currentShow.offsetEndTime
                }
                if (this.currentShow.hasEnded(true)) {
                    logD("Current show has ended!")
                    if (!this.currentShow.endChunkName)
                        this.currentShow.endChunkName = this.getLastChunkPath()
                    logD(`It is ${this.currentShow}`)
                    await this.mergeCurrentShow()
                    this.setCurrentShow()
                    if (!this.currentShow.startChunkName)
                        this.currentShow.startChunkName = this.getFirstChunkPath()
                }
                this.resumeDownloading()
                this.isRunning = true
            }
        })
    }

    public async initialize(): Promise<void> {
        const playlistUrl = await Downloader.chooseStream(this.playlistUrl)
        if (!playlistUrl) return logE(`Failed to initialize Stream, invalid playlistUrl\n${this.playlistUrl}`)

        this.downloader = new Downloader(playlistUrl, this.segmentsDirectory)
        this.emit("initialized")
    }

    public async destroy(): Promise<void> {
        this.emit("destroyed")
    }

    public async startDownloading(): Promise<void> {
        if (!this.isDownloading && this.downloader) {
            await this.downloader.start()
            this.isDownloading = true
            this.emit("started")
        }
    }

    public async pauseDownloading(): Promise<void> {
        if (this.isDownloading && this.downloader) {
            this.downloader.pause()
            this.isDownloading = false
            this.emit("paused")
        }
    }

    public async resumeDownloading(): Promise<void> {
        if (!this.isDownloading && this.downloader) {
            this.downloader.resume()
            this.isDownloading = true
            this.emit("resumed")
        }
    }

    public async stopDownloading(): Promise<void> {
        if (this.isDownloading && this.downloader) {
            this.downloader.stop()
            await this.downloader.merge(this.getFirstChunkPath(), this.getLastChunkPath(),
                path.join(this.streamDirectory, "_unfinished"), `${moment().format(momentFormatSafe)}.mp4`
            )
            this.downloader.deleteAllSegments()
            this.isDownloading = false
            this.emit("stopped")
        }
    }

    public async mergeCurrentShow(): Promise<void> {
        if (!this.currentShow.startChunkName) this.currentShow.startChunkName = this.getFirstChunkPath()
        if (!this.currentShow.endChunkName) this.currentShow.endChunkName = this.getLastChunkPath()
        if (this.downloader) {
            // TODO ideally we should merge all into a merged.ts in the output dir, then delete all unnecessary segments
            //  continue downloading and while doing that transmux and delete the merged.ts
            //  this way we have less downtime and more isolation
            this.emit("merging")
            await this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName,
                path.join(this.streamDirectory, this.currentShow.name), `${moment().format(momentFormatSafe)}.mp4`
            )
            this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName)
        }
    }

    private getFirstChunkPath(): string {
        const segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => path.join(this.segmentsDirectory, it))
        segments.sort()
        const result = segments[0]
        logD(`First chunk is ${result}`)
        return result
    }

    private getLastChunkPath(): string {
        const segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => path.join(this.segmentsDirectory, it))
        segments.sort()
        const result = segments[segments.length - 1]
        logD(`Last chunk is ${result}`)
        return result
    }

    public toStreamEntry(): StreamEntry {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            schedulePath: this.schedulePath
        }
    }

    emit(event: StreamEvent): boolean {
        return super.emit(event, this)
    }

    on(event: StreamEvent, listener: (stream?: Stream) => void): this {
        return super.on(event, listener)
    }

    off(event: StreamEvent, listener: (stream?: Stream) => void): this {
        return super.off(event, listener)
    }

    once(event: StreamEvent, listener: (stream?: Stream) => void): this {
        return super.once(event, listener)
    }

    public addStreamListener(listener: StreamListener) {
        if (listener.onInitialized) this.on("initialized", listener.onInitialized)
        if (listener.onDestroyed) this.on("destroyed", listener.onDestroyed)
        if (listener.onStarted) this.on("started", listener.onStarted)
        if (listener.onPaused) this.on("paused", listener.onPaused)
        if (listener.onResumed) this.on("resumed", listener.onResumed)
        if (listener.onStopped) this.on("stopped", listener.onStopped)
        if (listener.onNewCurrentShow) this.on("newCurrentShow", listener.onNewCurrentShow)
        if (listener.onMerging) this.on("merging", listener.onMerging)
    }

    private setCurrentShow() {
        const activeShows = this.schedule.filter(it => it.isActive(false))
        assert(activeShows.length == 1,
            `There can only be exactly one show active!
             Currently shows are ${this.schedule.length} and active shows are ${activeShows.length}`)
        this.currentShow = activeShows[0]
        const currentShowIndex = this.schedule.indexOf(this.currentShow)
        const nextIndex = currentShowIndex + 1 <= this.schedule.length ? currentShowIndex + 1 : 0
        this.nextShow = this.schedule[nextIndex]

        logD(`New current show is:\n${this.currentShow}`)

        this.nextEventTime = this.nextShow.offsetStartTime

        this.emit("newCurrentShow")
    }

    toString(): string {
        return JSON.stringify(this.toStreamEntry(), null, 2)
    }

    static async new({name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory, listener}: {
        name: string
        playlistUrl: string
        schedulePath: string
        schedule: Schedule
        offsetSeconds: number
        rootDirectory: string
        listener?: StreamListener
    }): Promise<Stream> {
        const stream = new Stream({name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory, listener})
        await stream.initialize()
        return stream
    }
}

export type Day = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday"

const Days: Array<Day> = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export type Schedule = Array<Show>

export const Schedule = {
    async fromJson(jsonFilePath: string): Promise<Schedule> {
        return new Promise<Schedule>((resolve, reject) => {
            fs.readFile(jsonFilePath, ((error: NodeJS.ErrnoException, data: Buffer) => {
                if (error) reject(error)
                else resolve(getScheduleFromFileData(JSON.parse(data.toString())))
            }))
        })
    },
    async fromCSV(csvFilePath: string): Promise<Schedule> {
        return new Promise<Schedule>(resolve =>
            csv().fromFile(csvFilePath).then(data => resolve(getScheduleFromFileData(data)))
        )
    }
}

function getScheduleFromFileData(data: any): Schedule {
    if (Array.isArray(data))
        return data.map(it => new Show(it.name, it.time, it.duration))
    else return []
}

export class Show {

    public startTime: number
    public offsetStartTime: number
    public endTime: number
    public offsetEndTime: number

    constructor(public name: string,
                public time: Moment,
                public duration: Duration,
                public offsetSeconds: number = 0) {

        // TODO: Calculate start and end times, we need the offsetSeconds

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

    public static fromSchedule(show: Show, schedule: Schedule, offsetSeconds: number): Show {
        const offsetMillis = offsetSeconds * 1000
        const now: Date = new Date()

        const todayDayIndex: number = now.getDay()
        const showDayIndex: number = Days.indexOf(show.day)
        let newTime: Date = now
        if (showDayIndex > todayDayIndex) {
            const differenceDays = showDayIndex - todayDayIndex
            newTime = moment().add(differenceDays, "days").toDate()
        }
        if (showDayIndex < todayDayIndex) {
            const differenceDays = todayDayIndex - showDayIndex
            const offset = Days.length - differenceDays
            newTime = moment().add(offset, "days").toDate()
        }

        const startTime: number = new Date(newTime.getFullYear(), newTime.getMonth(), newTime.getDate(), show.hour, show.minute).valueOf()
        const offsetStartTime: number = startTime - offsetMillis

        const thisShowIndex: number = schedule.indexOf(show)
        const nextShowIndex: number = thisShowIndex == schedule.length - 1 ? 0 : thisShowIndex + 1
        const nextShow = schedule[nextShowIndex]

        const nextShowDayIndex: number = Days.indexOf(nextShow.day)
        let nextShowTime: Date = now
        if (nextShowDayIndex > todayDayIndex) {
            const differenceDays = nextShowDayIndex - todayDayIndex
            nextShowTime = moment().add(differenceDays, "days").toDate()
        }
        if (nextShowDayIndex < todayDayIndex) {
            const differenceDays = todayDayIndex - nextShowDayIndex
            const offset = Days.length - differenceDays
            nextShowTime = moment().add(offset, "days").toDate()
        }

        const endTime: number = new Date(nextShowTime.getFullYear(), nextShowTime.getMonth(), nextShowTime.getDate(), nextShow.hour, nextShow.minute).valueOf()
        const offsetEndTime: number = endTime + offsetMillis

        return new Show(show, startTime, offsetStartTime, endTime, offsetEndTime)
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

export type StreamEvent =
    "initialized"
    | "destroyed"
    | "started"
    | "paused"
    | "resumed"
    | "stopped"
    | "newCurrentShow"
    | "merging"

export interface StreamListener {
    onInitialized?(stream: Stream)

    onDestroyed?(stream: Stream)

    onStarted?(stream: Stream)

    onPaused?(stream: Stream)

    onResumed?(stream: Stream)

    onStopped?(stream: Stream)

    onNewCurrentShow?(stream: Stream)

    onMerging?(stream: Stream)
}

export class FileConcatter {

    private writeStream: WriteStream

    constructor(public filePath: string) {
        this.writeStream = createWriteStream(filePath)
    }

    public concat(...filePaths: Array<string>): this {
        filePaths.forEach((file: string) => {
            createReadStream(file).pipe(this.writeStream, {end: false})
        })
        return this
    }
}