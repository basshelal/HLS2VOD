import moment, {duration, Duration, Moment} from "moment"
import {json, momentFormat} from "../shared/Utils"
import {Serializable} from "../shared/Serializable"

export interface SerializedShow {
    name: string
    startTime: number
    offsetStartTime: number
    endTime: number
    offsetEndTime: number
}

export class Show
    implements Serializable<SerializedShow> {

    /** Must be unique */
    public name: string
    /** Show start time without offset in unix epoch milliseconds format */
    public startTime: number
    /** Show start time with offset in unix epoch milliseconds format */
    public offsetStartTime: number
    /** Show end time without offset in unix epoch milliseconds format */
    public endTime: number
    /** Show end time with offset in unix epoch milliseconds format */
    public offsetEndTime: number

    public constructor({name, time, duration, offsetSeconds}: {
        name: string,
        time: Moment,
        duration: Duration,
        offsetSeconds: number
    }) {
        this.name = name
        this.startTime = time.date()
        this.endTime = time.add(duration).date()
        this.offsetStartTime = moment(this.startTime).subtract(offsetSeconds, "seconds").date()
        this.offsetEndTime = moment(this.endTime).add(offsetSeconds, "seconds").date()
    }

    public hasStarted(withOffset: boolean = true): boolean {
        let now: number = moment.now()
        if (withOffset) return now >= this.offsetStartTime
        else return now >= this.startTime
    }

    public hasEnded(withOffset: boolean = true): boolean {
        let now: number = moment.now()
        if (withOffset) return now >= this.offsetEndTime
        else return now >= this.endTime
    }

    public isActive(withOffset: boolean = true): boolean {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset)
    }

    public setOffsetSeconds(value: number): this {
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

    public serialize(): SerializedShow {
        return {
            name: this.name,
            startTime: this.startTime,
            offsetStartTime: this.offsetStartTime,
            endTime: this.endTime,
            offsetEndTime: this.offsetEndTime
        }
    }

    // TODO: Implement or delete
    public static async fromShowEntry(showEntry: SerializedShow): Promise<Show> {
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

    // TODO: Implement or delete
    public static async fromFile({name, time, duration}: { name: string, time: string, duration: string }): Promise<Show> {
        const startTime = moment(time, "dddd HH:mm")
        const momentDuration = moment.duration(duration, "minutes")
        return await Show.new({name: name, time: startTime, duration: momentDuration})
    }
}