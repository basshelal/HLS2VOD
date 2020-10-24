import {Database} from "../src/main/Database"
import {Stream} from "../src/main/Stream"
import {delay} from "../src/shared/Utils"
import {mkdirpSync, pathExistsSync, removeSync} from "fs-extra"
import Extensions from "../src/shared/Extensions"
import {readdirSync} from "fs"
import {logD} from "../src/shared/Log"
import {databaseDir, initializeDatabase, outputDir, testStream} from "./TestUtils"


beforeAll(async () => {
    Extensions()
    // Initialize Database for testing
    mkdirpSync(databaseDir)
    mkdirpSync(outputDir)
    await initializeDatabase()
    Database.isInitialized = true
    logD("BeforeAll done!")
})

afterAll(async () => {
    // Delete Database when finished
    removeSync(databaseDir)
    removeSync(outputDir)
})

test("Stream Initialization", async () => {
    const stream: Stream = await Stream.new({
        name: "Test Stream",
        playlistUrl: testStream,
        scheduledShows: [],
        offsetSeconds: 60
    })

    expect(stream).toBeDefined()
    expect(stream.name).toBe("Test Stream")
    expect(stream.playlistUrl).toBe(testStream)
    expect(stream.scheduledShows).toEqual([])
    expect(stream.activeShows).toEqual([])
    expect(stream.downloader).toBeDefined()
    expect(stream.downloader.onDownloadSegment).toBeDefined()
    expect(stream.streamDirectory).toBeDefined()
    expect(pathExistsSync(stream.streamDirectory)).toBeTruthy()

    removeSync(stream.streamDirectory)
})

test("Stream Downloading", async () => {
    const stream: Stream = await Stream.new({
        name: "Test Stream",
        playlistUrl: testStream,
        scheduledShows: [],
        offsetSeconds: 60
    })

    await stream.forceRecord()

    await delay(10_000)

    await stream.unForceRecord()

    expect(readdirSync(stream.streamDirectory).length > 0).toBeTruthy()

    removeSync(stream.streamDirectory)
}, 15_000)

