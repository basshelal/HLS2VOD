import {ChunksDownloader} from "./downloader";
import * as fs from "fs";
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
        return scheduleFromJson(jsonFilePath);
    }
};

async function scheduleFromJson(jsonFilePath: string): Promise<Schedule> {
    return new Promise<Schedule>((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error: ErrnoException, data: Buffer) => {
            if (error) reject(error);
            else {
                let result: Array<Show> = []
                let array = JSON.parse(data.toString());

                if (Array.isArray(array)) {
                    result = array.map(it => new Show(it.name, it.date))
                }
                resolve(result);
            }
        }))
    });
}

export class Show {

    constructor(public name: string,
                public date: DayTime,
                public startChunkName?: string,
                public endChunkName?: string,) {
    }

    public getActualDate(): Date {
        let now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(),
            this.date.time.hour, this.date.time.minute);
    }

    public hasStarted(offsetSeconds?: number): boolean {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0;
        let now: number = Date.now();
        return now >= (Date.parse(this.getActualDate().toString()) - offsetMillis);
    }

    public hasFinished(finishedDate: Date, offsetSeconds?: number): boolean {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0;
        let now: number = Date.now();
        return now > (Date.parse(finishedDate.toString()) + offsetMillis);
    }
}