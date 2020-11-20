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

    /** The {@link TimeOut} that calls {@link refreshActiveShowManager} to manage active shows and downloaders */
    public activeShowManager: TimeOut | undefined

    /** Milliseconds used for {@link activeShowManager}*/
    public mainTimerIntervalMs: number

    /** Update {@link mainTimerIntervalMs} the correct way */
    public setMainTimerInterval(millis: number) {
        this.mainTimerIntervalMs = millis
        if (this.activeShowManager) clearInterval(this.activeShowManager)
        this.activeShowManager = timer(this.mainTimerIntervalMs, this.refreshActiveShowManager)
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
        this.scheduledShows = scheduledShows
        this.isForced = false
        this.state = "waiting" // anything other than "paused"
        this.downloaders = new Map<string, StreamDownloader>()
        this.mainTimerIntervalMs = 5000
        this.refreshActiveShowManager = this.refreshActiveShowManager.bind(this)
        this.activeShowManager = timer(this.mainTimerIntervalMs, this.refreshActiveShowManager)
        this.streamDirectory = path.join(allSettings.outputDirectory, this.name)
        mkdirpSync(this.streamDirectory)
    }

    /**
     * This is called by the {@link activeShowManager} but can also be called directly if needed
     * This function manages active shows and their respective {@link downloaders} as well as maintaining
     * this Stream's {@link state}, this does not deal with the forced state of the Stream
     */
    public async refreshActiveShowManager(): Promise<void> {
        await this.scheduledShows.awaitForEach(async (show: Show) => {
            if (show.isActive(true) && this.downloaders.notHas(show.name)) {
                const showDir: string = path.join(this.streamDirectory, show.name)
                mkdirpSync(showDir)
                const downloader: StreamDownloader = new StreamDownloader({
                    streamUrl: this.url,
                    outputPath: path.join(showDir, `${fileMoment()}.mp4`)
                })
                this.downloaders.set(show.name, downloader)
                if (this.isRunning) await downloader.start()
            } else if (!show.isActive(true) && this.downloaders.has(show.name)) {
                const downloader = this.downloaders.get(show.name)
                if (downloader) downloader.stop()
                this.downloaders.delete(show.name)
            }
        })
        this.downloaders
            .filter((_, name: string) => this.scheduledShows.map(it => it.name).notContains(name))
            .forEach((_, name: string) => {
                const downloader = this.downloaders.get(name)
                if (downloader) downloader.stop()
                this.downloaders.delete(name)
            })
        if (this.isRunning) {
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
        if (this.isRunning) {
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

    /** True if {@link state} is not "paused" */
    public get isRunning(): boolean { return this.state !== "paused" }

    /** Destroys this stream, this stops all downloaders and the {@link activeShowManager} */
    public async destroy(): Promise<void> {
        if (this.activeShowManager) clearInterval(this.activeShowManager)
        this.activeShowManager = undefined
        this.downloaders.forEach((downloader: StreamDownloader) => downloader.stop())
        this.downloaders.clear()
        await this.unForceRecord()
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

    /** Creates a new {@link Stream} from a {@link SerializedStream} */
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