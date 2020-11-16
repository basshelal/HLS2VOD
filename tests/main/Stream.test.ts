import {defaultAfterAll, defaultBeforeAll} from "../TestUtils"
import {Stream} from "../../src/main/models/Stream"
import {Database} from "../../src/main/Database"
import path from "path"
import {pathExistsSync} from "fs-extra"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Stream Initialization", async () => {
    const name = "Test Stream"
    const url = "https://example.org"
    const allSettings = await Database.Settings.getAllSettings()
    const stream = new Stream({
        name: "Test Stream",
        url: "https://example.org",
        scheduledShows: [],
        allSettings: allSettings
    })
    const streamDir = path.join(allSettings.outputDirectory, stream.name)

    expect(stream.name).toEqual(name)
    expect(stream.url).toEqual(url)
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
        url: "https://example.org",
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
})

test("Stream Force/UnForce Record", async () => {

})

test("Stream Active Show Managing", async () => {

})

test("Stream Serialize", async () => {

})

test("Stream fromSerialized", async () => {

})

