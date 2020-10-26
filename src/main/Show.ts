import moment, {duration, Duration, Moment} from "moment"
import {fileMoment, json, momentFormat} from "../shared/Utils"
import path from "path"
import {Database} from "./Database"
import {FileConcatter} from "./Stream"

export interface ShowEntry {
    name: string
    startTime: number
    offsetStartTime: number
    endTime: number
    offsetEndTime: number
}

export class Show {

    public startTime: number
    public offsetStartTime: number
    public endTime: number
    public offsetEndTime: number
    public fileConcatter: FileConcatter

    private constructor(public name: string,
                        public time: Moment,
                        public duration: Duration,
                        public offsetSeconds: number = 0) {

        this.startTime = time.date()
        this.endTime = time.add(duration).date()
        this.setOffsetSeconds(offsetSeconds)
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

    public setOffsetSeconds(value: number): this {
        this.offsetSeconds = value
        this.offsetStartTime = moment(this.startTime).subtract(value, "seconds").date()
        this.offsetEndTime = moment(this.endTime).add(value, "seconds").date()
        return this
    }

    public toString(): string {
        const obj: any = JSON.parse(json(this, 2))
        obj["startTimeFormatted"] = moment(this.startTime).format(momentFormat)
        obj["offsetStartTimeFormatted"] = moment(this.offsetStartTime).format(momentFormat)
        obj["endTimeFormatted"] = moment(this.endTime).format(momentFormat)
        obj["offsetEndTimeFormatted"] = moment(this.offsetEndTime).format(momentFormat)
        return json(obj, 2)
    }

    public async initialize(): Promise<this> {
        this.fileConcatter = new FileConcatter(path.join(await Database.Settings.getOutputDirectory(), this.name, `${fileMoment()}`))
        return this
    }

    public toShowEntry(): ShowEntry {
        return {
            name: this.name,
            startTime: this.startTime,
            offsetStartTime: this.offsetStartTime,
            endTime: this.endTime,
            offsetEndTime: this.offsetEndTime
        }
    }

    public static async new({name, time, duration, offsetSeconds = 0}: {
        name: string
        time: Moment
        duration: Duration
        offsetSeconds?: number
    }): Promise<Show> {
        return await (new Show(name, time, duration, offsetSeconds)).initialize()
    }

    public static async fromShowEntry(showEntry: ShowEntry): Promise<Show> {
        const show = await Show.new({
            name: showEntry.name,
            time: moment(showEntry.startTime),
            duration: duration()
        })
        show.startTime = showEntry.startTime
        show.offsetStartTime = showEntry.offsetStartTime
        show.endTime = showEntry.endTime
        show.offsetEndTime = showEntry.offsetEndTime
        return show
    }

    public static async fromFile({name, time, duration}: { name: string, time: string, duration: string }): Promise<Show> {
        const startTime = moment(time, "dddd HH:mm")
        const momentDuration = moment.duration(duration, "minutes")
        return await Show.new({name: name, time: startTime, duration: momentDuration})
    }
}