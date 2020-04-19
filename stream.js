"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader/downloader");
const fs = require("fs");
const fsextra = require("fs-extra");
const csv = require("csvtojson");
const moment = require("moment");
const utils_1 = require("./utils");
const main_1 = require("./main");
class Stream {
    constructor(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory) {
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.schedulePath = schedulePath;
        this.schedule = schedule;
        this.rootDirectory = rootDirectory;
        this.shows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds));
        this.streamDirectory = this.rootDirectory + `/${this.name}`;
        this.segmentsDirectory = this.streamDirectory + `/segments`;
        fsextra.mkdirpSync(this.streamDirectory);
        fsextra.mkdirpSync(this.segmentsDirectory);
        this.setCurrentShow();
        this.mergerTimeOut = setInterval(() => {
            let now = Date.now();
            if (now > this.nextEventTime) {
                // TODO if schedule has changed we should probably re-read it here
                if (this.nextShow.hasStarted(true)) {
                    this.downloader.pause();
                    this.nextShow.startChunkName = this.getLastChunkPath();
                    utils_1.logD("Next show has started!");
                    utils_1.logD(`It is ${this.nextShow}`);
                    this.nextEventTime = this.currentShow.offsetEndTime;
                    this.downloader.resume();
                }
                if (this.currentShow.hasEnded(true)) {
                    this.downloader.pause();
                    this.currentShow.endChunkName = this.getLastChunkPath();
                    utils_1.logD("Current show has ended!");
                    utils_1.logD(`It is ${this.currentShow}`);
                    this.mergeCurrentShow().then(() => {
                        this.setCurrentShow();
                        this.currentShow.startChunkName = this.getFirstChunkPath();
                        this.downloader.resume();
                    });
                }
            }
        }, 1000);
    }
    static async new(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory) {
        let stream = new Stream(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory);
        await stream.initialize();
        return stream;
    }
    initialize() {
        return this.initializeDownloader();
    }
    async startDownloading() {
        await this.downloader.start();
        this.isDownloading = true;
    }
    async stopDownloading() {
        this.downloader.stop();
        await this.downloader.mergeAll();
        this.isDownloading = false;
    }
    async mergeCurrentShow() {
        if (!this.currentShow.startChunkName)
            this.currentShow.startChunkName = this.getFirstChunkPath();
        if (!this.currentShow.endChunkName)
            this.currentShow.startChunkName = this.getLastChunkPath();
        if (this.downloader) {
            await this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName, `${this.streamDirectory}/${this.currentShow.name}`, `${moment().format(main_1.momentFormatSafe)}.mp4`).then(() => this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName));
        }
    }
    async initializeDownloader() {
        const streamChooser = new downloader_1.StreamChooser(this.playlistUrl);
        if (!await streamChooser.load())
            throw Error("StreamChooser failed!");
        const playlistUrl = streamChooser.getPlaylistUrl("best");
        if (!playlistUrl)
            throw Error("PlaylistUrl failed!");
        this.downloader = new downloader_1.Downloader(playlistUrl, this.segmentsDirectory);
    }
    getFirstChunkPath() {
        let segments = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + "/" + it);
        segments.sort();
        let result = segments[0];
        utils_1.logD(`First chunk is ${result}`);
        return result;
    }
    getLastChunkPath() {
        let segments = fs.readdirSync(this.segmentsDirectory).map(it => this.segmentsDirectory + "/" + it);
        segments.sort();
        let result = segments[segments.length - 1];
        utils_1.logD(`Last chunk is ${result}`);
        return result;
    }
    setCurrentShow() {
        let activeShows = this.shows.filter(it => it.isActive(false));
        console.assert(activeShows.length == 1, `There can only be exactly one show active!
             Currently shows are ${this.shows.length} and active shows are ${activeShows.length}`);
        this.currentShow = activeShows[0];
        this.nextShow = this.shows[this.shows.indexOf(this.currentShow) + 1];
        utils_1.logD(`New current show is:\n${this.currentShow}`);
        this.nextEventTime = this.nextShow.offsetStartTime;
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
            return now >= this.startTime;
    }
    hasEnded(withOffset = true) {
        let now = Date.now();
        if (withOffset)
            return now >= this.offsetEndTime;
        else
            return now >= this.endTime;
    }
    isActive(withOffset = true) {
        return this.hasStarted(withOffset) && !this.hasEnded(withOffset);
    }
    static fromSchedule(show, schedule, offsetSeconds) {
        const offsetMillis = offsetSeconds * 1000;
        const now = new Date();
        const todayDayIndex = now.getDay();
        const showDayIndex = Days.indexOf(show.day);
        let newTime = now;
        if (showDayIndex > todayDayIndex) {
            const differenceDays = showDayIndex - todayDayIndex;
            newTime = moment().add(differenceDays, "days").toDate();
        }
        if (showDayIndex < todayDayIndex) {
            const differenceDays = todayDayIndex - showDayIndex;
            const offset = Days.length - differenceDays;
            newTime = moment().add(offset, "days").toDate();
        }
        const startTime = new Date(newTime.getFullYear(), newTime.getMonth(), newTime.getDate(), show.hour, show.minute).valueOf();
        const offsetStartTime = startTime - offsetMillis;
        const thisShowIndex = schedule.indexOf(show);
        const nextShowIndex = thisShowIndex == schedule.length - 1 ? 0 : thisShowIndex + 1;
        const nextShow = schedule[nextShowIndex];
        const nextShowDayIndex = Days.indexOf(nextShow.day);
        let nextShowTime = now;
        if (nextShowDayIndex > todayDayIndex) {
            const differenceDays = nextShowDayIndex - todayDayIndex;
            nextShowTime = moment().add(differenceDays, "days").toDate();
        }
        if (nextShowDayIndex < todayDayIndex) {
            const differenceDays = todayDayIndex - nextShowDayIndex;
            const offset = Days.length - differenceDays;
            nextShowTime = moment().add(offset, "days").toDate();
        }
        const endTime = new Date(nextShowTime.getFullYear(), nextShowTime.getMonth(), nextShowTime.getDate(), nextShow.hour, nextShow.minute).valueOf();
        const offsetEndTime = endTime + offsetMillis;
        return new ScheduledShow(show, startTime, offsetStartTime, endTime, offsetEndTime);
    }
    toString() {
        let obj = JSON.parse(JSON.stringify(this, null, 2));
        obj["startTimeFormatted"] = moment(this.startTime).format(main_1.momentFormat);
        obj["offsetStartTimeFormatted"] = moment(this.offsetStartTime).format(main_1.momentFormat);
        obj["endTimeFormatted"] = moment(this.endTime).format(main_1.momentFormat);
        obj["offsetEndTimeFormatted"] = moment(this.offsetEndTime).format(main_1.momentFormat);
        return JSON.stringify(obj, null, 2);
    }
}
