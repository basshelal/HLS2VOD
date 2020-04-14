"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const m3u8 = require("m3u8-parser");
const ffmpeg_1 = require("./ffmpeg");
const stream_1 = require("./stream");
const p_queue_1 = require("p-queue");
const url_1 = require("url");
const http_1 = require("./http");
exports.downloaders = [];
class ChunksDownloader {
    constructor(playlistUrl, segmentDirectory, timeoutDuration = 60, playlistRefreshInterval = 2, httpHeaders) {
        this.playlistUrl = playlistUrl;
        this.segmentDirectory = segmentDirectory;
        this.timeoutDuration = timeoutDuration;
        this.playlistRefreshInterval = playlistRefreshInterval;
        this.httpHeaders = httpHeaders;
        this.queue = new p_queue_1.default();
    }
    start() {
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
        const response = await http_1.get(this.playlistUrl, this.httpHeaders);
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
        // Download file
        await http_1.download(segmentUrl, path.join(this.segmentDirectory, filename), this.httpHeaders);
        console.log("Downloaded:", segmentUrl);
    }
}
exports.ChunksDownloader = ChunksDownloader;
class StreamChooser {
    constructor(streamUrl, httpHeaders) {
        this.streamUrl = streamUrl;
        this.httpHeaders = httpHeaders;
    }
    async load() {
        const streams = await http_1.get(this.streamUrl, this.httpHeaders);
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
async function mergeAll() {
    let segmentsDir = exports.downloader.segmentDirectory;
    let mergedSegmentsFile = segmentsDir + "merged.ts";
    // Get all segments
    const segments = fs.readdirSync(segmentsDir).map((f) => segmentsDir + f);
    segments.sort();
    // Merge TS files
    await stream_1.mergeFiles(segments, mergedSegmentsFile);
    // Transmux
    await ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, segmentsDir + "video.mp4");
    // Delete temporary files
    //fs.remove(segmentsDir);
    //fs.remove(mergedSegmentsFile);
}
exports.mergeAll = mergeAll;
async function mergeAll_(config, segmentsDir, mergedSegmentsFile) {
    // Get all segments
    const segments = fs.readdirSync(segmentsDir).map((f) => segmentsDir + f);
    segments.sort();
    // Merge TS files
    const mergeFunction = config.mergeUsingFfmpeg ? ffmpeg_1.mergeChunks : stream_1.mergeFiles;
    await mergeFunction(segments, mergedSegmentsFile);
    // Transmux
    await ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, config.outputFile);
    // Delete temporary files
    fs.remove(segmentsDir);
    fs.remove(mergedSegmentsFile);
}
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
    const streamChooser = new StreamChooser(config.streamUrl, config.httpHeaders);
    if (!await streamChooser.load()) {
        return;
    }
    const playlistUrl = streamChooser.getPlaylistUrl(config.quality);
    if (!playlistUrl) {
        return;
    }
    // Start download
    exports.downloader = new ChunksDownloader(playlistUrl, segmentsDir);
    return await exports.downloader.start();
}
exports.startDownloader = startDownloader;
