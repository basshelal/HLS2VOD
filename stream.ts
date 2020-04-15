import {ChunksDownloader} from "./downloader";
import * as fs from "fs";
import * as csv from "csvtojson";
import ErrnoException = NodeJS.ErrnoException;
import Timeout = NodeJS.Timeout;

export class Stream {

    private downloader: ChunksDownloader
    private mergerTimeOut: Timeout
    private currentShow: Show
    private otherShow: Show

    constructor(
        public name: string,
        public playlistUrl: string,
        public schedule: Schedule,
        public offsetSeconds: number = 30
    ) {
        this.mergerTimeOut = setInterval(() => {
            console.log("Checking!")
        }, 1000)
    }

}

export type DayTime = { day: Day, time: Time };
export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type Time = { hour: number, minute: number };
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