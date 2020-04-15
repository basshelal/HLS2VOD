"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Stream {
    constructor(name, playlistUrl, schedule, offsetSeconds = 30) {
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.schedule = schedule;
        this.offsetSeconds = offsetSeconds;
        this.mergerTimeOut = setInterval(() => {
            console.log("Checking!");
        }, 1000);
    }
}
exports.Stream = Stream;
exports.Schedule = {
    fromJson(jsonFilePath) {
        return scheduleFromJson(jsonFilePath);
    }
};
async function scheduleFromJson(jsonFilePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error, data) => {
            if (error)
                reject(error);
            else {
                let result = [];
                let array = JSON.parse(data.toString());
                if (Array.isArray(array)) {
                    result = array.map(it => new Show(it.name, it.date));
                }
                resolve(result);
            }
        }));
    });
}
class Show {
    constructor(name, date, startChunkName, endChunkName) {
        this.name = name;
        this.date = date;
        this.startChunkName = startChunkName;
        this.endChunkName = endChunkName;
    }
    getActualDate() {
        let now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.date.time.hour, this.date.time.minute);
    }
    hasStarted(offsetSeconds) {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0;
        let now = Date.now();
        return now >= (Date.parse(this.getActualDate().toString()) - offsetMillis);
    }
    hasFinished(finishedDate, offsetSeconds) {
        let offsetMillis = offsetSeconds ? offsetSeconds * 1000 : 0;
        let now = Date.now();
        return now > (Date.parse(finishedDate.toString()) + offsetMillis);
    }
}
exports.Show = Show;
