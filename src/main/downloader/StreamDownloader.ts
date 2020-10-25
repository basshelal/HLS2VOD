import {ChildProcess} from "child_process"
import {Ffmpeg} from "./Ffmpeg"

export class StreamDownloader {

    public streamUrl: string
    public outputPath: string
    public isDownloading: boolean
    public ffmpegProcess: ChildProcess | undefined

    constructor({streamUrl, outputPath}: { streamUrl: string, outputPath: string }) {
        this.streamUrl = streamUrl
        this.outputPath = outputPath
        this.isDownloading = false
    }

    public async start() {
        this.ffmpegProcess = await Ffmpeg.downloadStream(this.streamUrl, this.outputPath)
    }

    public stop() {
        if (this.ffmpegProcess) this.ffmpegProcess.kill()
    }

}