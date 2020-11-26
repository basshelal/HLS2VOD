import moment, {Duration, Moment} from "moment"
import {Serializable, SerializedShow} from "../../shared/Serialized"
import {Day, HMTime} from "../../shared/Types"

export class Show
    implements Serializable<SerializedShow> {

    /** Must be unique */
    public name: string // @Serialized

    public day: Day // @Serialized

    public startTime: HMTime // @Serialized

    public duration: Duration // @Serialized

    public offsetDuration: Duration// @Serialized

    public constructor({name, day, startTime, duration, offsetDuration}: {
        name: string,
        day: Day
        startTime: HMTime,
        duration: Duration,
        offsetDuration: Duration
    }) {
        this.name = name
        this.day = day
        this.startTime = startTime
        this.duration = duration
        this.offsetDuration = offsetDuration
    }

    public get startTimeMoment(): Moment { return moment(this.startTime).day(this.day) }

    public get offsetStartTime(): Moment { return this.startTimeMoment.subtract(this.offsetDuration) }

    public get endTimeMoment(): Moment { return this.startTimeMoment.add(this.duration) }

    public get offsetEndTime(): Moment { return this.endTimeMoment.add(this.offsetDuration) }

    public hasStarted(withOffset: boolean = true): boolean {
        const now: Moment = moment()
        if (withOffset) return now.isAfter(this.offsetStartTime)
        else return now.isAfter(this.startTimeMoment)
    }

    public hasEnded(withOffset: boolean = true): boolean {
        const now: Moment = moment()
        if (withOffset) return now.isAfter(this.offsetEndTime)
        else return now.isAfter(this.endTimeMoment)
    }

    public isActive(withOffset: boolean = true): boolean {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset)
    }

    public serialize(): SerializedShow {
        return {
            name: this.name,
            day: this.day,
            startTime: this.startTime,
            duration: this.duration,
            offsetDuration: this.offsetDuration
        }
    }

    public static fromSerializedShow(serializedShow: SerializedShow): Show {
        return new Show({
            name: serializedShow.name,
            day: serializedShow.day,
            startTime: serializedShow.startTime,
            duration: serializedShow.duration,
            offsetDuration: serializedShow.offsetDuration
        })
    }
}