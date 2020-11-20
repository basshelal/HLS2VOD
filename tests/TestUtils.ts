import {delay, getPath} from "../src/shared/Utils"
import {Database} from "../src/main/Database"
import path from "path"
import {mkdirpSync, removeSync} from "fs-extra"
import {loadExtensions} from "../src/shared/Extensions"

export const tempDir = getPath(`tests/tmp`)
export const databaseDir = getPath(`tests/tmp/database`)
export const outputDir = getPath(`tests/tmp/streams`)
export const settingsDatabasePath = path.join(databaseDir, `settings.db`)
export const streamsDatabasePath = path.join(databaseDir, `streams.db`)
export const defaultOffsetSeconds = 60
export const testStreamUrl = "https://live-hls-web-aje.getaj.net/AJE/index.m3u8"

// TODO: We should put tests in here to ensure set up and tear down are successful

export async function initializeDatabase() {
    mkdirpSync(tempDir)
    mkdirpSync(databaseDir)
    mkdirpSync(outputDir)
    await Database.Settings.initialize({
        dbPath: settingsDatabasePath,
        defaultSettings: {offsetSeconds: defaultOffsetSeconds, outputDirectory: outputDir}
    })
    await Database.Streams.initialize({dbPath: streamsDatabasePath})
}

export async function defaultBeforeAll() {
    loadExtensions()
    await initializeDatabase()
    await delay(1000)
    Database.isInitialized = true
}

export async function destroyDatabase() {
    removeSync(tempDir)
}

export async function defaultAfterAll() {
    await destroyDatabase()
}