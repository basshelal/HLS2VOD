import {delay, getPath, removeAllSync} from "../src/shared/Utils"
import {Database} from "../src/main/Database"
import path from "path"
import {mkdirpSync} from "fs-extra"
import {loadExtensions} from "../src/shared/Extensions"

export const databaseDir = getPath("tests/database")
export const outputDir = getPath("tests/streams")
export const settingsDatabasePath = path.join(databaseDir, `settings.db`)
export const streamsDatabasePath = path.join(databaseDir, `streams.db`)
export const testStream = "https://live-hls-web-aje.getaj.net/AJE/index.m3u8"

export async function initializeDatabase() {
    mkdirpSync(databaseDir)
    mkdirpSync(outputDir)
    await Database.Settings.initialize({
        dbPath: settingsDatabasePath,
        defaultOutputDir: outputDir,
        defaultOffsetSeconds: 60
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
    removeAllSync(outputDir, databaseDir)
}

export async function defaultAfterAll() {
    await destroyDatabase()
}