"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const csv = require("csvtojson");
const moment = require("moment");
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
        this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName).then(() => this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName));
    }
}
exports.Stream = Stream;
const Days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
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
    toString() {
        return JSON.stringify(this, null, 2);
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
        let offsetMillis = offsetSeconds * 1000;
        let now = new Date();
        let todayDayIndex = now.getDay();
        let showDayIndex = Days.indexOf(show.day);
        let newTime = now;
        if (showDayIndex > todayDayIndex) {
            let differenceDays = showDayIndex - todayDayIndex;
            newTime = moment().add(differenceDays, "days").toDate();
        }
        if (showDayIndex < todayDayIndex) {
            let differenceDays = todayDayIndex - showDayIndex;
            let offset = Days.length - differenceDays;
            newTime = moment().add(offset, "days").toDate();
        }
        let startTime = new Date(newTime.getFullYear(), newTime.getMonth(), newTime.getDate(), show.hour, show.minute).valueOf();
        let offsetStartTime = startTime - offsetMillis;
        let thisShowIndex = schedule.indexOf(show);
        let nextShowIndex = thisShowIndex == schedule.length - 1 ? 0 : thisShowIndex + 1;
        let nextShow = schedule[nextShowIndex];
        let nextShowDayIndex = Days.indexOf(nextShow.day);
        let nextShowTime = now;
        if (nextShowDayIndex > todayDayIndex) {
            let differenceDays = nextShowDayIndex - todayDayIndex;
            nextShowTime = moment().add(differenceDays, "days").toDate();
        }
        if (nextShowDayIndex < todayDayIndex) {
            let differenceDays = todayDayIndex - nextShowDayIndex;
            let offset = Days.length - differenceDays;
            nextShowTime = moment().add(offset, "days").toDate();
        }
        let endTime = new Date(nextShowTime.getFullYear(), nextShowTime.getMonth(), nextShowTime.getDate(), nextShow.hour, nextShow.minute).valueOf();
        let offsetEndTime = endTime + offsetMillis;
        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime);
    }
    toString() {
        return JSON.stringify(this, null, 2);
    }
}
