"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Stream {
    constructor(name, playlistUrl, schedule, offsetSeconds = 30) {
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.schedule = schedule;
        this.offsetSeconds = offsetSeconds;
    }
}
exports.Stream = Stream;
async function scheduleFromJson(jsonFilePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error, data) => {
            if (error)
                reject(error);
            else
                resolve(JSON.parse(data.toString()));
        }));
    });
}
exports.scheduleFromJson = scheduleFromJson;
class Show {
}
exports.Show = Show;
