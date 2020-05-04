import * as cp from "child_process";
import * as fs from "fs";
import * as electron from "electron";
import {logD} from "../utils";
import * as path from "path";

export async function spawnFfmpeg(args: Array<string>): Promise<void> {
    return new Promise((resolve, reject) => {
        logD(`Spawning FFMPEG ${args.join(" ")}`);

        const ffmpeg = cp.spawn(path.join(electron.app.getAppPath(), "ffmpeg/bin/ffmpeg"), args);
        ffmpeg.on("message", (msg) => logD(`ffmpeg message:, ${msg}`));
        ffmpeg.on("error", (msg) => {
            console.error("ffmpeg error:", msg);
            reject(msg);
        });
        ffmpeg.on("close", (status) => {
            if (status !== 0) {
                console.error(`ffmpeg closed with status ${status}`);
                reject(`ffmpeg closed with status ${status}`);
            } else {
                resolve();
            }
        });

        ffmpeg.stdout.on("data", (data) => logD(`ffmpeg stdout: ${data}`));
        ffmpeg.stderr.on("data", (data) => logD(`ffmpeg stderr: ${data}`));
    });
}

export async function transmuxTsToMp4(inputFile: string, outputFile: string): Promise<void> {
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
    ])
}

async function copyToStream(inFile: string, outStream: fs.WriteStream): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.createReadStream(inFile)
            .on("error", reject)
            .on("end", resolve)
            .pipe(outStream, {end: false})
    });
}

export async function mergeFiles(files: Array<string>, outputFile: string): Promise<void> {
    const outStream = fs.createWriteStream(outputFile)
    const promise = new Promise<void>((resolve, reject) => {
        outStream.on("finish", resolve).on("error", reject)
    })
    for (const file of files) {
        logD(`Copying ${file}`)
        await copyToStream(file, outStream)
        logD(`Finished ${file}`)
    }
    outStream.end()
    logD("Returning Promise")
    return promise
}