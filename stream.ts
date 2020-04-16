import {ChunksDownloader} from "./downloader";
import * as fs from "fs";
import * as csv from "csvtojson";
import ErrnoException = NodeJS.ErrnoException;
import Timeout = NodeJS.Timeout;

export class Stream {

    private downloader: ChunksDownloader
    private mergerTimeOut: Timeout
    private currentShow: ScheduledShow
    private nextShow: ScheduledShow
    // the next time of when something important is due to happen like a merge or a start
    private nextImportantTime: number
    private shows: Array<ScheduledShow>

    constructor(
        public name: string,
        public playlistUrl: string,
        public schedule: Schedule,
        public offsetSeconds: number = 30
    ) {
        // get the current show based on the time now
        // prev show is null
        // next show is what is next in the schedule

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

        // Set the currentShow, this is the show that has started but has not yet finished
        // TODO fix this later
        this.currentShow = this.shows[0]
        this.nextShow = this.shows[1] // the one after the current

        this.nextImportantTime = this.nextShow.startTime

        this.mergerTimeOut = setInterval(this.onInterval, 1000)
    }

    public onInterval() {
        if (this.nextImportantTime > Date.now()) {

            // check why we're here, what has cause this? a start an end or what?

            // importantTime is only a show start (with offset) and a show end (with offset)
            // with end making that show merged, deleted and change current and next show
            // start probably does very little tbh
        }
    }

    public startDownloading() {
    }

    public stopDownloading() {
    }

    public mergeCurrentShow() {
        // TODO ensure that the show finished!
        this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName).then(() =>
            this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName)
        )
    }
}

export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

function dayToIndex(day: Day): number {
    switch (day) {
        case "sunday":
            return 0
        case "monday":
            return 1
        case "tuesday":
            return 2
        case "wednesday":
            return 3
        case "thursday":
            return 4
        case "friday":
            return 5
        case "saturday":
            return 6
    }
}

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
}

class ScheduledShow extends Show {

    public startChunkName: string
    public endChunkName: string

    constructor(show: Show,
                public startTime: number,
                public offsetStartTime: number,
                public endTime: number,
                public offsetEndTime: number) {
        super(show.name, show.day, show.hour, show.minute);
    }


    public static fromSchedule(show: Show, schedule: Schedule, offsetSeconds: number): ScheduledShow {
        // TODO we're not considering day of the week yet!
        //  the main problem is we need to figure out which day number it is for any given day of the week
        let offsetMillis = offsetSeconds * 1000
        let now: Date = new Date()
        let startTime: number = new Date(now.getFullYear(), now.getMonth(), now.getDate(), show.hour, show.minute).valueOf()
        let offsetStartTime: number = startTime - offsetMillis

        let thisIndex: number = schedule.indexOf(show)
        let nextIndex: number = thisIndex == schedule.length - 1 ? 0 : thisIndex + 1
        let nextShow = schedule[nextIndex]

        let endTime: number = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextShow.hour, nextShow.minute).valueOf()
        let offsetEndTime: number = endTime + offsetMillis

        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime)
    }

}