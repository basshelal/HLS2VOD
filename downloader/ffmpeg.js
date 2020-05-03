"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const utils_1 = require("../utils");
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
async function transmuxTsToMp4(inputFile, outputFile) {
    /*await spawnFfmpeg([
        "-y",
        "-loglevel", "warning",
        "-i", inputFile,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        outputFile,
    ]);*/
    // help here https://askubuntu.com/questions/716424/how-to-convert-ts-file-into-a-mainstream-format-losslessly
    await spawnFfmpeg([
        "-y",
        "-loglevel", "warning",
        "-i", inputFile,
        "-c", "copy",
        outputFile
    ]);
}
exports.transmuxTsToMp4 = transmuxTsToMp4;
async function copyToStream(inFile, outStream) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(inFile)
            .on("error", reject)
            .on("end", resolve)
            .pipe(outStream, { end: false });
    });
}
async function mergeFiles(files, outputFile) {
    const outStream = fs.createWriteStream(outputFile);
    const promise = new Promise((resolve, reject) => {
        outStream.on("finish", resolve).on("error", reject);
    });
    for (const file of files) {
        utils_1.logD(`Copying ${file}`);
        await copyToStream(file, outStream);
        utils_1.logD(`Finished ${file}`);
    }
    outStream.end();
    utils_1.logD("Returning Promise");
    return promise;
}
exports.mergeFiles = mergeFiles;
