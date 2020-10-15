import {Downloader} from "../downloader/Downloader"
import * as fs from "fs"
import {createReadStream, createWriteStream, WriteStream} from "fs"
import csv from "csvtojson"
import {json, momentFormat, TimeOut, timer} from "../utils/Utils"
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

    public name: string
    public playlistUrl: string
    public scheduledShows: Array<Show>
    public activeShows: Array<Show>
    public state: StreamState
    private mainTimer: TimeOut
    // Application output directory
    public rootDirectory: string
    public streamDirectory: string
    // TODO at some point we can get rid of this below
    public segmentsDirectory: string
    public downloader: Downloader

    private constructor({name, playlistUrl, scheduledShows, offsetSeconds, rootDirectory}: {
        name: string
        playlistUrl: string
        scheduledShows: Array<Show>
        offsetSeconds: number
        rootDirectory: string
    }) {
        super()
        this.name = name
        this.playlistUrl = playlistUrl
        this.rootDirectory = rootDirectory

        this.scheduledShows = scheduledShows.map(show => Show.fromSchedule(show, scheduledShows, offsetSeconds))

        this.streamDirectory = path.join(this.rootDirectory, this.name)
        this.segmentsDirectory = path.join(this.streamDirectory, ".segments")
        mkdirpSync(this.streamDirectory)
        mkdirpSync(this.segmentsDirectory)
        this.segmentsDirectory = hideSync(this.segmentsDirectory)

        this.mainTimer = timer(5000, this.mainTimerCallback)
    }

    public async initialize(): Promise<void> {
        const playlistUrl = await Downloader.chooseStream(this.playlistUrl)
        if (!playlistUrl) return logE(`Failed to initialize Stream, invalid playlistUrl:\n${this.playlistUrl}`)

        this.downloader = new Downloader(playlistUrl, this.segmentsDirectory)
        this.downloader.onDownloadSegment = this.onDownloadSegment
    }

    private async onDownloadSegment(segmentPath: string) {
        // A segment has been downloaded
        // get active shows (find where the segment needs to be concatted)
        // conact to each show
        // delete segment
        if (this.state !== "paused") {
            this.activeShows.forEach((show: Show) => {
                if (show.isActive(true))
                    show.fileConcatter.concatFromFile(segmentPath)
            })
            removeSync(segmentPath)
        }
    }

    private async mainTimerCallback() {
        // Manage active shows
        this.scheduledShows.forEach((show: Show) => {
            if (show.isActive(true) && this.activeShows.notContains(show)) {
                this.activeShows.push(show)
                // Show has started
                show.fileConcatter.masterFilePath = path.join(this.streamDirectory, show.name)
            } else if (!show.isActive(true) && this.activeShows.contains(show)) {
                this.activeShows.remove(show)
                // Show has finished
            }
        })
        if (this.activeShows.isEmpty() && this.state === "downloading") this.state = "waiting"
        else if (this.activeShows.isNotEmpty() && this.state === "waiting") this.state = "downloading"
    }

    public async start(): Promise<void> {
        await this.downloader.start()
        if (this.state === "paused")
            if (this.activeShows.isEmpty()) this.state = "waiting"
            else this.state = "downloading"
    }

    public async pause(): Promise<void> {
        await this.downloader.pause()
        this.state = "paused"
    }

    public toStreamEntry(): StreamEntry {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            schedulePath: "null" // TODO: Remove this function
        }
    }

    emit(event: StreamState): boolean {
        return super.emit(event, this)
    }

    on(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.on(event, listener)
    }

    off(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.off(event, listener)
    }

    once(event: StreamState, listener: (stream?: Stream) => void): this {
        return super.once(event, listener)
    }

    toString(): string {
        return json(this.toStreamEntry(), 2)
    }

    static async new({name, playlistUrl, scheduledShows, offsetSeconds, rootDirectory}: {
        name: string
        playlistUrl: string
        scheduledShows: Array<Show>
        offsetSeconds: number
        rootDirectory: string
    }): Promise<Stream> {
        const stream = new Stream({name, playlistUrl, scheduledShows, offsetSeconds, rootDirectory})
        await stream.initialize()
        return stream
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

    public static fromSchedule(show: Show, schedule: Array<Show>, offsetSeconds: number): Show {
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

export type StreamState =
/** Actively downloading segments */
    "downloading"
    /** Ready to download but waiting for shows to be active */
    | "waiting"
    /** Not downloading, even if shows are active */
    | "paused"

// Concats data to a single file
export class FileConcatter {

    private writeStream: WriteStream

    constructor(public masterFilePath: string) {
        this.writeStream = createWriteStream(masterFilePath)
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