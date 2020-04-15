"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csvtojson");
class Stream {
    constructor(name, playlistUrl, schedule, offsetSeconds = 30) {
        // get the current show based on the time now
        // prev show is null
        // next show is what is next in the schedule
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.schedule = schedule;
        this.offsetSeconds = offsetSeconds;
        // in the interval we need to check if next show
        //  has started with the offset
        //  if it has that means the current show is about to end
        //  start recording the next show, take note of the segment where the change happens
        //  because we want the merge to delete as much as possible while still keeping the files needed
        //  for the next show
        // once the current show has truly ended (including offset)
        // merge all the files that it uses but only delete from its start segment to the start segment of the next show
        // even though the merge is a bit more than that because we need some of the segments later
        this.mergerTimeOut = setInterval(() => {
            console.log("Checking!");
        }, 1000);
    }
    startDownloading() {
    }
    stopDownloading() {
    }
    mergeShow() {
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
