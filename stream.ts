import {ChunksDownloader} from "./downloader";
import * as fs from "fs";
import ErrnoException = NodeJS.ErrnoException;

export class Stream {

    private downloader: ChunksDownloader

    constructor(
        public name: string,
        public playlistUrl: string,
        public schedule: Schedule,
        public offsetSeconds: number = 30
    ) {
    }

}

export type DayTime = { day: Day, time: Time };
export type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type Time = { hour: number, minute: number };
export type Schedule = Array<Show>;

export async function scheduleFromJson(jsonFilePath: string): Promise<Schedule> {
    return new Promise<Schedule>((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error: ErrnoException, data: Buffer) => {
            if (error) reject(error);
            else resolve(JSON.parse(data.toString()) as Schedule);
        }))
    });
}

export class Show {
    name: string;
    date: DayTime;
    startChunkName?: string;
    endChunkName?: string;
}