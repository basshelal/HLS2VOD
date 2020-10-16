import {Database} from "../src/Database"
import {Stream} from "../src/stream/Stream"

beforeAll(async () => {
    await Database.testInitialize()
})

test("Stream Initialization", async () => {

    const stream: Stream = await Stream.new({
        name: "Test Stream",
        playlistUrl: "https://google.com",
        scheduledShows: [],
        offsetSeconds: 60
    })

    expect(stream).toBeDefined()
    expect(stream.name).toBe("Test Stream")
})