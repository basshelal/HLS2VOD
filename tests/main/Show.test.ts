import {defaultAfterAll, defaultBeforeAll} from "../TestUtils"
import {Show} from "../../src/main/models/Show"
import {duration} from "moment"
import moment, {Moment} from "moment/moment"
import {delay} from "../../src/shared/Utils"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Show Initialization", async () => {
    const now: Moment = moment()
    const nowValue = now.valueOf()
    const anHour = duration(1, "hour")
    const show = new Show({
        name: "My Show",
        startTimeMoment: now,
        offsetSeconds: 60,
        duration: anHour
    })

    expect(show.name).toEqual("My Show")
    expect(show.startTime).toEqual(nowValue)
    expect(show.endTime).toEqual(moment(nowValue).add(anHour).valueOf())
    expect(show.offsetStartTime).toEqual(moment(show.startTime).subtract(60, "seconds").valueOf())
    expect(show.offsetEndTime).toEqual(moment(show.endTime).add(60, "seconds").valueOf())
})

test("Show is Active", async () => {
    const now: Moment = moment()
    const show = new Show({
        name: "My Show",
        startTimeMoment: now,
        offsetSeconds: 60,
        duration: duration(1, "hour")
    })

    expect(show.hasStarted(true)).toBeTruthy()
    expect(show.hasStarted(false)).toBeTruthy()
    expect(show.hasEnded(true)).toBeFalsy()
    expect(show.hasEnded(false)).toBeFalsy()
    expect(show.isActive(true)).toBeTruthy()
    expect(show.isActive(false)).toBeTruthy()
})

test("Show is not Active", async () => {
    const start: Moment = moment(new Date(1999, 12, 31, 12, 30))
    const show = new Show({
        name: "My Show",
        startTimeMoment: start,
        offsetSeconds: 60,
        duration: duration(1, "hour")
    })

    expect(show.hasStarted(true)).toBeTruthy()
    expect(show.hasStarted(false)).toBeTruthy()
    expect(show.hasEnded(true)).toBeTruthy()
    expect(show.hasEnded(false)).toBeTruthy()
    expect(show.isActive(true)).toBeFalsy()
    expect(show.isActive(false)).toBeFalsy()
})

test("Show changed active", async () => {
    const now: Moment = moment().add(1, "seconds")
    const aSecond = duration(1, "seconds")
    const show = new Show({
        name: "My Show",
        startTimeMoment: now,
        offsetSeconds: 0,
        duration: aSecond
    })

    expect(show.hasStarted()).toBeFalsy()
    expect(show.hasEnded()).toBeFalsy()
    expect(show.isActive()).toBeFalsy()

    await delay(1000)

    expect(show.hasStarted()).toBeTruthy()
    expect(show.hasEnded()).toBeFalsy()
    expect(show.isActive()).toBeTruthy()

    await delay(1000)

    expect(show.hasStarted()).toBeTruthy()
    expect(show.hasEnded()).toBeTruthy()
    expect(show.isActive()).toBeFalsy()
})

test("Show Update Offset Seconds", async () => {
    const now: Moment = moment()
    const oldOffsetSeconds = 60
    const show = new Show({
        name: "My Show",
        startTimeMoment: now,
        offsetSeconds: 60,
        duration: duration(1, "hour")
    })

    expect(show.offsetStartTime).toEqual(moment(show.startTime).subtract(oldOffsetSeconds, "seconds").valueOf())
    expect(show.offsetEndTime).toEqual(moment(show.endTime).add(oldOffsetSeconds, "seconds").valueOf())

    const newOffsetSeconds = 30
    show.setOffsetSeconds(newOffsetSeconds)
    expect(show.offsetStartTime).toEqual(moment(show.startTime).subtract(newOffsetSeconds, "seconds").valueOf())
    expect(show.offsetEndTime).toEqual(moment(show.endTime).add(newOffsetSeconds, "seconds").valueOf())
})

test("Show Serialize", async () => {
    const show = new Show({
        name: "My Show",
        startTimeMoment: moment(),
        offsetSeconds: 60,
        duration: duration(1, "hour")
    })

    const serializedShow = show.serialize()
    expect(serializedShow.name).toEqual(show.name)
    expect(serializedShow.startTime).toEqual(show.startTime)
    expect(serializedShow.offsetStartTime).toEqual(show.offsetStartTime)
    expect(serializedShow.endTime).toEqual(show.endTime)
    expect(serializedShow.offsetEndTime).toEqual(show.offsetEndTime)
})

test("Show fromSerialized", async () => {
    const offsetSeconds = 60
    const show = new Show({
        name: "My Show",
        startTimeMoment: moment(),
        offsetSeconds: offsetSeconds,
        duration: duration(1, "hour")
    })

    const serializedShow = show.serialize()

    const fromSerialized = Show.fromSerializedShow(serializedShow, offsetSeconds)

    expect(fromSerialized.name).toEqual(show.name)
    expect(fromSerialized.startTime).toEqual(show.startTime)
    expect(fromSerialized.offsetStartTime).toEqual(show.offsetStartTime)
    expect(fromSerialized.endTime).toEqual(show.endTime)
    expect(fromSerialized.offsetEndTime).toEqual(show.offsetEndTime)
})