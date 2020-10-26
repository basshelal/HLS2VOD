import fs from "fs"
import csv from "csvtojson"
import {promises} from "../shared/Utils"
import {Show} from "./Show"

export class Schedule {
    private constructor() {}

    public static async fromJson(jsonFilePath: string): Promise<Array<Show>> {
        return new Promise<Array<Show>>((resolve, reject) => {
            fs.readFile(jsonFilePath, ((error: NodeJS.ErrnoException, data: Buffer) => {
                if (error) reject(error)
                else Schedule.getScheduleFromFileData(JSON.parse(data.toString())).then(it => resolve(it))
            }))
        })
    }

    public static async fromCSV(csvFilePath: string): Promise<Array<Show>> {
        const jsonFromCSV = await csv().fromFile(csvFilePath)
        return await Schedule.getScheduleFromFileData(jsonFromCSV)
    }

    public static async getScheduleFromFileData(data: any): Promise<Array<Show>> {
        if (Array.isArray(data))
            return promises(...data.filter(it => it.name && it.startTime && it.durationMinutes)
                .map((it) => Show.fromFile({name: it.name, time: it.startTime, duration: it.durationMinutes})))
        else return []
    }
}