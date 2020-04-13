"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
function copyToStream(inFile, outStream) {
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
