import moment, {duration, Duration, Moment} from "moment"
import {json, momentFormat} from "../../shared/Utils"
import {Serializable, SerializedShow} from "../../shared/Serialized"

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

    public constructor({name, startTimeMoment, duration, offsetSeconds}: {
        name: string,
        startTimeMoment: Moment,
        duration: Duration,
        offsetSeconds: number
    }) {
        this.name = name
        this.startTime = startTimeMoment.date()
        this.endTime = startTimeMoment.add(duration).date()
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

    public static fromSerializedShow(serializedShow: SerializedShow, offsetSeconds: number): Show {
        const show = new Show({
            name: serializedShow.name,
            startTimeMoment: moment(serializedShow.startTime),
            duration: duration(),
            offsetSeconds: offsetSeconds
        })
        show.startTime = serializedShow.startTime
        show.offsetStartTime = serializedShow.offsetStartTime
        show.endTime = serializedShow.endTime
        show.offsetEndTime = serializedShow.offsetEndTime
        return show
    }

    public static fromFile({name, time, duration, offsetSeconds}: {
        name: string, time: string, duration: string, offsetSeconds: number
    }): Show {
        const startTime = moment(time, "dddd HH:mm")
        const momentDuration = moment.duration(duration, "minutes")
        return new Show({
            name: name,
            startTimeMoment: startTime,
            duration: momentDuration,
            offsetSeconds: offsetSeconds
        })
    }
}