import {Database} from "../src/Database"
import {Stream} from "../src/stream/Stream"
import {awaitAll, getPath} from "../src/utils/Utils"
import path from "path"
import {pathExistsSync, removeSync} from "fs-extra"

const databaseDir = getPath("tests/database")
const testStream = "https://live-hls-web-aje.getaj.net/AJE/index.m3u8"

beforeAll(async () => {
    // Initialize Database for testing
    awaitAll(
        Database.Settings.initialize({
            dbPath: path.join(databaseDir, `settings.db`),
            initialOutputDir: path.join(databaseDir, `/streams/`),
            initialOffsetSeconds: 60
        }),
        Database.Streams.initialize({dbPath: path.join(databaseDir, `streams.db`)})
    )
    Database.isInitialized = true
})

afterAll(async () => {
    // Delete Database when finished
    removeSync(databaseDir)
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
    expect(stream.segmentsDirectory).toBeDefined()

    expect(pathExistsSync(stream.streamDirectory)).toBeTruthy()
    expect(pathExistsSync(stream.segmentsDirectory)).toBeTruthy()

    removeSync(stream.streamDirectory)
})