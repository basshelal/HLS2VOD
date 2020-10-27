import {getPath} from "../../shared/Utils"
import {ChildProcess, spawn} from "child_process"
import {logD, logE} from "../../shared/Log"

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

    public static binPath = Ffmpeg.resolveBin()

    // Resolves when ffmpeg closes
    public static async spawnSync(...args: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const ffmpegPath = Ffmpeg.binPath
            if (!ffmpegPath) {
                logE(`Ffmpeg path not found`)
                reject(`Ffmpeg path not found`)
                return
            }
            logD(`Spawning ${ffmpegPath} ${args.join(" ")}`)

            const ffmpeg: ChildProcess = spawn(ffmpegPath, args)
            ffmpeg.on("message", (msg) => logD(`ffmpeg message: ${msg}`))
            ffmpeg.on("error", (error: Error) => {
                logE(`ffmpeg error: ${error}`)
                reject(error)
            })
            ffmpeg.on("close", (code: number, signal: NodeJS.Signals) => {
                if (code !== 0) {
                    logE(`ffmpeg closed with status ${code}, signal ${signal}`)
                    reject(`ffmpeg closed with status ${code}, signal ${signal}`)
                } else {
                    resolve()
                }
            })
            if (ffmpeg.stdout) ffmpeg.stdout.on("data", (data) => logD(`ffmpeg stdout: ${data}`))
            if (ffmpeg.stderr) ffmpeg.stderr.on("data", (data) => logD(`ffmpeg stderr: ${data}`))
        })
    }

    // Resolves immediately and returns ChildProcess
    public static async spawnAsync(...args: Array<string>): Promise<ChildProcess> {
        return new Promise<ChildProcess>((resolve, reject) => {
            const ffmpegPath = Ffmpeg.binPath
            if (!ffmpegPath) {
                logE(`Ffmpeg path not found`)
                reject(`Ffmpeg path not found`)
                return
            }
            logD(`Spawning ${ffmpegPath} ${args.join(" ")}`)

            const ffmpeg: ChildProcess = spawn(ffmpegPath, args)
            ffmpeg.on("message", (msg) => logD(`ffmpeg message: ${msg}`))
            ffmpeg.on("error", (error: Error) => {
                logE(`ffmpeg error: ${error}`)
                reject(error)
            })
            ffmpeg.on("close", (code: number, signal: NodeJS.Signals) => {
                if (code !== 0) {
                    logE(`ffmpeg closed with status ${code}, signal ${signal}`)
                    reject(`ffmpeg closed with status ${code}, signal ${signal}`)
                }
            })
            if (ffmpeg.stdout) ffmpeg.stdout.on("data", (data) => logD(`ffmpeg stdout: ${data}`))
            if (ffmpeg.stderr) ffmpeg.stderr.on("data", (data) => logD(`ffmpeg stderr: ${data}`))
            resolve(ffmpeg)
        })
    }

    public static async downloadStream(url: string, outputPath: string): Promise<ChildProcess> {
        return Ffmpeg.spawnAsync(
            "-y",
            "-i", url,
            "-c:a", "copy",
            "-c:v", "copy",
            outputPath
        )
    }
}