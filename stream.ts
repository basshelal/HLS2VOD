import {ChunksDownloader} from "./downloader";
import * as fs from "fs";
import * as csv from "csvtojson";
import ErrnoException = NodeJS.ErrnoException;
import Timeout = NodeJS.Timeout;

export class Stream {

    private downloader: ChunksDownloader
    private mergerTimeOut: Timeout
    private currentShow: Show
    private prevShow: Show
    private nextShow: Show

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

        this.mergerTimeOut = setInterval(() => {
            console.log("Checking!")
        }, 1000)
    }

    public startDownloading() {
    }

    public stopDownloading() {
    }

    public mergeShow() {
    }
}

export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
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

export class Show {

    constructor(public name: string,
                public day: Day,
                public hour: number,
                public minute: number,
                public startChunkName?: string,
                public endChunkName?: string,) {
    }

    public getActualDate(): Date {
        let now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.hour, this.minute)
    }

    public hasStarted(offsetSeconds?: number): boolean {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0
        let now: number = Date.now()
        return now >= (Date.parse(this.getActualDate().toString()) - offsetMillis)
    }

    public hasFinished(finishedDate: Date, offsetSeconds?: number): boolean {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0
        let now: number = Date.now()
        return now > (Date.parse(finishedDate.toString()) + offsetMillis)
    }
}