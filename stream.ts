import {Downloader, downloaders, StreamChooser} from "./downloader";
import * as fs from "fs";
import * as fsextra from "fs-extra";
import * as csv from "csvtojson";
import * as moment from "moment";
import {print} from "./utils";
import {momentFormat, momentFormatSafe} from "./main";
import ErrnoException = NodeJS.ErrnoException;
import Timeout = NodeJS.Timeout;

export class Stream {

    private segmentsDirectory: string = "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments"
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
        offsetSeconds: number
    ) {

        this.shows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds))

        this.setCurrentShow()

        this.mergerTimeOut = setInterval(() => {
            let now: number = Date.now()
            if (now > this.nextEventTime) {
                // TODO if schedule has changed we should probably re-read it here
                if (this.nextShow.hasStarted(true)) {
                    print("Next show has started!")
                    print(`It is ${this.nextShow}`)
                    print(`The time now is ${moment().format(momentFormat)}`)
                    if (!this.nextShow.startChunkName)
                        this.nextShow.startChunkName = this.getLatestChunkPath()
                    this.nextEventTime = this.currentShow.offsetEndTime
                }
                if (this.currentShow.hasEnded(true)) {
                    print("Current show has ended!")
                    print(`It is ${this.currentShow}`)
                    print(`The time now is ${moment().format(momentFormat)}`)
                    if (!this.currentShow.endChunkName)
                        this.currentShow.endChunkName = this.getLatestChunkPath()
                    this.mergeCurrentShow()
                    this.setCurrentShow()
                }
            }
        }, 1000)
    }

    public async startDownloading(): Promise<void> {
        this.segmentsDirectory = "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments"
        const runId = moment().format(momentFormatSafe)
        const segmentsDir: string = this.segmentsDirectory + `/${this.name}-${runId}/`

        // Create target directory
        fsextra.mkdirpSync(segmentsDir)

        // Choose proper stream
        const streamChooser = new StreamChooser(this.playlistUrl)
        if (!await streamChooser.load()) return

        const playlistUrl = streamChooser.getPlaylistUrl("best")
        if (!playlistUrl) return

        // Start download
        let downloader = new Downloader(playlistUrl, segmentsDir)
        downloader.onDownloadSegment = () => {
            if (!this.nextShow.startChunkName)
                this.nextShow.startChunkName = this.getLatestChunkPath()
        }
        this.downloader = downloader
        downloaders.push(downloader)
        this.isDownloading = true
        return await downloader.start()
    }

    public async stopDownloading() {
        this.downloader.stop()
        this.downloader.mergeAll()
        this.isDownloading = false
    }

    public mergeCurrentShow() {
        if (this.downloader)
            this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName).then(() =>
                this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName)
            )
    }

    private getLatestChunkPath(): string {
        let segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + it)
        segments.sort()
        return segments[segments.length - 1]
    }

    private setCurrentShow() {
        let activeShows = this.shows.filter(it => it.isActive(false))
        console.assert(activeShows.length == 1,
            `There can only be exactly one show active!
             Currently shows are ${this.shows.length} and active shows are ${activeShows.length}`)
        this.currentShow = activeShows[0]
        this.nextShow = this.shows[this.shows.indexOf(this.currentShow) + 1]

        print(this.currentShow)

        this.nextEventTime = this.nextShow.offsetStartTime

        this.currentShow.startChunkName = this.getLatestChunkPath()
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