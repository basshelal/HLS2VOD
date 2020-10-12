import * as fs from "fs-extra"
import * as path from "path"
import * as m3u8 from "m3u8-parser"
import {Ffmpeg} from "./Ffmpeg"
import PQueue from "p-queue"
import {URL} from "url"
import {download, get} from "./Http"
import {logD, logE} from "../Log"

export class Downloader {

    public playlistUrl: string
    public segmentDirectory: string

    private queue: PQueue = new PQueue()
    private timeoutDuration: number
    private playlistRefreshInterval: number
    private lastSegment?: string
    private timeoutHandle?: number
    private refreshHandle?: number

    constructor(playlistUrl: string, segmentDirectory: string,
                timeoutDuration: number = 600, playlistRefreshInterval: number = 2) {
        this.playlistUrl = playlistUrl
        this.segmentDirectory = segmentDirectory
        this.timeoutDuration = timeoutDuration
        this.playlistRefreshInterval = playlistRefreshInterval
    }

    public async start(): Promise<void> {
        this.queue.add(() => this.refreshPlayList())
    }

    public stop() {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle)
        }
    }

    public pause() {
        this.queue.pause()
    }

    public resume() {
        this.queue.start()
    }

    public async merge(fromChunkName: string, toChunkName: string, outputDirectory: string, outputFileName: string): Promise<void> {
        const segmentsDir = this.segmentDirectory
        const mergedSegmentsFile: string = path.join(segmentsDir, "merged.ts")

        // Get all segments
        let segments: Array<string> = fs.readdirSync(segmentsDir).map(it => path.join(segmentsDir, it))
        segments.sort()

        let firstSegmentIndex: number = segments.indexOf(fromChunkName)
        let lastSegmentIndex: number = segments.indexOf(toChunkName)

        logD(`Merging Segments from ${fromChunkName} to ${toChunkName} to output in ${outputDirectory} called ${outputFileName}`)
        logD(`Indexes are from ${firstSegmentIndex} to ${lastSegmentIndex}`)

        if (firstSegmentIndex < 0 || lastSegmentIndex < 0) return

        if (lastSegmentIndex + 1 <= segments.length) lastSegmentIndex += 1

        segments = segments.slice(firstSegmentIndex, lastSegmentIndex)

        fs.mkdirpSync(outputDirectory)

        segments.remove(mergedSegmentsFile)

        logD(`Merging ${segments}`)

        // Merge TS files
        await Ffmpeg.mergeFiles(segments, mergedSegmentsFile)

        logD("Finished Merging")

        logD(`Transmuxing to mp4`)

        // Transmux
        await Ffmpeg.transmuxTsToMp4(mergedSegmentsFile, path.join(outputDirectory, outputFileName))

        fs.removeSync(mergedSegmentsFile)
    }

    public deleteSegments(fromChunkName: string, toChunkNameExclusive: string) {
        let segmentsDir = this.segmentDirectory

        let segments: Array<string> = fs.readdirSync(segmentsDir).map(it => path.join(segmentsDir, it))
        segments.sort()

        let firstSegmentIndex: number = segments.indexOf(fromChunkName)
        let lastSegmentIndex: number = segments.indexOf(toChunkNameExclusive)

        logD(`Deleting Segments from ${fromChunkName} to ${toChunkNameExclusive}`)
        logD(`Indexes are from ${firstSegmentIndex} to ${lastSegmentIndex}`)

        if (firstSegmentIndex === -1 || lastSegmentIndex === -1) return

        segments = segments.slice(firstSegmentIndex, lastSegmentIndex)

        segments.forEach(it => fs.removeSync(it))
    }

    public deleteAllSegments() {
        let segmentsDir = this.segmentDirectory

        let segments: Array<string> = fs.readdirSync(segmentsDir).map(it => path.join(segmentsDir, it))

        logD("Deleting All Segments")

        segments.forEach(it => fs.removeSync(it))
    }

    private async refreshPlayList(): Promise<void> {
        const playlist = await this.loadPlaylist()

        const interval = playlist.targetDuration || this.playlistRefreshInterval
        const segments = playlist.segments!.map((s) => new URL(s.uri, this.playlistUrl).href)

        this.refreshHandle = setTimeout(() => this.refreshPlayList(), interval * 1000)

        let toLoad: string[] = []
        if (!this.lastSegment) {
            toLoad = segments.slice(segments.length - 1)
        } else {
            const index = segments.indexOf(this.lastSegment)
            if (index < 0) {
                console.error("Could not find last segment in playlist")
                toLoad = segments
            } else if (index === segments.length - 1) {
                logD("No new segments since last check")
                return
            } else {
                toLoad = segments.slice(index + 1)
            }
        }

        this.lastSegment = toLoad[toLoad.length - 1]
        for (const uri of toLoad) {
            logD(`Queued: ${uri}`)
            this.queue.add(() => this.downloadSegment(uri))
        }

        // Timeout after X seconds without new segment
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle)
        }
        this.timeoutHandle = setTimeout(() => this.timeout(), this.timeoutDuration * 1000)
    }

    private timeout(): void {
        logD("No new segment for a while, stopping")
        this.stop()
    }

    private async loadPlaylist(): Promise<m3u8.Manifest> {
        const response = await get(this.playlistUrl)

        const parser = new m3u8.Parser()
        parser.push(response)
        parser.end()

        return parser.manifest
    }

    private async downloadSegment(segmentUrl: string): Promise<void> {
        // Get filename from URL
        const question = segmentUrl.indexOf("?")
        let filename = question > 0 ? segmentUrl.substr(0, question) : segmentUrl
        const slash = filename.lastIndexOf("/")
        filename = filename.substr(slash + 1)

        // Download file
        await download(segmentUrl, path.join(this.segmentDirectory, filename))
        logD(`Downloaded: ${segmentUrl}`)
    }

    static async chooseStream(streamUrl: string,
                              maxBandwidth: "worst" | "best" | number = "best"): Promise<string | null> {
        const streams: string = await get(streamUrl)

        const parser = new m3u8.Parser()
        parser.push(streams)
        parser.end()

        const manifest = parser.manifest

        const isValid = (manifest.segments && manifest.segments.length > 0)
            || (manifest.playlists && manifest.playlists.length > 0)

        if (!isValid) return null

        // If we already provided a playlist URL
        if (manifest.segments && manifest.segments.length > 0) return streamUrl

        // Find the most relevant playlist
        if (manifest.playlists && manifest.playlists.length > 0) {
            let compareFn: (prev: m3u8.ManifestPlaylist, current: m3u8.ManifestPlaylist) => m3u8.ManifestPlaylist
            if (maxBandwidth === "best") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current
            } else if (maxBandwidth === "worst") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev
            } else {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current
            }
            const uri = manifest.playlists.reduce(compareFn).uri
            return new URL(uri, streamUrl).href
        }

        logE(`No stream or playlist found in URL: ${streamUrl}`)
        return null
    }
}
