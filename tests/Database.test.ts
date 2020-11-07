import {defaultAfterAll, defaultBeforeAll} from "./TestUtils"
import {AllSettings, Database} from "../src/main/Database"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Databases Initialized", async () => {
    expect(Database.Settings.isInitialized).toBeTruthy()
    expect(Database.Streams.isInitialized).toBeTruthy()
    expect(Database.isInitialized).toBeTruthy()
    expect(await Database.Settings.getOutputDirectory()).toBeDefined()
    expect(await Database.Settings.getOffsetSeconds()).toBeDefined()
    expect(await Database.Streams.serializedStreams).toBeDefined()
    expect(await Database.Streams.actualStreams).toBeDefined()
})

test("Get All Settings", async () => {
    const allSettings: AllSettings = await Database.Settings.getAllSettings()
    expect(allSettings.outputDirectory).toBeDefined()
    expect(allSettings.offsetSeconds).toBeDefined()
})

test("Update Settings", async () => {
    const offsetSeconds: number = 69
    const outputDirectory: string = "MyOutputDir"
    const updatedSettings: AllSettings = {offsetSeconds: 69, outputDirectory: "MyOutputDir"}
    await Database.Settings.updateSettings(updatedSettings)
    const allSettings: AllSettings = await Database.Settings.getAllSettings()
    expect(allSettings.outputDirectory).toEqual(outputDirectory)
    expect(allSettings.offsetSeconds).toEqual(offsetSeconds)
})

test("Get and Set Output Directory", async () => {
    const initialOutputDir: string = await Database.Settings.getOutputDirectory()
    expect(initialOutputDir).toBeDefined()
    const newOutputDir: string = "newOutputDir"
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

test()