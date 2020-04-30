import * as fs from "fs-extra";
import * as path from "path";
import * as m3u8 from "m3u8-parser";
import {mergeFiles, transmuxTsToMp4} from "./ffmpeg";
import PQueue from "p-queue";
import {URL} from "url";
import {download, get} from "./http";
import {print} from "../utils";

export class Downloader {

    private queue: PQueue
    private lastSegment?: string
    private timeoutHandle?: NodeJS.Timeout
    private refreshHandle?: NodeJS.Timeout

    constructor(
        public playlistUrl: string,
        public segmentDirectory: string,
        private timeoutDuration: number = 60,
        private playlistRefreshInterval: number = 2,
    ) {
        this.queue = new PQueue()
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

    public async mergeAll(): Promise<void> {
        let segmentsDir = this.segmentDirectory;
        let mergedSegmentsFile: string = segmentsDir + "/merged.ts";

        // Get all segments
        const segments: Array<string> = fs.readdirSync(segmentsDir).map(it => segmentsDir + "/" + it);
        segments.sort();

        if (segments.length == 0) return

        // Merge TS files
        await mergeFiles(segments, mergedSegmentsFile);

        // Transmux
        await transmuxTsToMp4(mergedSegmentsFile, segmentsDir + "/video.mp4");

        // Delete ts files
        fs.removeSync(mergedSegmentsFile);
        segments.forEach(it => fs.removeSync(it))
    }

    public async merge(fromChunkName: string, toChunkName: string, outputDirectory: string, outputFileName: string): Promise<void> {
        let segmentsDir = this.segmentDirectory
        let mergedSegmentsFile: string = path.join(segmentsDir, "merged.ts")

        // Get all segments
        let segments: Array<string> = fs.readdirSync(segmentsDir).map(it => path.join(segmentsDir, it))
        segments.sort()

        let firstSegmentIndex: number = segments.indexOf(fromChunkName)
        let lastSegmentIndex: number = segments.indexOf(toChunkName)

        print(`Merging Segments from ${fromChunkName} to ${toChunkName} to output in ${outputDirectory} called ${outputFileName}`)
        print(`Indexes are from ${firstSegmentIndex} to ${lastSegmentIndex}`)

        if (firstSegmentIndex < 0 || lastSegmentIndex < 0) return

        if (lastSegmentIndex + 1 <= segments.length) lastSegmentIndex += 1

        segments = segments.slice(firstSegmentIndex, lastSegmentIndex)

        fs.mkdirpSync(outputDirectory)

        segments.remove(mergedSegmentsFile)

        print(`Merging ${segments}`)

        // Merge TS files
        await mergeFiles(segments, mergedSegmentsFile)

        print("Finished Merging")

        print(`Transmuxing to mp4`)

        // Transmux
        await transmuxTsToMp4(mergedSegmentsFile, path.join(outputDirectory, outputFileName))

        fs.removeSync(mergedSegmentsFile)
    }

    public deleteSegments(fromChunkName: string, toChunkNameExclusive: string) {
        let segmentsDir = this.segmentDirectory

        let segments: Array<string> = fs.readdirSync(segmentsDir).map(it => path.join(segmentsDir, it))
        segments.sort()

        let firstSegmentIndex: number = segments.indexOf(fromChunkName)
        let lastSegmentIndex: number = segments.indexOf(toChunkNameExclusive)

        print(`Deleting Segments from ${fromChunkName} to ${toChunkNameExclusive}`)
        print(`Indexes are from ${firstSegmentIndex} to ${lastSegmentIndex}`)

        if (firstSegmentIndex === -1 || lastSegmentIndex === -1) return

        segments = segments.slice(firstSegmentIndex, lastSegmentIndex)

        segments.forEach(it => fs.removeSync(it))
    }

    private async refreshPlayList(): Promise<void> {
        const playlist = await this.loadPlaylist();

        const interval = playlist.targetDuration || this.playlistRefreshInterval;
        const segments = playlist.segments!.map((s) => new URL(s.uri, this.playlistUrl).href);

        this.refreshHandle = setTimeout(() => this.refreshPlayList(), interval * 1000);

        let toLoad: string[] = [];
        if (!this.lastSegment) {
            toLoad = segments.slice(segments.length - 1);
        } else {
            const index = segments.indexOf(this.lastSegment);
            if (index < 0) {
                console.error("Could not find last segment in playlist");
                toLoad = segments;
            } else if (index === segments.length - 1) {
                console.log("No new segments since last check");
                return;
            } else {
                toLoad = segments.slice(index + 1);
            }
        }

        this.lastSegment = toLoad[toLoad.length - 1];
        for (const uri of toLoad) {
            console.log("Queued:", uri);
            this.queue.add(() => this.downloadSegment(uri));
        }

        // Timeout after X seconds without new segment
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
        this.timeoutHandle = setTimeout(() => this.timeout(), this.timeoutDuration * 1000);
    }

    private timeout(): void {
        console.log("No new segment for a while, stopping");
        this.stop();
    }

    private async loadPlaylist(): Promise<m3u8.Manifest> {
        const response = await get(this.playlistUrl);

        const parser = new m3u8.Parser();
        parser.push(response);
        parser.end();

        return parser.manifest;
    }

    private async downloadSegment(segmentUrl: string): Promise<void> {
        // Get filename from URL
        const question = segmentUrl.indexOf("?");
        let filename = question > 0 ? segmentUrl.substr(0, question) : segmentUrl;
        const slash = filename.lastIndexOf("/");
        filename = filename.substr(slash + 1);

        // Download file
        await download(segmentUrl, path.join(this.segmentDirectory, filename));
        console.log("Downloaded:", segmentUrl);
    }
}

export class StreamChooser {
    private manifest?: m3u8.Manifest;

    constructor(private streamUrl: string) {
    }

    public async load(): Promise<boolean> {
        const streams = await get(this.streamUrl);

        const parser = new m3u8.Parser();
        parser.push(streams);
        parser.end();

        this.manifest = parser.manifest;

        return (this.manifest.segments && this.manifest.segments.length > 0)
            || (this.manifest.playlists && this.manifest.playlists.length > 0)
            || false;
    }

    public isMaster(): boolean {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'isMaster'");
        }

        return this.manifest.playlists && this.manifest.playlists.length > 0 || false;
    }

    public getPlaylistUrl(maxBandwidth?: "worst" | "best" | number): string | false {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'getPlaylistUrl'");
        }

        // If we already provided a playlist URL
        if (this.manifest.segments && this.manifest.segments.length > 0) {
            return this.streamUrl;
        }

        // You need a quality parameter with a master playlist
        if (!maxBandwidth) {
            console.error("You need to provide a quality with a master playlist");
            return false;
        }

        // Find the most relevant playlist
        if (this.manifest.playlists && this.manifest.playlists.length > 0) {
            let compareFn: (prev: m3u8.ManifestPlaylist, current: m3u8.ManifestPlaylist) => m3u8.ManifestPlaylist;
            if (maxBandwidth === "best") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current;
            } else if (maxBandwidth === "worst") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev;
            } else {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current;
            }
            const uri = this.manifest.playlists.reduce(compareFn).uri;
            return new URL(uri, this.streamUrl).href;
        }

        console.error("No stream or playlist found in URL:", this.streamUrl);
        return false;
    }
}

export interface IConfig {
    quality?: "worst" | "best" | number;
    streamUrl: string;
    segmentsDir?: string;
}

export async function startDownloader(url: string): Promise<void> {
    let config: IConfig = {
        quality: "best",
        segmentsDir: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments",
        streamUrl: url
    };
    const runId = Date.now();
    const segmentsDir: string = config.segmentsDir + `/${runId}/` || `./segments/${runId}/`;
    const mergedSegmentsFile: string = segmentsDir + "merged.ts";

    // Create target directory
    fs.mkdirpSync(path.dirname(mergedSegmentsFile));
    fs.mkdirpSync(segmentsDir);

    // Choose proper stream
    const streamChooser = new StreamChooser(config.streamUrl);
    if (!await streamChooser.load()) {
        return;
    }
    const playlistUrl = streamChooser.getPlaylistUrl(config.quality);
    if (!playlistUrl) {
        return;
    }

    // Start download
    let downloader = new Downloader(
        playlistUrl,
        segmentsDir
    );
    return await downloader.start();
}
