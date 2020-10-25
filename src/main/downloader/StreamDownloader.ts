import {ChildProcess} from "child_process"
import M3u8PlaylistPicker from "./M3u8PlaylistPicker"
import {Ffmpeg} from "./Ffmpeg"

export class StreamDownloader {

    public streamUrl: string
    public outputPath: string
    public isDownloading: boolean
    public ffmpegProcess: ChildProcess | undefined

    constructor({m3u8Url, outputPath}: { m3u8Url: string, outputPath: string }) {
        this.streamUrl = m3u8Url
        this.outputPath = outputPath
        this.isDownloading = false
        M3u8PlaylistPicker(m3u8Url).then((resultUrl: string) => {
            this.streamUrl = resultUrl
        })
    }

    public async start(): Promise<ChildProcess> {
        this.ffmpegProcess = await Ffmpeg.downloadStreamCopy(this.streamUrl, this.outputPath)
        return this.ffmpegProcess
    }

    public stop() {
        this.ffmpegProcess?.kill(0)
    }

}