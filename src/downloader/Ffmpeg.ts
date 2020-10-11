import * as cp from "child_process"
import {getPath, logD} from "../Utils"
import {createReadStream, createWriteStream, WriteStream} from "fs"

export class Ffmpeg {
    private constructor() {}

    static get binPath(): string {
        if (process.platform === "win32") {
            return getPath("ffmpeg/bin/win32/ffmpeg.exe")
        } else if (process.platform === "linux") {
            return getPath("ffmpeg/bin/linux/ffmpeg")
        } else if (process.platform === "darwin") {
            // TODO Get Darwin ffmpeg binaries
        } else return ""
    }

    static spawn(args: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const ffmpegPath = Ffmpeg.binPath
            logD(`Spawning ${ffmpegPath} ${args.join(" ")}`)

            const ffmpeg = cp.spawn(ffmpegPath, args)
            ffmpeg.on("message", (msg) => logD(`ffmpeg message:, ${msg}`))
            ffmpeg.on("error", (msg) => {
                console.error("ffmpeg error:", msg)
                reject(msg)
            })
            ffmpeg.on("close", (status) => {
                if (status !== 0) {
                    console.error(`ffmpeg closed with status ${status}`)
                    reject(`ffmpeg closed with status ${status}`)
                } else {
                    resolve()
                }
            })

            ffmpeg.stdout.on("data", (data) => logD(`ffmpeg stdout: ${data}`))
            ffmpeg.stderr.on("data", (data) => logD(`ffmpeg stderr: ${data}`))
        })
    }

    static async transmuxTsToMp4(inputFile: string, outputFile: string): Promise<void> {
        await Ffmpeg.spawn([
            "-y",
            "-loglevel", "warning",
            "-i", inputFile,
            "-c", "copy",
            outputFile
        ])
    }

    static async copyToStream(inFile: string, outStream: WriteStream): Promise<void> {
        return new Promise((resolve, reject) => {
            createReadStream(inFile)
                .on("error", reject)
                .on("end", resolve)
                .pipe(outStream, {end: false})
        })
    }

    static async mergeFiles(files: Array<string>, outputFile: string): Promise<void> {
        const outStream = createWriteStream(outputFile)
        const promise = new Promise<void>((resolve, reject) => {
            outStream.on("finish", resolve).on("error", reject)
        })
        for (const file of files) {
            logD(`Copying ${file}`)
            await Ffmpeg.copyToStream(file, outStream)
            logD(`Finished ${file}`)
        }
        outStream.end()
        logD("Returning Promise")
        return promise
    }
}