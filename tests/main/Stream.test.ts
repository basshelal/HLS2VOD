import {defaultAfterAll, defaultBeforeAll, testStreamUrl} from "../TestUtils"
import {Stream} from "../../src/main/models/Stream"
import {Database} from "../../src/main/Database"
import path from "path"
import {pathExistsSync} from "fs-extra"
import {Show} from "../../src/main/models/Show"
import moment, {duration} from "moment/moment"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Stream Initialization", async () => {
    const name = "Test Stream"
    const allSettings = await Database.Settings.getAllSettings()
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: allSettings
    })
    const streamDir = path.join(allSettings.outputDirectory, stream.name)

    expect(stream.name).toEqual(name)
    expect(stream.url).toEqual(testStreamUrl)
    expect(stream.scheduledShows).toEqual([])
    expect(stream.isForced).toEqual(false)
    expect(stream.state).toEqual("waiting")
    expect(stream.streamDirectory).toEqual(streamDir)
    expect(pathExistsSync(streamDir)).toBeTruthy()
    expect(stream.activeShowManager).toBeDefined()
    expect(stream.mainTimerIntervalMs).toBeDefined()
    expect(stream.downloaders).toBeDefined()
    expect(stream.forcedDownloader).toBeFalsy()
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
})

test("Stream Force/UnForce Record", async () => {
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [new Show({
            name: "Test Show",
            startTimeMoment: moment().subtract(1, "days"),
            offsetSeconds: 60,
            duration: duration(1, "hour")
        })],
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeFalsy()
    expect(stream.forcedDownloader).toBeFalsy()

    await stream.forceRecord()
    stream.activeShowManager.refresh()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeTruthy()
    expect(stream.forcedDownloader).toBeDefined()

    await stream.unForceRecord()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
    expect(stream.isForced).toBeFalsy()
    expect(stream.forcedDownloader).toBeFalsy()
})

test("Stream Active Show Managing", async () => {
    const stream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [new Show({
            name: "Test Show",
            startTimeMoment: moment(),
            offsetSeconds: 0,
            duration: duration(5, "seconds")
        })],
        allSettings: await Database.Settings.getAllSettings()
    })

    expect(stream.state).toEqual("waiting")
    expect(stream.scheduledShows.length).toEqual(1)
    expect(stream.scheduledShows.first()!!.isActive()).toBeTruthy()
    expect(stream.downloaders.size).toEqual(0)

    stream.activeShowManager.refresh()

    expect(stream.downloaders.size).toEqual(1)
    expect(stream.state).toEqual("downloading")

    stream.activeShowManager.refresh()

    expect(stream.state).toEqual("waiting")
    expect(stream.downloaders.size).toEqual(0)
})

test("Stream Serialization", async () => {
    const show = new Show({
        name: "Test Show",
        startTimeMoment: moment(),
        offsetSeconds: 60,
        duration: duration(1, "hour")
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
})

