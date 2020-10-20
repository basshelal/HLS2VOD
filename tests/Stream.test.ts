import {Database} from "../src/main/Database"
import {Stream} from "../src/main/Stream"
import {delay, getPath} from "../src/shared/utils/Utils"
import path from "path"
import {pathExistsSync, removeSync} from "fs-extra"
import Extensions from "../src/shared/utils/Extensions"
import {readdirSync} from "fs"
import {logD} from "../src/shared/utils/Log"

const databaseDir = getPath("tests/database")
const outputDir = getPath("tests/streams")
const testStream = "https://live-hls-web-aje.getaj.net/AJE/index.m3u8"

beforeAll(async () => {
    Extensions()
    // Initialize Database for testing
    await Promise.all([
        Database.Settings.initialize({
            dbPath: path.join(databaseDir, `settings.db`),
            initialOutputDir: outputDir,
            initialOffsetSeconds: 60
        }), Database.Streams.initialize({dbPath: path.join(databaseDir, `streams.db`)})])
    Database.isInitialized = true
    logD("BeforeAll done!")
})

afterAll(async () => {
    // Delete Database when finished
    //  removeSync(databaseDir)
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

