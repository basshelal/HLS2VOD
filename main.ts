import {startDownloader, stopAllDownloaders} from "./downloader";
import * as electron from "electron";
import {Schedule, Show} from "./stream";
import {print} from "./utils";
import DateTimeFormat = Intl.DateTimeFormat;

function stop() {
    stopAllDownloaders().then(electron.app.quit)
}

function createWindow() {
    let window = new electron.BrowserWindow({
        center: true,
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    window.loadFile('layouts/main.html');
}

electron.app.allowRendererProcessReuse = true;

electron.app.whenReady().then(createWindow);

electron.app.on('window-all-closed', stop);

let currentDownloading = [];

electron.ipcMain.on('invokeAction', (event, data) => {
    if (data === "alJazeera") {
        if (!currentDownloading.find(it => it === aljazeeraUrl)) {
            startDownloader(aljazeeraUrl);
            currentDownloading.push(aljazeeraUrl);
        }
    }
    if (data === "alHiwar") {
        if (!currentDownloading.find(it => it === alHiwarUrl)) {
            startDownloader(alHiwarUrl);
            currentDownloading.push(alHiwarUrl);
        }
    }
    if (data === "alAraby") {
        if (!currentDownloading.find(it => it === alArabyUrl)) {
            startDownloader(alArabyUrl);
            currentDownloading.push(alArabyUrl);
        }
    }
});

const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
const aljazeeraUrl = "https://live-hls-web-aja.getaj.net/AJA/index.m3u8";

Schedule.fromJson("res/schedule.json").then(schedule => {
    console.log(JSON.stringify(schedule, null, 2))
    console.log(schedule[0])
    console.log(schedule.length)
    console.log(schedule[0].date)
    console.log(schedule[0].date.day)
    console.log(schedule[0].date.time)
    let now = new Date()
    let show = schedule[1] as Show
    print(show.date.time.hour)
    print(show.date.time.minute)
    let scheduledTime = show.getActualDate()

    print(scheduledTime.getHours())
    print(scheduledTime.getSeconds())

    let dateTimeFormat = DateTimeFormat("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", hour12: false
    });

    print(dateTimeFormat.format(now))
    print(dateTimeFormat.format(scheduledTime))
    print(show.hasStarted())
    let finishDate = new Date()
    finishDate.setHours(12, 41)
    print(show.hasFinished(finishDate, 30))
});