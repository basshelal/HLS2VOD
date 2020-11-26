import {defaultAfterAll, defaultBeforeAll, defaultOffsetSeconds, outputDir, testStreamUrl} from "../TestUtils"
import {AllSettings, Database} from "../../src/main/Database"
import {Stream} from "../../src/main/models/Stream"
import {SerializedStream} from "../../src/shared/Serialized"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

beforeEach(async () => {
    await Database.Settings.updateSettings({offsetSeconds: defaultOffsetSeconds, outputDirectory: outputDir})
})

afterEach(async () => {
    for (const stream of Database.Streams.actualStreams) {
        await Database.Streams.deleteStream(stream.name)
    }
})

test("Databases Initialized", async () => {
    expect(Database.Settings.isInitialized).toBeTruthy()
    expect(Database.Streams.isInitialized).toBeTruthy()
    expect(Database.isInitialized).toBeTruthy()
    expect(await Database.Settings.getOutputDirectory()).toBeDefined()
    expect(await Database.Settings.getOffsetSeconds()).toBeDefined()
    expect(Database.Streams.actualStreams).toBeDefined()
})

test("Get All Settings", async () => {
    const allSettings: AllSettings = await Database.Settings.getAllSettings()
    expect(allSettings.outputDirectory).toBeDefined()
    expect(allSettings.offsetSeconds).toBeDefined()
})

test("Update Settings", async () => {
    const offsetSeconds: number = 69
    const outputDirectory: string = "tests/tmp/MyOutputDir"
    const updatedSettings: AllSettings = {offsetSeconds: offsetSeconds, outputDirectory: outputDirectory}
    await Database.Settings.updateSettings(updatedSettings)
    const allSettings: AllSettings = await Database.Settings.getAllSettings()
    expect(allSettings.outputDirectory).toEqual(outputDirectory)
    expect(allSettings.offsetSeconds).toEqual(offsetSeconds)
    expect(allSettings).toEqual(updatedSettings)
})

test("Get and Set Output Directory", async () => {
    const initialOutputDir: string = await Database.Settings.getOutputDirectory()
    expect(initialOutputDir).toBeDefined()
    const newOutputDir: string = "tests/tmp/newOutputDir"
    await Database.Settings.setOutputDirectory(newOutputDir)
    const updatedOutputDir: string = await Database.Settings.getOutputDirectory()
    expect(updatedOutputDir).toBeDefined()
    expect(updatedOutputDir).toEqual(newOutputDir)
})

test("Get and Set Offset Seconds", async () => {
    const initialOffsetSeconds: number = await Database.Settings.getOffsetSeconds()
    expect(initialOffsetSeconds).toBeDefined()
    const newOffsetSeconds: number = 420
    await Database.Settings.setOffsetSeconds(newOffsetSeconds)
    const updatedOffsetSeconds: number = await Database.Settings.getOffsetSeconds()
    expect(updatedOffsetSeconds).toBeDefined()
    expect(updatedOffsetSeconds).toEqual(newOffsetSeconds)
})

test("Add Stream and Get serialized and actual", async () => {
    const newStream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    await Database.Streams.addStream(newStream)
    const allSerializedStreamsFromDb: Array<SerializedStream> = await Database.Streams.getAllSerializedStreams()
    expect(allSerializedStreamsFromDb.length).toEqual(1)
    expect(allSerializedStreamsFromDb.first()).toEqual(newStream.serialize())
    const actualStreams: Array<Stream> = Database.Streams.actualStreams
    expect(actualStreams.length).toEqual(1)
    expect(actualStreams.first()).toEqual(newStream)
})

test("Update Stream", async () => {
    const newStream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    await Database.Streams.addStream(newStream)
    const updatedStream = new Stream({
        name: "Updated Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    await Database.Streams.updateStream(newStream.name, updatedStream)
    const allSerializedStreamsFromDb: Array<SerializedStream> = await Database.Streams.getAllSerializedStreams()
    expect(allSerializedStreamsFromDb.length).toEqual(1)
    expect(allSerializedStreamsFromDb.first()).toEqual(updatedStream.serialize())
    const actualStreams: Array<Stream> = Database.Streams.actualStreams
    expect(actualStreams.length).toEqual(1)
    expect(actualStreams.first()!!.serialize()).toEqual(updatedStream.serialize())
})

test("Delete Stream", async () => {
    const newStream = new Stream({
        name: "Test Stream",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    await Database.Streams.addStream(newStream)
    await Database.Streams.deleteStream(newStream.name)
    const allSerializedStreamsFromDb: Array<SerializedStream> = await Database.Streams.getAllSerializedStreams()
    expect(allSerializedStreamsFromDb.length).toEqual(0)
    const actualStreams: Array<Stream> = Database.Streams.actualStreams
    expect(actualStreams.length).toEqual(0)
})

test("Get Stream by name", async () => {
    const stream0 = new Stream({
        name: "Stream 0",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    const stream1 = new Stream({
        name: "Stream 1",
        url: testStreamUrl,
        scheduledShows: [],
        allSettings: await Database.Settings.getAllSettings()
    })
    await Database.Streams.addStream(stream0)
    await Database.Streams.addStream(stream1)
    expect(await Database.Streams.getSerializedStreamByName(stream0.name)).toEqual(stream0.serialize())
    expect(await Database.Streams.getSerializedStreamByName(stream1.name)).toEqual(stream1.serialize())
    expect(await Database.Streams.getActualStreamByName(stream0.name)).toEqual(stream0)
    expect(await Database.Streams.getActualStreamByName(stream1.name)).toEqual(stream1)
})