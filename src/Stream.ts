import {Downloader} from "./downloader/Downloader"
import * as fs from "fs"
import csv from "csvtojson"
import {momentFormat, momentFormatSafe} from "./Utils"
import {StreamEntry} from "./Database"
import * as path from "path"
import {hideSync} from "hidefile"
import {EventEmitter} from "events"
import moment from "moment"
import {mkdirpSync} from "fs-extra"
import {assert, logD} from "./Log"

export class Stream extends EventEmitter {

    public name: string
    public playlistUrl: string
    public schedulePath: string
    public currentShow: ScheduledShow
    public nextShow: ScheduledShow
    public schedule: Schedule
    public isDownloading: boolean = false

    private streamDirectory: string
    private segmentsDirectory: string
    private downloader: Downloader
    private mergerTimeOut: number
    private nextEventTime: number
    private rootDirectory: string
    private scheduledShows: Array<ScheduledShow>
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
        this.schedule = schedule
        this.rootDirectory = rootDirectory

        this.scheduledShows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds))

        this.streamDirectory = path.join(this.rootDirectory, this.name)
        this.segmentsDirectory = path.join(this.streamDirectory, ".segments")
        mkdirpSync(this.streamDirectory)
        mkdirpSync(this.segmentsDirectory)
        this.segmentsDirectory = hideSync(this.segmentsDirectory)

        if (listener) this.addStreamListener(listener)

        this.setCurrentShow()

        this.setInterval()

    }

    public async initialize(): Promise<void> {
        const playlistUrl = await Downloader.chooseStream(this.playlistUrl)
        if (!playlistUrl) throw Error("PlaylistUrl failed!")

        this.downloader = new Downloader(playlistUrl, this.segmentsDirectory)
        this.emit("initialized")
    }

    public async destroy(): Promise<void> {
        // TODO
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

    private setInterval() {
        this.mergerTimeOut = setInterval(async () => {
            let now: number = Date.now()
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
        }, 1000)
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
        const activeShows = this.scheduledShows.filter(it => it.isActive(false))
        assert(activeShows.length == 1,
            `There can only be exactly one show active!
             Currently shows are ${this.scheduledShows.length} and active shows are ${activeShows.length}`)
        this.currentShow = activeShows[0]
        const currentShowIndex = this.scheduledShows.indexOf(this.currentShow)
        const nextIndex = currentShowIndex + 1 <= this.scheduledShows.length ? currentShowIndex + 1 : 0
        this.nextShow = this.scheduledShows[nextIndex]

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
    fromJson(jsonFilePath: string): Promise<Schedule> {
        return scheduleFromJson(jsonFilePath)
    },
    fromCSV(csvFilePath: string): Promise<Schedule> {
        return scheduleFromCsv(csvFilePath)
    }
}

function getScheduleFromFileData(data: any): Schedule {
    if (Array.isArray(data)) {
        return data.map(it => new Show(it.name, it.day.toLowerCase(), it.hour, it.minute))
    } else return []
}

async function scheduleFromJson(jsonFilePath: string): Promise<Schedule> {
    return new Promise<Schedule>((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error: NodeJS.ErrnoException, data: Buffer) => {
            if (error) reject(error)
            else resolve(getScheduleFromFileData(JSON.parse(data.toString())))
        }))
    })
}

async function scheduleFromCsv(csvFilePath: string): Promise<Schedule> {
    return new Promise<Schedule>(resolve =>
        csv().fromFile(csvFilePath).then(data => resolve(getScheduleFromFileData(data)))
    )
}

// This is how its stored on file, use Extended version for a more usable one
export class Show {
    constructor(public name: string,
                public day: Day,
                public hour: number,
                public minute: number) {
    }

    toString(): string {
        return JSON.stringify(this, null, 2)
    }
}

class ScheduledShow extends Show {

    public startChunkName: string
    public endChunkName: string

    constructor(show: Show,
                public startTime: number,
                public offsetStartTime: number,
                public endTime: number,
                public offsetEndTime: number) {
        super(show.name, show.day, show.hour, show.minute)
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

    public static fromSchedule(show: Show, schedule: Schedule, offsetSeconds: number): ScheduledShow {
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

        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime)
    }

    toString(): string {
        let obj: any = JSON.parse(JSON.stringify(this, null, 2))
        obj["startTimeFormatted"] = moment(this.startTime).format(momentFormat)
        obj["offsetStartTimeFormatted"] = moment(this.offsetStartTime).format(momentFormat)
        obj["endTimeFormatted"] = moment(this.endTime).format(momentFormat)
        obj["offsetEndTimeFormatted"] = moment(this.offsetEndTime).format(momentFormat)
        return JSON.stringify(obj, null, 2)
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