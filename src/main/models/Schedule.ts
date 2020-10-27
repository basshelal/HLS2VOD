import {readFile} from "fs"
import csv from "csvtojson"
import {Show} from "./Show"

export class Schedule {
    private constructor() {}

    public static async fromJson(jsonFilePath: string, offsetSeconds: number): Promise<Array<Show>> {
        return new Promise<Array<Show>>((resolve, reject) => {
            readFile(jsonFilePath, ((error: NodeJS.ErrnoException | null, data: Buffer) => {
                if (error) reject(error)
                else resolve(Schedule.getScheduleFromFileData(JSON.parse(data.toString()), offsetSeconds))
            }))
        })
    }

    public static async fromCSV(csvFilePath: string, offsetSeconds: number): Promise<Array<Show>> {
        const jsonFromCSV: any = await csv().fromFile(csvFilePath)
        return await Schedule.getScheduleFromFileData(jsonFromCSV, offsetSeconds)
    }

    public static getScheduleFromFileData(data: any, offsetSeconds: number): Array<Show> {
        if (Array.isArray(data)) {
            return data.filter(it => it.name && it.startTime && it.durationMinutes)
                .map(it => Show.fromFile({
                    name: it.name,
                    time: it.startTime,
                    duration: it.durationMinutes,
                    offsetSeconds: offsetSeconds
                }))
        } else return []
    }
}