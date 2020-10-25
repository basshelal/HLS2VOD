import {getPath, promises, removeAllSync} from "../src/shared/Utils"
import {Database} from "../src/main/Database"
import path from "path"
import {mkdirpSync} from "fs-extra"

export const databaseDir = getPath("tests/database")
export const outputDir = getPath("tests/streams")
export const settingsDatabasePath = path.join(databaseDir, `settings.db`)
export const streamsDatabasePath = path.join(databaseDir, `streams.db`)
export const testStream = "https://live-hls-web-aje.getaj.net/AJE/index.m3u8"

export async function initializeDatabase(): Promise<Array<any>> {
    mkdirpSync(databaseDir)
    mkdirpSync(outputDir)
    return promises(
        Database.Settings.initialize({
            dbPath: settingsDatabasePath,
            initialOutputDir: outputDir,
            initialOffsetSeconds: 60
        }),
        Database.Streams.initialize({dbPath: streamsDatabasePath})
    )
}

export async function destroyDatabase() {
    removeAllSync(outputDir, databaseDir)
}