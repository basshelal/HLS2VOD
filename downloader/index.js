"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const m3u8 = require("m3u8-parser");
const ffmpeg_1 = require("./ffmpeg");
const p_queue_1 = require("p-queue");
const url_1 = require("url");
const http_1 = require("./http");
exports.downloaders = [];
class Downloader {
    constructor(playlistUrl, segmentDirectory, timeoutDuration = 60, playlistRefreshInterval = 2) {
        this.playlistUrl = playlistUrl;
        this.segmentDirectory = segmentDirectory;
        this.timeoutDuration = timeoutDuration;
        this.playlistRefreshInterval = playlistRefreshInterval;
        this.queue = new p_queue_1.default();
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.queue.add(() => this.refreshPlayList());
        });
    }
    stop() {
        console.log("Stopping download!");
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }
        this.resolve();
    }
    async mergeAll() {
        let segmentsDir = this.segmentDirectory;
        let mergedSegmentsFile = segmentsDir + "merged.ts";
        // Get all segments
        const segments = fs.readdirSync(segmentsDir).map(it => segmentsDir + it);
        segments.sort();
        // Merge TS files
        await ffmpeg_1.mergeFiles(segments, mergedSegmentsFile);
        // Transmux
        await ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, segmentsDir + "video.mp4");
        // Delete ts files
        fs.remove(mergedSegmentsFile);
        segments.forEach(it => fs.remove(it));
    }
    async merge(fromChunkName, toChunkName) {
        let segmentsDir = this.segmentDirectory;
        let mergedSegmentsFile = segmentsDir + "merged.ts";
        // Get all segments
        let segments = fs.readdirSync(segmentsDir).map(it => segmentsDir + it);
        segments.sort();
        fromChunkName = segmentsDir + fromChunkName;
        if (!toChunkName)
            toChunkName = segments[segments.length - 1];
        else
            toChunkName = segmentsDir + toChunkName;
        let firstSegmentIndex = segments.indexOf(fromChunkName);
        let lastSegmentIndex = segments.indexOf(toChunkName);
        if (firstSegmentIndex === -1 || lastSegmentIndex === -1)
            return;
        if (lastSegmentIndex < segments.length)
            lastSegmentIndex += 1;
        segments = segments.slice(firstSegmentIndex, lastSegmentIndex);
        // Merge TS files
        await ffmpeg_1.mergeFiles(segments, mergedSegmentsFile);
        // Transmux
        await ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, segmentsDir + "video.mp4");
        // Delete ts files
        fs.remove(mergedSegmentsFile);
    }
    deleteSegments(fromChunkName, toChunkNameExclusive) {
        let segmentsDir = this.segmentDirectory;
        // Get all segments
        let segments = fs.readdirSync(segmentsDir).map(it => segmentsDir + it);
        segments.sort();
        fromChunkName = segmentsDir + fromChunkName;
        toChunkNameExclusive = segmentsDir + toChunkNameExclusive;
        let firstSegmentIndex = segments.indexOf(fromChunkName);
        let lastSegmentIndex = segments.indexOf(toChunkNameExclusive);
        if (firstSegmentIndex === -1 || lastSegmentIndex === -1)
            return;
        segments = segments.slice(firstSegmentIndex, lastSegmentIndex);
        segments.forEach(it => fs.remove(it));
    }
    async refreshPlayList() {
        const playlist = await this.loadPlaylist();
        const interval = playlist.targetDuration || this.playlistRefreshInterval;
        const segments = playlist.segments.map((s) => new url_1.URL(s.uri, this.playlistUrl).href);
        this.refreshHandle = setTimeout(() => this.refreshPlayList(), interval * 1000);
        let toLoad = [];
        if (!this.lastSegment) {
            toLoad = segments.slice(segments.length - 1);
        }
        else {
            const index = segments.indexOf(this.lastSegment);
            if (index < 0) {
                console.error("Could not find last segment in playlist");
                toLoad = segments;
            }
            else if (index === segments.length - 1) {
                console.log("No new segments since last check");
                return;
            }
            else {
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
    timeout() {
        console.log("No new segment for a while, stopping");
        this.stop();
    }
    async loadPlaylist() {
        const response = await http_1.get(this.playlistUrl);
        const parser = new m3u8.Parser();
        parser.push(response);
        parser.end();
        return parser.manifest;
    }
    async downloadSegment(segmentUrl) {
        // Get filename from URL
        const question = segmentUrl.indexOf("?");
        let filename = question > 0 ? segmentUrl.substr(0, question) : segmentUrl;
        const slash = filename.lastIndexOf("/");
        filename = filename.substr(slash + 1);
        if (!this.firstChunkName)
            this.firstChunkName = filename;
        // Download file
        await http_1.download(segmentUrl, path.join(this.segmentDirectory, filename));
        console.log("Downloaded:", segmentUrl);
    }
    finishAllInQueue() {
        // stop adding anything to the queue
        // whatever is still in the queue should be resolved asap
    }
}
exports.Downloader = Downloader;
class StreamChooser {
    constructor(streamUrl) {
        this.streamUrl = streamUrl;
    }
    async load() {
        const streams = await http_1.get(this.streamUrl);
        const parser = new m3u8.Parser();
        parser.push(streams);
        parser.end();
        this.manifest = parser.manifest;
        return (this.manifest.segments && this.manifest.segments.length > 0)
            || (this.manifest.playlists && this.manifest.playlists.length > 0)
            || false;
    }
    isMaster() {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'isMaster'");
        }
        return this.manifest.playlists && this.manifest.playlists.length > 0 || false;
    }
    getPlaylistUrl(maxBandwidth) {
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
            let compareFn;
            if (maxBandwidth === "best") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current;
            }
            else if (maxBandwidth === "worst") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev;
            }
            else {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current;
            }
            const uri = this.manifest.playlists.reduce(compareFn).uri;
            return new url_1.URL(uri, this.streamUrl).href;
        }
        console.error("No stream or playlist found in URL:", this.streamUrl);
        return false;
    }
}
exports.StreamChooser = StreamChooser;
async function startDownloader(url) {
    let config = {
        quality: "best",
        segmentsDir: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments",
        outputFile: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\video.mp4",
        streamUrl: url
    };
    const runId = Date.now();
    const segmentsDir = config.segmentsDir + `/${runId}/` || `./segments/${runId}/`;
    const mergedSegmentsFile = segmentsDir + "merged.ts";
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
    let downloader = new Downloader(playlistUrl, segmentsDir);
    exports.downloaders.push(downloader);
    return await downloader.start();
}
exports.startDownloader = startDownloader;
async function stopAllDownloaders() {
    return Promise.all(exports.downloaders.map(downloader => {
        downloader.stop();
        return downloader.mergeAll();
    })).then();
}
exports.stopAllDownloaders = stopAllDownloaders;
