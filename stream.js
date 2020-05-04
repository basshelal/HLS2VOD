"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("./downloader/downloader");
const fs = require("fs");
const fsextra = require("fs-extra");
const csv = require("csvtojson");
const moment = require("moment");
const utils_1 = require("./utils");
const main_1 = require("./main");
const path = require("path");
const hidefile_1 = require("hidefile");
const events_1 = require("events");
async function newStream(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory) {
    const stream = new Stream(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory);
    await stream.initialize();
    return stream;
}
exports.newStream = newStream;
class Stream extends events_1.EventEmitter {
    constructor(name, playlistUrl, schedulePath, schedule, offsetSeconds, rootDirectory) {
        super();
        this.isDownloading = false;
        this.isRunning = true;
        this.name = name;
        this.playlistUrl = playlistUrl;
        this.schedulePath = schedulePath;
        this.schedule = schedule;
        this.rootDirectory = rootDirectory;
        this.scheduledShows = schedule.map(it => ScheduledShow.fromSchedule(it, schedule, offsetSeconds));
        this.streamDirectory = path.join(this.rootDirectory, this.name);
        this.segmentsDirectory = path.join(this.streamDirectory, ".segments");
        fsextra.mkdirpSync(this.streamDirectory);
        fsextra.mkdirpSync(this.segmentsDirectory);
        this.segmentsDirectory = hidefile_1.hideSync(this.segmentsDirectory);
        this.setCurrentShow();
        this.setInterval();
    }
    async initialize() {
        const streamChooser = new downloader_1.StreamChooser(this.playlistUrl);
        if (!await streamChooser.load())
            throw Error("StreamChooser failed!");
        const playlistUrl = streamChooser.getPlaylistUrl("best");
        if (!playlistUrl)
            throw Error("PlaylistUrl failed!");
        this.downloader = new downloader_1.Downloader(playlistUrl, this.segmentsDirectory);
        this.emit("initialized");
    }
    async destroy() {
        // TODO
        this.emit("destroyed");
    }
    async startDownloading() {
        if (!this.isDownloading && this.downloader) {
            await this.downloader.start();
            this.isDownloading = true;
            this.emit("started");
        }
    }
    async pauseDownloading() {
        if (this.isDownloading && this.downloader) {
            this.downloader.pause();
            this.isDownloading = false;
            this.emit("paused");
        }
    }
    async resumeDownloading() {
        if (!this.isDownloading && this.downloader) {
            this.downloader.resume();
            this.isDownloading = true;
            this.emit("resumed");
        }
    }
    async stopDownloading() {
        if (this.isDownloading && this.downloader) {
            this.downloader.stop();
            await this.downloader.merge(this.getFirstChunkPath(), this.getLastChunkPath(), path.join(this.streamDirectory, "_unfinished"), `${moment().format(main_1.momentFormatSafe)}.mp4`);
            this.downloader.deleteAllSegments();
            this.isDownloading = false;
            this.emit("stopped");
        }
    }
    async mergeCurrentShow() {
        if (!this.currentShow.startChunkName)
            this.currentShow.startChunkName = this.getFirstChunkPath();
        if (!this.currentShow.endChunkName)
            this.currentShow.endChunkName = this.getLastChunkPath();
        if (this.downloader) {
            // TODO ideally we should merge all into a merged.ts in the output dir, then delete all unnecessary segments
            //  continue downloading and while doing that transmux and delete the merged.ts
            //  this way we have less downtime and more isolation
            this.emit("merging");
            await this.downloader.merge(this.currentShow.startChunkName, this.currentShow.endChunkName, path.join(this.streamDirectory, this.currentShow.name), `${moment().format(main_1.momentFormatSafe)}.mp4`);
            this.downloader.deleteSegments(this.currentShow.startChunkName, this.nextShow.startChunkName);
        }
    }
    getFirstChunkPath() {
        const segments = fs.readdirSync(this.segmentsDirectory).map(it => path.join(this.segmentsDirectory, it));
        segments.sort();
        const result = segments[0];
        utils_1.logD(`First chunk is ${result}`);
        return result;
    }
    getLastChunkPath() {
        const segments = fs.readdirSync(this.segmentsDirectory).map(it => path.join(this.segmentsDirectory, it));
        segments.sort();
        const result = segments[segments.length - 1];
        utils_1.logD(`Last chunk is ${result}`);
        return result;
    }
    setInterval() {
        this.mergerTimeOut = setInterval(async () => {
            let now = Date.now();
            if (now > this.nextEventTime && this.isRunning) {
                // TODO if schedule has changed we should probably re-read it here
                this.pauseDownloading();
                this.isRunning = false;
                if (this.nextShow.hasStarted(true)) {
                    utils_1.logD("Next show has started!");
                    if (!this.nextShow.startChunkName)
                        this.nextShow.startChunkName = this.getLastChunkPath();
                    utils_1.logD(`It is ${this.nextShow}`);
                    this.nextEventTime = this.currentShow.offsetEndTime;
                }
                if (this.currentShow.hasEnded(true)) {
                    utils_1.logD("Current show has ended!");
                    if (!this.currentShow.endChunkName)
                        this.currentShow.endChunkName = this.getLastChunkPath();
                    utils_1.logD(`It is ${this.currentShow}`);
                    await this.mergeCurrentShow();
                    this.setCurrentShow();
                    if (!this.currentShow.startChunkName)
                        this.currentShow.startChunkName = this.getFirstChunkPath();
                }
                this.resumeDownloading();
                this.isRunning = true;
            }
        }, 1000);
    }
    toStreamEntry() {
        return {
            name: this.name,
            playlistUrl: this.playlistUrl,
            schedulePath: this.schedulePath,
        };
    }
    emit(event) {
        return super.emit(event, this);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    addStreamListener(listener) {
        if (listener.onInitialized)
            this.on("initialized", listener.onInitialized);
        if (listener.onDestroyed)
            this.on("destroyed", listener.onDestroyed);
        if (listener.onStarted)
            this.on("started", listener.onStarted);
        if (listener.onPaused)
            this.on("paused", listener.onPaused);
        if (listener.onResumed)
            this.on("resumed", listener.onResumed);
        if (listener.onStopped)
            this.on("stopped", listener.onStopped);
        if (listener.onNewCurrentShow)
            this.on("newCurrentShow", listener.onNewCurrentShow);
        if (listener.onMerging)
            this.on("merging", listener.onMerging);
    }
    setCurrentShow() {
        const activeShows = this.scheduledShows.filter(it => it.isActive(false));
        utils_1.assert(activeShows.length == 1, `There can only be exactly one show active!
             Currently shows are ${this.scheduledShows.length} and active shows are ${activeShows.length}`);
        this.currentShow = activeShows[0];
        const currentShowIndex = this.scheduledShows.indexOf(this.currentShow);
        const nextIndex = currentShowIndex + 1 <= this.scheduledShows.length ? currentShowIndex + 1 : 0;
        this.nextShow = this.scheduledShows[nextIndex];
        utils_1.logD(`New current show is:\n${this.currentShow}`);
        this.nextEventTime = this.nextShow.offsetStartTime;
        this.emit("newCurrentShow");
    }
    toString() {
        return JSON.stringify(this.toStreamEntry(), null, 2);
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
