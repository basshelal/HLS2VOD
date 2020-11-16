import {fileMoment, timer} from "../../shared/Utils"
import * as path from "path"
import {mkdirpSync} from "fs-extra"
import {Show} from "./Show"
import {TimeOut} from "../../shared/Types"
import {StreamDownloader} from "../downloader/StreamDownloader"
import {Serializable, SerializedShow, SerializedStream} from "../../shared/Serialized"
import {AllSettings} from "../Database"

export type StreamState =
/** Actively downloading segments */
    "downloading"
    /** Ready to download but waiting for shows to be active */
    | "waiting"
    /** Not downloading, even if shows are active */
    | "paused"

export class Stream
    implements Serializable<SerializedStream> {

    /** Name of stream, must be unique so can be used as identifier */
    public name: string // @Serialized

    /** Url of m3u8 playlist, this is used by {@link downloaders} */
    public url: string // @Serialized

    /** The list of shows that have a scheduled time, see {@link Show} */
    public scheduledShows: Array<Show> // @Serialized

    /** Has the user forced to record even when no shows active? */
    public isForced: boolean // @Serialized

    /** Current state of Stream, see {@link StreamState} */
    public state: StreamState // @Serialized

    /** Directory where this stream will be downloaded */
    public streamDirectory: string // @Serialized

    /** The {@link TimeOut} that manages the active shows and downloaders in {@link downloaders} */
    public activeShowManager: TimeOut

    /** Milliseconds used for {@link activeShowManager}*/
    public mainTimerIntervalMs: number

    public setMainTimerInterval(millis: number) {
        this.mainTimerIntervalMs = millis
        clearInterval(this.activeShowManager)
        this.activeShowManager = timer(this.mainTimerIntervalMs, this.activeShowManagerTimer)
    }

    /** Keeps track of active shows and their {@link StreamDownloader} */
    public downloaders: Map<string, StreamDownloader>

    /** The special {@link StreamDownloader} used when {@link isForced} is true */
    public forcedDownloader: StreamDownloader | undefined

    public constructor({name, url, scheduledShows, allSettings}: {
        name: string
        url: string
        scheduledShows: Array<Show>
        allSettings: AllSettings
    }) {
        this.name = name
        this.url = url
        this.scheduledShows = scheduledShows.map(show => show.setOffsetSeconds(allSettings.offsetSeconds))
        this.isForced = false
        this.state = "waiting" // anything other than "paused"
        this.downloaders = new Map<string, StreamDownloader>()
        this.mainTimerIntervalMs = 5000
        this.activeShowManagerTimer = this.activeShowManagerTimer.bind(this)
        this.activeShowManager = timer(this.mainTimerIntervalMs, this.activeShowManagerTimer)
        this.streamDirectory = path.join(allSettings.outputDirectory, this.name)
        mkdirpSync(this.streamDirectory)
    }

    private activeShowManagerTimer() {
        this.scheduledShows.forEach(async (show: Show) => {
            if (show.isActive(true) && this.downloaders.notHas(show.name)) {
                const showDir: string = path.join(this.streamDirectory, show.name)
                mkdirpSync(showDir)
                const downloader: StreamDownloader = new StreamDownloader({
                    streamUrl: this.url,
                    outputPath: path.join(showDir, `${fileMoment()}.mp4`)
                })
                this.downloaders.set(show.name, downloader)
                if (this.state !== "paused") await downloader.start()
            } else if (!show.isActive(true) && this.downloaders.has(show.name)) {
                const downloader = this.downloaders.get(show.name)
                if (downloader && downloader.isDownloading) downloader.stop()
                this.downloaders.delete(show.name)
            }
        })
        if (this.state !== "paused") {
            if (this.downloaders.isEmpty()) this.state = "waiting"
            else this.state = "downloading"
        }
    }

    /** Indicates we are now ready to begin downloading shows when they become active */
    public async start(): Promise<void> {
        if (this.state !== "waiting" && this.state !== "downloading") {
            if (this.downloaders.isEmpty()) this.state = "waiting"
            else {
                this.downloaders.forEach((downloader: StreamDownloader) => {
                    downloader.start()
                })
                this.state = "downloading"
            }
        }
    }

    /** Indicates we want to pause downloading shows even if they are active */
    public async pause(): Promise<void> {
        if (this.state !== "paused") {
            this.downloaders.forEach((downloader: StreamDownloader) => {
                downloader.stop()
            })
            this.state = "paused"
        }
    }

    /** Indicates we want to download stream anyway even if there are no active shows */
    public async forceRecord(): Promise<void> {
        if (!this.isForced) {
            await this.start()
            this.forcedDownloader = new StreamDownloader({
                streamUrl: this.url,
                outputPath: path.join(this.streamDirectory, `${fileMoment()}.mp4`)
            })
            await this.forcedDownloader.start()
            this.isForced = true
        }
    }

    /** Indicates we want to go back to normal behavior, ie download only when there are active shows */
    public async unForceRecord(): Promise<void> {
        if (this.isForced) {
            if (this.forcedDownloader) {
                this.forcedDownloader.stop()
                this.forcedDownloader = undefined
            }
            this.isForced = false
        }
    }

    /** Serialize to a {@link SerializedStream}, implemented from {@link Serializable} */
    public serialize(): SerializedStream {
        return {
            name: this.name,
            url: this.url,
            state: this.state,
            scheduledShows: this.scheduledShows.map(show => show.serialize()),
            isForced: this.isForced,
            streamDirectory: this.streamDirectory
        }
    }

    public static fromSerializedStream({serializedStream, allSettings}: {
        serializedStream: SerializedStream
        allSettings: AllSettings
    }): Stream {
        return new Stream({
            name: serializedStream.name,
            url: serializedStream.url,
            scheduledShows: serializedStream.scheduledShows.map((serializedShow: SerializedShow) =>
                Show.fromSerializedShow(serializedShow)),
            allSettings: allSettings
        })
    }
}