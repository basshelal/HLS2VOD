import {Database} from "../src/Database"
import {Stream} from "../src/stream/Stream"
import {awaitAll, delay, getPath} from "../src/utils/Utils"
import path from "path"
import {pathExistsSync} from "fs-extra"
import Extensions from "../src/utils/Extensions"

const databaseDir = getPath("tests/database")
const testStream = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8"

beforeAll(async () => {
    Extensions()
    // Initialize Database for testing
    await awaitAll(
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
    //  removeSync(databaseDir)
})

test("Stream Initialization", async () => {
    const stream: Stream = await Stream.new({
        name: "Test Stream",
        playlistUrl: testStream,
        scheduledShows: [],
        offsetSeconds: 60
    })

    stream.forceRecord()

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

    console.log(stream)

    await delay(30_000)

    stream.unForceRecord()

    // removeSync(stream.streamDirectory)
}, 60_000)