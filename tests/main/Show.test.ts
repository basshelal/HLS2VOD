import {defaultAfterAll, defaultBeforeAll} from "../TestUtils"
import {Show} from "../../src/main/models/Show"
import {duration} from "moment"
import moment, {Moment} from "moment/moment"
import {todayDay} from "../../src/shared/Utils"
import {Day, HMTime, SDuration} from "../../src/shared/Types"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Show initialization", async () => {
    const name: string = "My Show"
    const now: Moment = moment()
    const day: Day = todayDay()
    const startTime: HMTime = {h: now.hours(), m: now.minutes()}
    const duration0: SDuration = {amount: 1, unit: "hours"}
    const offsetDuration: SDuration = {amount: 60, unit: "seconds"}
    const show = new Show({
        name: name,
        day: day,
        startTime: startTime,
        duration: duration0,
        offsetDuration: offsetDuration
    })

    expect(show.name).toEqual(name)
    expect(show.day).toEqual(day)
    expect(show.startTime).toEqual(startTime)
    expect(show.duration).toEqual(duration0)
    expect(show.offsetDuration).toEqual(offsetDuration)
})

test("Active Show", async () => {
    const now: Moment = moment()
    const day: Day = todayDay()
    const startTime: HMTime = {h: now.hours(), m: now.minutes()}
    const duration0: SDuration = {amount: 1, unit: "hour"}
    const offsetDuration: SDuration = {amount: 60, unit: "seconds"}
    const show = new Show({
        name: "My Show",
        day: day,
        startTime: startTime,
        duration: duration0,
        offsetDuration: offsetDuration
    })

    expect(show.hasStarted(true)).toBeTruthy()
    expect(show.hasStarted(false)).toBeTruthy()
    expect(show.hasEnded(true)).toBeFalsy()
    expect(show.hasEnded(false)).toBeFalsy()
    expect(show.isActive(true)).toBeTruthy()
    expect(show.isActive(false)).toBeTruthy()
})

test("Non-active Show", async () => {
    const start: Moment = moment().subtract(2, "minute")
    const startTime: HMTime = {h: start.hours(), m: start.minutes()}
    const duration0: SDuration = {amount: 1, unit: "minute"}
    const offsetDuration: SDuration = {amount: 5, unit: "seconds"}
    const show = new Show({
        name: "My Show",
        day: todayDay(),
        startTime: startTime,
        duration: duration0,
        offsetDuration: offsetDuration
    })

    expect(show.hasStarted(true)).toBeTruthy()
    expect(show.hasStarted(false)).toBeTruthy()
    expect(show.hasEnded(true)).toBeTruthy()
    expect(show.hasEnded(false)).toBeTruthy()
    expect(show.isActive(true)).toBeFalsy()
    expect(show.isActive(false)).toBeFalsy()
})

test("Show changed active state", async () => {
    const start: Moment = moment().add(2, "minutes")
    const startTime: HMTime = {h: start.hours(), m: start.minutes()}
    const duration0: SDuration = {amount: 10, unit: "minutes"}
    const show = new Show({
        name: "My Show",
        day: todayDay(),
        startTime: startTime,
        duration: duration0,
        offsetDuration: {amount: 0, unit: "milliseconds"}
    })

    expect(show.hasStarted()).toBeFalsy()
    expect(show.hasEnded()).toBeFalsy()
    expect(show.isActive()).toBeFalsy()

    const newStart: Moment = moment().subtract(2, "minutes")
    show.startTime = {h: newStart.hours(), m: newStart.minutes()}

    expect(show.hasStarted()).toBeTruthy()
    expect(show.hasEnded()).toBeFalsy()
    expect(show.isActive()).toBeTruthy()

    show.duration = {amount: 1, unit: "minute"}

    expect(show.hasStarted()).toBeTruthy()
    expect(show.hasEnded()).toBeTruthy()
    expect(show.isActive()).toBeFalsy()
})

test("Show active state with offset seconds", async () => {
    // TODO: Implement!
    //  test isActive with offset and without on an edge case show
})

test("Show update offset seconds", async () => {
    const now: Moment = moment()
    const startTime: HMTime = {h: now.hours(), m: now.minutes()}
    const duration0: SDuration = {amount: 1, unit: "hour"}
    const oldOffsetDuration: SDuration = {amount: 60, unit: "seconds"}
    const show = new Show({
        name: "My Show",
        day: todayDay(),
        startTime: startTime,
        duration: duration0,
        offsetDuration: oldOffsetDuration
    })

    let momentDuration = duration(oldOffsetDuration.amount, oldOffsetDuration.unit)
    expect(show.offsetStartTime).toEqual(moment(show.startTime).subtract(momentDuration))
    expect(show.offsetEndTime).toEqual(show.endTimeMoment.add(momentDuration))

    const newOffsetDuration: SDuration = {amount: 30, unit: "seconds"}
    show.offsetDuration = newOffsetDuration
    momentDuration = duration(newOffsetDuration.amount, newOffsetDuration.unit)
    expect(show.offsetStartTime).toEqual(moment(show.startTime).subtract(momentDuration))
    expect(show.offsetEndTime).toEqual(show.endTimeMoment.add(momentDuration))
})

test("Show serialization & deserialization", async () => {
    const name: string = "My Show"
    const now: Moment = moment()
    const day: Day = todayDay()
    const startTime: HMTime = {h: now.hours(), m: now.minutes()}
    const duration0: SDuration = {amount: 1, unit: "hour"}
    const offsetDuration: SDuration = {amount: 60, unit: "seconds"}
    const show = new Show({
        name: name,
        day: day,
        startTime: startTime,
        duration: duration0,
        offsetDuration: offsetDuration
    })

    const serializedShow = show.serialize()
    expect(serializedShow.name).toEqual(show.name)
    expect(serializedShow.day).toEqual(show.day)
    expect(serializedShow.startTime).toEqual(show.startTime)
    expect(serializedShow.duration).toEqual(show.duration)
    expect(serializedShow.offsetDuration).toEqual(show.offsetDuration)

    const fromSerialized: Show = Show.fromSerializedShow(serializedShow)

    expect(fromSerialized.name).toEqual(show.name)
    expect(fromSerialized.day).toEqual(show.day)
    expect(fromSerialized.startTime).toEqual(show.startTime)
    expect(fromSerialized.duration).toEqual(show.duration)
    expect(fromSerialized.offsetDuration).toEqual(show.offsetDuration)
})