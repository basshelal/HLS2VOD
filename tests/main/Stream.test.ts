import {defaultAfterAll, defaultBeforeAll, testStreamUrl} from "../TestUtils"
import {Stream} from "../../src/main/models/Stream"
import {Database} from "../../src/main/Database"
import path from "path"
import {pathExistsSync} from "fs-extra"
import {Show} from "../../src/main/models/Show"
import moment, {duration} from "moment/moment"
import {todayDay} from "../../src/shared/Utils"
import {Moment} from "moment"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Stream initialization", async () => {
    const name = "Test Stream"
    const allSettings = await Database.Settings.getAllSettings()
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: allSettings
    })
    const streamDir: string = path.join(allSettings.outputDirectory, stream.name)

    expect(stream.name).toEqual(name)
    expect(stream.url).toEqual(testStreamUrl)
    expect(stream.scheduledShows).toEqual([])
    expect(stream.isForced).toBeFalsy()
    expect(stream.state).toEqual("waiting")
    expect(stream.streamDirectory).toEqual(streamDir)
    expect(pathExistsSync(streamDir)).toBeTruthy()
    expect(stream.activeShowManager).toBeDefined()
    expect(stream.mainTimerIntervalMs).toBeDefined()
    expect(stream.downloaders).toBeDefined()
    expect(stream.forcedDownloader).toBeUndefined()

    await stream.destroy()
})

test("Stream Start/Pause", async () => {
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(stream.state).toEqual("waiting")
    await stream.pause()
    expect(stream.state).toEqual("paused")
    await stream.start()
    expect(stream.state).toEqual("waiting")

    await stream.destroy()
})

test("Stream Force/UnForce Record", async () => {
    const start = moment().add(5, "minutes")
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [new Show({
            name: "Test Show",
            day: todayDay(),
            startTime: {h: start.hours(), m: start.minutes()},
            duration: duration(1, "hour"),
            offsetDuration: duration(0)
        })],
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeFalsy()
    expect(stream.forcedDownloader).toBeUndefined()

    await stream.forceRecord()
    await stream.refreshActiveShowManager()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeTruthy()
    expect(stream.forcedDownloader).toBeDefined()

    await stream.unForceRecord()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeFalsy()
    expect(stream.forcedDownloader).toBeUndefined()

    await stream.destroy()
})

test("Stream Active Show Managing", async () => {
    const start: Moment = moment()
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [new Show({
            name: "Test Show",
            day: todayDay(),
            startTime: {h: start.hours(), m: start.minutes()},
            duration: duration(5, "minutes"),
            offsetDuration: duration(0)
        })],
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(stream.state).toEqual("waiting")
    expect(stream.scheduledShows.length).toEqual(1)
    expect(stream.scheduledShows.first()!!.isActive()).toBeTruthy()
    expect(stream.downloaders.size).toEqual(0)

    await stream.refreshActiveShowManager()

    expect(stream.downloaders.size).toEqual(1)
    expect(stream.state).toEqual("downloading")

    const past = moment().subtract(10, "minutes")
    stream.scheduledShows.first()!!.startTime = {h: past.hours(), m: past.minutes()}

    await stream.refreshActiveShowManager()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)

    await stream.destroy()
}, 2000)

test("Stream change schedule", async () => {
    const start: Moment = moment()
    const oldSchedule: Array<Show> = [
        new Show({
            name: "Test Show",
            day: todayDay(),
            startTime: {h: start.hours(), m: start.minutes()},
            duration: duration(5, "minutes"),
            offsetDuration: duration(0)
        })
    ]
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: oldSchedule,
        allSettings: await Database.Settings.getAllSettings()
    })

    await stream.refreshActiveShowManager()

    expect(stream.scheduledShows).toEqual(oldSchedule)
    expect(stream.downloaders.size).toEqual(1)
    expect(stream.scheduledShows.first()!!.isActive).toBeTruthy()

    stream.scheduledShows.push(new Show({
        name: "Another Show",
        day: todayDay(),
        startTime: {h: start.hours(), m: start.minutes()},
        duration: duration(5, "minutes"),
        offsetDuration: duration(0)
    }))

    await stream.refreshActiveShowManager()

    expect(stream.scheduledShows.length).toEqual(2)
    expect(stream.downloaders.size).toEqual(2)
    stream.scheduledShows.forEach((show: Show) => {
        expect(show.isActive()).toBeTruthy()
        expect(stream.downloaders.get(show.name)).toBeDefined()
    })

    stream.scheduledShows.clear()

    await stream.refreshActiveShowManager()

    expect(stream.scheduledShows.length).toEqual(0)
    expect(stream.downloaders.size).toEqual(0)

    await stream.destroy()
})

test("Stream serialization & deserialization", async () => {
    const show = new Show({
        name: "Test Show",
        day: todayDay(),
        startTime: {h: 0, m: 0},
        duration: duration(1, "hour"),
        offsetDuration: duration(0)
    })
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [show],
        allSettings: await Database.Settings.getAllSettings()
    })

    const serialized = stream.serialize()

    expect(serialized.name).toEqual(stream.name)
    expect(serialized.url).toEqual(stream.url)
    expect(serialized.scheduledShows).toEqual(stream.scheduledShows)
    expect(serialized.scheduledShows).toEqual([show])
    expect(serialized.state).toEqual(stream.state)
    expect(serialized.isForced).toEqual(stream.isForced)
    expect(serialized.streamDirectory).toEqual(stream.streamDirectory)
    expect(serialized).toEqual(stream.serialize())

    const fromSerialized = Stream.fromSerializedStream({
        serializedStream: serialized,
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(fromSerialized.name).toEqual(stream.name)
    expect(fromSerialized.url).toEqual(stream.url)
    expect(fromSerialized.scheduledShows).toEqual(stream.scheduledShows)
    expect(fromSerialized.scheduledShows).toEqual([show])
    expect(fromSerialized.state).toEqual(stream.state)
    expect(fromSerialized.isForced).toEqual(stream.isForced)
    expect(fromSerialized.streamDirectory).toEqual(stream.streamDirectory)
    expect(fromSerialized.serialize()).toEqual(stream.serialize())

    await fromSerialized.destroy()
    await stream.destroy()
})

test("Stream destroy", async () => {
    const start: Moment = moment()
    const show = new Show({
        name: "Test Show",
        day: todayDay(),
        startTime: {h: start.hours(), m: start.minutes()},
        duration: duration(1, "hour"),
        offsetDuration: duration(0)
    })
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [show],
        allSettings: await Database.Settings.getAllSettings()
    })

    await stream.forceRecord()
    await stream.refreshActiveShowManager()

    expect(stream.activeShowManager).toBeDefined()
    expect(stream.isForced).toBeTruthy()
    expect(stream.forcedDownloader).toBeDefined()
    expect(stream.downloaders.size).toEqual(1)

    await stream.destroy()

    expect(stream.activeShowManager).toBeUndefined()
    expect(stream.isForced).toBeFalsy()
    expect(stream.forcedDownloader).toBeUndefined()
    expect(stream.downloaders.size).toEqual(0)
})

