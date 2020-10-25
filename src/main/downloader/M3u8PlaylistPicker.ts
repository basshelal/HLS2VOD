// @ts-ignore
import * as m3u8 from "m3u8-parser"
import {get} from "./Http"
import {URL} from "url"
import {logE} from "../../shared/Log"

export default async function M3u8PlaylistPicker(streamUrl: string,
                                                 maxBandwidth: "worst" | "best" | number = "best"): Promise<string> {
    // TODO: Throw Errors depending on what went wrong
    const streams: string = await get(streamUrl)

    const parser = new m3u8.Parser()
    parser.push(streams)
    parser.end()

    const manifest = parser.manifest

    const isValid = (manifest.segments && manifest.segments.length > 0)
        || (manifest.playlists && manifest.playlists.length > 0)

    if (!isValid) throw Error(`StreamUrl provided is not valid`)

    let playlistUrl: string

    // If we already provided a playlist URL
    if (manifest.segments && manifest.segments.length > 0) playlistUrl = streamUrl

    // Find the most relevant playlist
    if (manifest.playlists && manifest.playlists.length > 0) {
        let compareFn: (prev: m3u8.ManifestPlaylist, current: m3u8.ManifestPlaylist) => m3u8.ManifestPlaylist
        if (maxBandwidth === "best") {
            compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current
        } else if (maxBandwidth === "worst") {
            compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev
        } else {
            compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current
        }
        const uri = manifest.playlists.reduce(compareFn).uri
        playlistUrl = new URL(uri, streamUrl).href
    } else {
        logE(`No stream or playlist found in URL: ${streamUrl}`)
        throw Error(`StreamUrl provided is not valid`)
    }

    return playlistUrl
}