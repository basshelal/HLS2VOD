"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csvtojson");
class Stream {
    // TODO what do we do if there's no schedule?? Just download all?
    constructor(name, playlistUrl, schedule, offsetSeconds = 30) {
        // in the interval we need to check if next show
        //  has started with the offset
        //  if it has that means the current show is about to end
        //  start recording the next show, take note of the segment where the change happens
        //  because we want the merge to delete as much as possible while still keeping the files needed
        //  for the next show
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.offsetSeconds = offsetSeconds;
        // once the current show has truly ended (including offset)
        // merge all the files that it uses but only delete from its start segment to the start segment of the next show
        // even though the merge is a bit more than that because we need some of the segments later
        this.shows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds));
        let activeShows = this.shows.filter(it => it.isActive(true));
        console.assert(activeShows.length == 1, `There can only be one show active! Currently shows are ${this.shows}\n\t and active shows are ${activeShows}`);
        this.currentShow = activeShows[0];
        this.nextShow = this.shows[this.shows.indexOf(this.currentShow) + 1];
        this.nextImportantTime = this.nextShow.offsetStartTime;
        this.mergerTimeOut = setInterval(this.onInterval, 1000);
    }
    onInterval() {
        let now = Date.now();
        if (this.nextImportantTime > now) {
            if (this.nextShow.hasStarted()) {
            }
            if (this.currentShow.hasEnded()) {
            }
            // either, the next show has started (with offset)
            //  or this show has ended (with offset)
            // check why we're here, what has cause this? a start an end or what?
            // importantTime is only a show start (with offset) and a show end (with offset)
            // with end making that show merged, deleted and change current and next show
            // start probably does very little tbh
        }
    }
    startDownloading() {
    }
    stopDownloading() {
    }
    mergeCurrentShow() {
        // TODO ensure that the show finished!
        this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName).then(() => this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName));
    }
}
exports.Stream = Stream;
function dayToIndex(day) {
    switch (day) {
        case "sunday":
            return 0;
        case "monday":
            return 1;
        case "tuesday":
            return 2;
        case "wednesday":
            return 3;
        case "thursday":
            return 4;
        case "friday":
            return 5;
        case "saturday":
            return 6;
    }
}
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
// This is how its stored on file, use Extended version for a more usable one
class Show {
    constructor(name, day, hour, minute) {
        this.name = name;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
    }
}
exports.Show = Show;
class ScheduledShow extends Show {
    constructor(show, startTime, offsetStartTime, endTime, offsetEndTime) {
        super(show.name, show.day, show.hour, show.minute);
        this.startTime = startTime;
        this.offsetStartTime = offsetStartTime;
        this.endTime = endTime;
        this.offsetEndTime = offsetEndTime;
    }
    hasStarted(withOffset = true) {
        let now = Date.now();
        if (withOffset)
            return now >= this.offsetStartTime;
        else
            now >= this.startTime;
    }
    hasEnded(withOffset = true) {
        let now = Date.now();
        if (withOffset)
            return now >= this.offsetEndTime;
        else
            now >= this.endTime;
    }
    isActive(withOffset = true) {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset);
    }
    static fromSchedule(show, schedule, offsetSeconds) {
        // TODO we're not considering day of the week yet!
        //  the main problem is we need to figure out which day number it is for any given day of the week
        let offsetMillis = offsetSeconds * 1000;
        let now = new Date();
        let startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), show.hour, show.minute).valueOf();
        let offsetStartTime = startTime - offsetMillis;
        let thisIndex = schedule.indexOf(show);
        let nextIndex = thisIndex == schedule.length - 1 ? 0 : thisIndex + 1;
        let nextShow = schedule[nextIndex];
        let endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextShow.hour, nextShow.minute).valueOf();
        let offsetEndTime = endTime + offsetMillis;
        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime);
    }
}
