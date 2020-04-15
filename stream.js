"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csvtojson");
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
    },
    fromCSV(csvFilePath) {
        return scheduleFromCsv(csvFilePath);
    }
};
function getScheduleFromFileData(data) {
    if (Array.isArray(data)) {
        return data.map(it => new Show(it.name, it.day.toLowerCase(), it.hour, it.minute));
    }
    else
        return [];
}
async function scheduleFromJson(jsonFilePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(jsonFilePath, ((error, data) => {
            if (error)
                reject(error);
            else
                resolve(getScheduleFromFileData(JSON.parse(data.toString())));
        }));
    });
}
async function scheduleFromCsv(csvFilePath) {
    return new Promise(resolve => csv().fromFile(csvFilePath).then(data => resolve(getScheduleFromFileData(data))));
}
class Show {
    constructor(name, day, hour, minute, startChunkName, endChunkName) {
        this.name = name;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.startChunkName = startChunkName;
        this.endChunkName = endChunkName;
    }
    getActualDate() {
        let now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.hour, this.minute);
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
