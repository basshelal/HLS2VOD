import * as fs from "fs-extra";
import * as path from "path";
import {ChunksDownloader} from "./ChunksDownloader";
import {IConfig as IIConfig} from "./Config";
import {mergeChunks, transmuxTsToMp4} from "./ffmpeg";
import {mergeFiles} from "./stream";
import {StreamChooser} from "./StreamChooser";

export type IConfig = IIConfig;

export let downloader: ChunksDownloader;

async function download(config: IConfig): Promise<void> {
    const runId = Date.now();
    const segmentsDir: string = config.segmentsDir + `/${runId}/` || `./segments/${runId}/`;
    const mergedSegmentsFile: string = segmentsDir + "merged.ts";

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
    downloader = new ChunksDownloader(
        playlistUrl,
        config.concurrency || 1,
        config.fromEnd || 1,
        segmentsDir,
        undefined,
        undefined,
        config.httpHeaders,
        () => {
        }
    );
    await downloader.start();
}

export async function mergeAll_(): Promise<void> {
    let segmentsDir = downloader.segmentDirectory;
    let mergedSegmentsFile: string = segmentsDir + "merged.ts";

    // Get all segments
    const segments = fs.readdirSync(segmentsDir).map((f) => segmentsDir + f);
    segments.sort();

    console.log(segments);

    // Merge TS files
    await mergeFiles(segments, mergedSegmentsFile);

    return;
}

async function mergeAll(config: IConfig, segmentsDir: string, mergedSegmentsFile: string) {
    // Get all segments
    const segments = fs.readdirSync(segmentsDir).map((f) => segmentsDir + f);
    segments.sort();

    // Merge TS files
    const mergeFunction = config.mergeUsingFfmpeg ? mergeChunks : mergeFiles;
    await mergeFunction(segments, mergedSegmentsFile);

    // Transmux
    await transmuxTsToMp4(mergedSegmentsFile, config.outputFile);

    // Delete temporary files
    fs.remove(segmentsDir);
    fs.remove(mergedSegmentsFile);
}

// Node HLS Downloader
// https://www.npmjs.com/package/node-hls-downloader

// This is good, it works, downloads the ts videos and all we need to provide it is the m3u8 url
// but there is no flexibility or control! I think it merges at the end of the stream which isn't great
// I think this is good for a fork! If we want to do this ourselves we can use the code from this library!

export function startDownloader(url: string) {
    download({
        quality: "best",
        concurrency: 25,
        segmentsDir: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments",
        outputFile: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\video.mp4",
        streamUrl: url
    });
}