import {ChildProcess} from "child_process"
import {Ffmpeg} from "./Ffmpeg"

export class StreamDownloader {

    public streamUrl: string
    public outputPath: string
    public ffmpegProcess: ChildProcess | undefined

    constructor({streamUrl, outputPath}: { streamUrl: string, outputPath: string }) {
        this.streamUrl = streamUrl
        this.outputPath = outputPath
        this.ffmpegProcess = undefined
    }

    public get isDownloading(): boolean { return !!(this.ffmpegProcess) }

    public async start(): Promise<void> {
        if (!this.ffmpegProcess) {
            this.ffmpegProcess = await Ffmpeg.downloadStream(this.streamUrl, this.outputPath)
        }
    }

    public stop(): void {
        if (this.ffmpegProcess) {
            this.ffmpegProcess.kill()
            this.ffmpegProcess = undefined
        }
    }

}