import {destroyDatabase, initializeDatabase, outputDir, testStreamUrl} from "../TestUtils"
import {delay} from "../../src/shared/Utils"
import {Database} from "../../src/main/Database"
import {StreamDownloader} from "../../src/main/downloader/StreamDownloader"
import * as path from "path"
import {logD} from "../../src/shared/Log"
import {readdirSync} from "fs"
import {pathExistsSync} from "fs-extra"
import {loadExtensions} from "../../src/shared/Extensions"

beforeAll(async () => {
    loadExtensions()
    await initializeDatabase()
    await delay(1000)
    Database.isInitialized = true
})

afterAll(async () => {
    await destroyDatabase()
})

test("Download Stream", async () => {

    const fileName = "test.mkv"
    const outputPath: string = path.resolve(path.join(outputDir, fileName))
    logD(outputPath)
    const downloader = new StreamDownloader({streamUrl: testStreamUrl, outputPath: outputPath})

    await downloader.start()
    await delay(15_000)
    downloader.stop()
    await delay(1000)

    expect(pathExistsSync(outputPath)).toBeTruthy()
    expect(readdirSync(outputDir).length > 0).toBeTruthy()
    expect(readdirSync(outputDir).find(it => it === fileName)).toBeTruthy()
    expect(downloader.ffmpegProcess!!.killed).toBeTruthy()

}, 30_000)