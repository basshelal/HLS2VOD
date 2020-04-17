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

    public segmentsDirectory: string = "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments"
    public downloader: Downloader
    public mergerTimeOut: Timeout
    public shows: Array<ScheduledShow>
    public currentShow: ScheduledShow
    public nextShow: ScheduledShow
    // the next time of when something important is due to happen like a merge or a start
    public nextImportantTime: number

    public isDownloading: boolean

    constructor(
        public name: string,
        public playlistUrl: string,
        schedule: Schedule,
        public offsetSeconds: number = 30
    ) {
        // in the interval we need to check if next show
        //  has started with the offset
        //  if it has that means the current show is about to end
        //  start recording the next show, take note of the segment where the change happens
        //  because we want the merge to delete as much as possible while still keeping the files needed
        //  for the next show

        // once the current show has truly ended (including offset)
        // merge all the files that it uses but only delete from its start segment to the start segment of the next show
        // even though the merge is a bit more than that because we need some of the segments later

        this.shows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds))

        this.setCurrentShow()

        this.mergerTimeOut = setInterval(() => {
            let now: number = Date.now()
            if (now > this.nextImportantTime) {
                if (this.nextShow.hasStarted(true)) {
                    print("Next show has started!")
                    print(`It is ${this.nextShow}`)
                    print(`The time now is ${moment().format(momentFormat)}`)
                    if (!this.nextShow.startChunkName)
                        this.nextShow.startChunkName = this.getLatestChunkPath()
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

    private setCurrentShow() {
        let activeShows = this.shows.filter(it => it.isActive(true))
        console.assert(activeShows.length == 1,
            `There can only be one show active! Currently shows are ${this.shows}\n\t and active shows are ${activeShows}`)
        this.currentShow = activeShows[0]
        this.nextShow = this.shows[this.shows.indexOf(this.currentShow) + 1]

        this.nextImportantTime = this.nextShow.offsetStartTime

        this.currentShow.startChunkName = this.getLatestChunkPath()
    }

    private getLatestChunkPath(): string {
        let segments: Array<string> = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + it)
        segments.sort()
        return segments[segments.length - 1]
    }

    public mergeCurrentShow() {
        this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName).then(() =>
            this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName)
        )
    }
}

export type Day = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday"

const Days: Array<Day> = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export type Schedule = Array<Show>;

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
        else now >= this.startTime
    }

    public hasEnded(withOffset: boolean = true): boolean {
        let now: number = Date.now()
        if (withOffset) return now >= this.offsetEndTime
        else now >= this.endTime
    }

    public isActive(withOffset: boolean = true): boolean {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset)
    }

    public static fromSchedule(show: Show, schedule: Schedule, offsetSeconds: number): ScheduledShow {
        let offsetMillis = offsetSeconds * 1000
        let now: Date = new Date()

        let todayDayIndex: number = now.getDay()
        let showDayIndex: number = Days.indexOf(show.day)
        let newTime: Date = now
        if (showDayIndex > todayDayIndex) {
            let differenceDays = showDayIndex - todayDayIndex
            newTime = moment().add(differenceDays, "days").toDate()
        }
        if (showDayIndex < todayDayIndex) {
            let differenceDays = todayDayIndex - showDayIndex
            let offset = Days.length - differenceDays
            newTime = moment().add(offset, "days").toDate()
        }

        let startTime: number = new Date(newTime.getFullYear(), newTime.getMonth(), newTime.getDate(), show.hour, show.minute).valueOf()
        let offsetStartTime: number = startTime - offsetMillis

        let thisShowIndex: number = schedule.indexOf(show)
        let nextShowIndex: number = thisShowIndex == schedule.length - 1 ? 0 : thisShowIndex + 1
        let nextShow = schedule[nextShowIndex]

        let nextShowDayIndex: number = Days.indexOf(nextShow.day)
        let nextShowTime: Date = now
        if (nextShowDayIndex > todayDayIndex) {
            let differenceDays = nextShowDayIndex - todayDayIndex
            nextShowTime = moment().add(differenceDays, "days").toDate()
        }
        if (nextShowDayIndex < todayDayIndex) {
            let differenceDays = todayDayIndex - nextShowDayIndex
            let offset = Days.length - differenceDays
            nextShowTime = moment().add(offset, "days").toDate()
        }

        let endTime: number = new Date(nextShowTime.getFullYear(), nextShowTime.getMonth(), nextShowTime.getDate(), nextShow.hour, nextShow.minute).valueOf()
        let offsetEndTime: number = endTime + offsetMillis

        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime)
    }

    toString(): string {
        return JSON.stringify(this, null, 2)
    }
}