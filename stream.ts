import {Downloader, StreamChooser} from "./downloader/downloader";
import * as fs from "fs";
import * as fsextra from "fs-extra";
import * as csv from "csvtojson";
import * as moment from "moment";
import {logD} from "./utils";
import {momentFormat, momentFormatSafe} from "./main";
import ErrnoException = NodeJS.ErrnoException;
import Timeout = NodeJS.Timeout;

export class Stream {

    private streamDirectory: string
    private segmentsDirectory: string
    private downloader: Downloader
    private shows: Array<ScheduledShow>
    private currentShow: ScheduledShow
    private nextShow: ScheduledShow
    private mergerTimeOut: Timeout
    private nextEventTime: number

    public isDownloading: boolean

    constructor(
        public name: string,
        public playlistUrl: string,
        public schedulePath: string,
        public schedule: Schedule,
        offsetSeconds: number,
        private rootDirectory: string
    ) {

        this.shows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds))

        this.streamDirectory = this.rootDirectory + `/${this.name}`
        this.segmentsDirectory = this.streamDirectory + `/segments`
        fsextra.mkdirpSync(this.streamDirectory)
        fsextra.mkdirpSync(this.segmentsDirectory)

        this.setCurrentShow()

        this.mergerTimeOut = setInterval(() => {
            let now: number = Date.now()
            if (now > this.nextEventTime) {
                // TODO if schedule has changed we should probably re-read it here
                if (this.nextShow.hasStarted(true)) {
                    this.downloader.pause()
                    this.nextShow.startChunkName = this.getLastChunkPath()
                    logD("Next show has started!")
                    logD(`It is ${this.nextShow}`)
                    this.nextEventTime = this.currentShow.offsetEndTime
                    this.downloader.resume()
                }
                if (this.currentShow.hasEnded(true)) {
                    this.downloader.pause()
                    this.currentShow.endChunkName = this.getLastChunkPath()
                    logD("Current show has ended!")
                    logD(`It is ${this.currentShow}`)
                    this.mergeCurrentShow().then(() => {
                            this.setCurrentShow()
                            this.currentShow.startChunkName = this.getFirstChunkPath()
                            this.downloader.resume()
                        }
                    )
                }
            }
        }, 1000)

    }

    public static async new(
        name: string,
        playlistUrl: string,
        schedulePath: string,
        schedule: Schedule,
        offsetSeconds: number,
        rootDirectory: string): Promise<Stream> {
        let stream = new Stream(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory)
        await stream.initialize()
        return stream
    }

    public initialize(): Promise<void> {
        return this.initializeDownloader()
    }

    public async startDownloading(): Promise<void> {
        await this.downloader.start()
        this.isDownloading = true
    }

    public async stopDownloading() {
        this.downloader.stop()
        await this.downloader.mergeAll()
        this.isDownloading = false
    }

    public async mergeCurrentShow() {
        if (!this.currentShow.startChunkName) this.currentShow.startChunkName = this.getFirstChunkPath()
        if (!this.currentShow.endChunkName) this.currentShow.startChunkName = this.getLastChunkPath()
        if (this.downloader) {
            await this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName,
                `${this.streamDirectory}/${this.currentShow.name}`, `${moment().format(momentFormatSafe)}.mp4`
            ).then(() =>
                this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName)
            )
        }
    }

    private async initializeDownloader(): Promise<void> {
        const streamChooser = new StreamChooser(this.playlistUrl)
        if (!await streamChooser.load()) throw Error("StreamChooser failed!")

        const playlistUrl = streamChooser.getPlaylistUrl("best")
        if (!playlistUrl) throw Error("PlaylistUrl failed!")

        this.downloader = new Downloader(playlistUrl, this.segmentsDirectory)
    }

    private getFirstChunkPath(): string {
        let segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + "/" + it)
        segments.sort()
        let result = segments[0]
        logD(`First chunk is ${result}`)
        return result
    }

    private getLastChunkPath(): string {
        let segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + "/" + it)
        segments.sort()
        let result = segments[segments.length - 1]
        logD(`Last chunk is ${result}`)
        return result
    }

    private setCurrentShow() {
        let activeShows = this.shows.filter(it => it.isActive(false))
        console.assert(activeShows.length == 1,
            `There can only be exactly one show active!
             Currently shows are ${this.shows.length} and active shows are ${activeShows.length}`)
        this.currentShow = activeShows[0]
        this.nextShow = this.shows[this.shows.indexOf(this.currentShow) + 1]

        logD(`New current show is:\n${this.currentShow}`)

        this.nextEventTime = this.nextShow.offsetStartTime
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
};

function getScheduleFromFileData(data: any): Schedule {
    if (Array.isArray(data)) {
        return data.map(it => new Show(it.name, it.day.toLowerCase(), it.hour, it.minute))
    } else return []
}

async function scheduleFromJson(jsonFilePath: string): Promise<Schedule> {
    return new Promise<Schedule>((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error: ErrnoException, data: Buffer) => {
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