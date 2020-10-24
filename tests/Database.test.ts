import Extensions from "../src/shared/Extensions"
import {Database, SettingsEntry} from "../src/main/Database"
import {destroyDatabase, initializeDatabase, outputDir} from "./TestUtils"
import {delay} from "../src/shared/Utils"

beforeAll(async () => {
    Extensions()
    await initializeDatabase()
    await delay(1000)
    Database.isInitialized = true
})

afterAll(async () => {
    await destroyDatabase()
})

test("Get All Settings", async () => {

    const allSettings: Array<SettingsEntry> = await Database.Settings.getAllSettings()
    expect(allSettings).not.toEqual([])
    const output = allSettings.find(it => it.key === "outputDirectory")!!.value
    expect(output).toBeDefined()
    expect(output).toEqual(outputDir)
    const offset = allSettings.find(it => it.key === "offsetSeconds")!!.value
    expect(offset).toBeDefined()
    expect(offset).toEqual(60)

})