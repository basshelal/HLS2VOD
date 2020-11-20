import {defaultAfterAll, defaultBeforeAll, outputDir, testStreamUrl} from "../TestUtils"
import {delay} from "../../src/shared/Utils"
import {StreamDownloader} from "../../src/main/downloader/StreamDownloader"
import * as path from "path"
import {readdirSync} from "fs"
import {pathExistsSync} from "fs-extra"

beforeAll(defaultBeforeAll)

afterAll(defaultAfterAll)

test("Downloader Initialization", async () => {
    const fileName = "init.mkv"
    const outputPath: string = path.resolve(path.join(outputDir, fileName))
    const downloader = new StreamDownloader({streamUrl: testStreamUrl, outputPath: outputPath})

    expect(downloader.streamUrl).toEqual(testStreamUrl)
    expect(downloader.outputPath).toEqual(outputPath)
    expect(downloader.ffmpegProcess).toBeUndefined()
    expect(downloader.isDownloading).toBeFalsy()
})

test("Downloader Download Stream", async () => {
    const fileName = "test.mkv"
    const outputPath: string = path.resolve(path.join(outputDir, fileName))
    const downloader = new StreamDownloader({streamUrl: testStreamUrl, outputPath: outputPath})

    await downloader.start()
    await delay(10_000)

    expect(pathExistsSync(outputPath)).toBeTruthy()
    expect(readdirSync(outputDir).length > 0).toBeTruthy()
    expect(readdirSync(outputDir).find(it => it === fileName)).toBeTruthy()
    expect(downloader.isDownloading).toBeTruthy()
    expect(downloader.ffmpegProcess).toBeDefined()

    downloader.stop()
    await delay(1000)

    expect(pathExistsSync(outputPath)).toBeTruthy()
    expect(readdirSync(outputDir).length > 0).toBeTruthy()
    expect(readdirSync(outputDir).find(it => it === fileName)).toBeTruthy()
    expect(downloader.isDownloading).toBeFalsy()
    expect(downloader.ffmpegProcess).toBeUndefined()

}, 15_000)