"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const ChunksDownloader_1 = require("./ChunksDownloader");
const ffmpeg_1 = require("./ffmpeg");
const stream_1 = require("./stream");
const StreamChooser_1 = require("./StreamChooser");
async function download(config) {
    const runId = Date.now();
    const segmentsDir = config.segmentsDir + `/${runId}/` || `./segments/${runId}/`;
    const mergedSegmentsFile = segmentsDir + "merged.ts";
    // Create target directory
    fs.mkdirpSync(path.dirname(mergedSegmentsFile));
    fs.mkdirpSync(segmentsDir);
    // Choose proper stream
    const streamChooser = new StreamChooser_1.StreamChooser(config.streamUrl, config.httpHeaders);
    if (!await streamChooser.load()) {
        return;
    }
    const playlistUrl = streamChooser.getPlaylistUrl(config.quality);
    if (!playlistUrl) {
        return;
    }
    // Start download
    exports.downloader = new ChunksDownloader_1.ChunksDownloader(playlistUrl, config.concurrency || 1, config.fromEnd || 1, segmentsDir, undefined, undefined, config.httpHeaders);
    await exports.downloader.start();
}
async function mergeAll_() {
    let segmentsDir = exports.downloader.segmentDirectory;
    let mergedSegmentsFile = segmentsDir + "merged.ts";
    // Get all segments
    const segments = fs.readdirSync(segmentsDir).map((f) => segmentsDir + f);
    segments.sort();
    console.log(segments);
    // Merge TS files
    await stream_1.mergeFiles(segments, mergedSegmentsFile);
    // Transmux
    await ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, segmentsDir + "video.mp4");
}
exports.mergeAll_ = mergeAll_;
async function mergeAll(config, segmentsDir, mergedSegmentsFile) {
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
function startDownloader(url) {
    download({
        quality: "best",
        concurrency: 25,
        segmentsDir: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments",
        outputFile: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\video.mp4",
        streamUrl: url
    });
}
exports.startDownloader = startDownloader;
