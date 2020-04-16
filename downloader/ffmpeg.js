"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
async function spawnFfmpeg(args) {
    return new Promise((resolve, reject) => {
        console.log("Spawning FFMPEG", "ffmpeg", args.join(" "));
        const ffmpeg = cp.spawn("ffmpeg\\bin\\ffmpeg", args);
        ffmpeg.on("message", (msg) => console.log("ffmpeg message:", msg));
        ffmpeg.on("error", (msg) => {
            console.error("ffmpeg error:", msg);
            reject(msg);
        });
        ffmpeg.on("close", (status) => {
            if (status !== 0) {
                console.error(`ffmpeg closed with status ${status}`);
                reject(`ffmpeg closed with status ${status}`);
            }
            else {
                resolve();
            }
        });
        ffmpeg.stdout.on("data", (data) => console.log(`ffmpeg stdout: ${data}`));
        ffmpeg.stderr.on("data", (data) => console.log(`ffmpeg stderr: ${data}`));
    });
}
exports.spawnFfmpeg = spawnFfmpeg;
async function mergeChunks(segments, outputFile) {
    // Temporary files
    const segmentsFile = "ffmpeg-input.txt";
    // Generate a FFMPEG input file
    const inputStr = segments.map((f) => `file '${f}'\n`).join("");
    fs.writeFileSync(segmentsFile, inputStr);
    // Merge chunks
    const mergeArgs = [
        "-y",
        "-loglevel", "warning",
        "-f", "concat",
        "-i", segmentsFile,
        "-c", "copy",
        outputFile,
    ];
    await spawnFfmpeg(mergeArgs);
    // Clear temporary file
    fs.unlinkSync(segmentsFile);
}
exports.mergeChunks = mergeChunks;
async function transmuxTsToMp4(inputFile, outputFile) {
    await spawnFfmpeg([
        "-y",
        "-loglevel", "warning",
        "-i", inputFile,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        outputFile,
    ]);
}
exports.transmuxTsToMp4 = transmuxTsToMp4;
async function copyToStream(inFile, outStream) {
    return new Promise((resolve, reject) => {
        fs
            .createReadStream(inFile)
            .on("error", reject)
            .on("end", resolve)
            .pipe(outStream, { end: false });
    });
}
async function mergeFiles(files, outputFile) {
    const outStream = fs.createWriteStream(outputFile);
    const ret = new Promise((resolve, reject) => {
        outStream.on("finish", resolve);
        outStream.on("error", reject);
    });
    for (const file of files) {
        await copyToStream(file, outStream);
    }
    outStream.end();
    return ret;
}
exports.mergeFiles = mergeFiles;
