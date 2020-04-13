"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const axios_1 = require("axios");
async function get(url, headers) {
    const response = await axios_1.default.get(url, { responseType: "text", headers });
    return response.data;
}
exports.get = get;
async function download(url, file, headers) {
    const response = await axios_1.default(url, { responseType: "stream", headers });
    const stream = response.data.pipe(fs.createWriteStream(file));
    return new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}
exports.download = download;
