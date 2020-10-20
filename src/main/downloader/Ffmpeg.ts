import {getPath} from "../../shared/utils/Utils"
import {createReadStream, createWriteStream, WriteStream} from "fs"
import {spawn} from "child_process"
import {logD, logE} from "../../shared/utils/Log"

export class Ffmpeg {
    private constructor() {}

    private static resolveBin(): string | null {
        if (process.platform === "win32")
            return getPath("ffmpeg/bin/win32/ffmpeg.exe")
        else if (process.platform === "linux")
            return getPath("ffmpeg/bin/linux/ffmpeg")
        else if (process.platform === "darwin")
            return getPath("ffmpeg/bin/darwin/ffmpeg")
        else return null
    }

    static binPath = Ffmpeg.resolveBin()

    static spawn(args: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const ffmpegPath = Ffmpeg.binPath
            if (!ffmpegPath) logE(`Ffmpeg path not found`)
            logD(`Spawning ${ffmpegPath} ${args.join(" ")}`)

            const ffmpeg = spawn(ffmpegPath, args)
            ffmpeg.on("message", (msg) => logD(`ffmpeg message:, ${msg}`))
            ffmpeg.on("error", (msg) => {
                logE(`ffmpeg error: ${msg}`)
                reject(msg)
            })
            ffmpeg.on("close", (status) => {
                if (status !== 0) {
                    logE(`ffmpeg closed with status ${status}`)
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