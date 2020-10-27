import {fileMoment, timer} from "../../shared/Utils"
import * as path from "path"
import {mkdirpSync} from "fs-extra"
import {SerializedShow, Show} from "./Show"
import {TimeOut} from "../../shared/Types"
import {StreamDownloader} from "../downloader/StreamDownloader"
import {Serializable} from "../../shared/Serializable"

export interface SerializedStream {
    name: string
    url: string
    state: StreamState
    scheduledShows: Array<SerializedShow>
    isForced: boolean
    streamDirectory: string
}

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
    public name: string

    /** Url of m3u8 playlist, this is used by {@link downloaders} */
    public url: string

    /** The list of shows that have a scheduled time, see {@link Show} */
    public scheduledShows: Array<Show>

    /** Has the user forced to record even when no shows active? */
    public isForced: boolean

    /** The special {@link StreamDownloader} used when {@link isForced} is true */
    public forcedDownloader: StreamDownloader | undefined

    /** Current state of Stream, see {@link StreamState} */
    public state: StreamState

    /** The {@link TimeOut} that manages the active shows and downloaders in {@link downloaders} */
    public activeShowManager: TimeOut

    /** Milliseconds used for {@link activeShowManager}*/
    public mainTimerIntervalMs: number

    /** Directory where this stream will be downloaded */
    public streamDirectory: string

    /** Keeps track of active shows and their {@link StreamDownloader} */
    public downloaders: Map<string, StreamDownloader>

    public constructor({name, url, scheduledShows, offsetSeconds, outputDirectory}: {
        name: string
        url: string
        scheduledShows: Array<Show>
        offsetSeconds: number
        outputDirectory: string
    }) {
        this.name = name
        this.url = url
        this.scheduledShows = scheduledShows.map(show => show.setOffsetSeconds(offsetSeconds))
        this.isForced = false
        this.state = "waiting" // anything other than "paused"
        this.mainTimerIntervalMs = 5000
        this.activeShowManager = timer(this.mainTimerIntervalMs, this.activeShowManagerTimer)
        this.streamDirectory = path.join(outputDirectory, this.name)
        mkdirpSync(this.streamDirectory)
        this.downloaders = new Map<string, StreamDownloader>()
    }

    private activeShowManagerTimer = () => {
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
        if (this.downloaders.isEmpty() && this.state === "downloading") this.state = "waiting"
        else if (this.downloaders.isNotEmpty() && this.state === "waiting") this.state = "downloading"
    }

    /** Indicates we are now ready to begin downloading shows when they become active */
    public async start(): Promise<void> {
        if (this.state === "paused") {
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
        this.downloaders.forEach((downloader: StreamDownloader) => {
            downloader.stop()
        })
        this.state = "paused"
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

    public static async fromSerializedStream(serializedStream: SerializedStream,
                                             outputDirectory: string, offsetSeconds: number): Promise<Stream> {
        return new Stream({
            name: serializedStream.name,
            url: serializedStream.url,
            scheduledShows: serializedStream.scheduledShows.map((serializedShow: SerializedShow) =>
                Show.fromSerializedShow(serializedShow, offsetSeconds)),
            offsetSeconds: offsetSeconds,
            outputDirectory: outputDirectory
        })
    }
}