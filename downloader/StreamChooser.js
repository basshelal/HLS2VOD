"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const m3u8 = require("m3u8-parser");
const url_1 = require("url");
const http_1 = require("./http");
class StreamChooser {
    constructor(streamUrl, httpHeaders) {
        this.streamUrl = streamUrl;
        this.httpHeaders = httpHeaders;
    }
    async load() {
        const streams = await http_1.get(this.streamUrl, this.httpHeaders);
        const parser = new m3u8.Parser();
        parser.push(streams);
        parser.end();
        this.manifest = parser.manifest;
        return (this.manifest.segments && this.manifest.segments.length > 0)
            || (this.manifest.playlists && this.manifest.playlists.length > 0)
            || false;
    }
    isMaster() {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'isMaster'");
        }
        return this.manifest.playlists && this.manifest.playlists.length > 0 || false;
    }
    getPlaylistUrl(maxBandwidth) {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'getPlaylistUrl'");
        }
        // If we already provided a playlist URL
        if (this.manifest.segments && this.manifest.segments.length > 0) {
            return this.streamUrl;
        }
        // You need a quality parameter with a master playlist
        if (!maxBandwidth) {
            console.error("You need to provide a quality with a master playlist");
            return false;
        }
        // Find the most relevant playlist
        if (this.manifest.playlists && this.manifest.playlists.length > 0) {
            let compareFn;
            if (maxBandwidth === "best") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current;
            }
            else if (maxBandwidth === "worst") {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev;
            }
            else {
                compareFn = (prev, current) => (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current;
            }
            const uri = this.manifest.playlists.reduce(compareFn).uri;
            return new url_1.URL(uri, this.streamUrl).href;
        }
        console.error("No stream or playlist found in URL:", this.streamUrl);
        return false;
    }
}
exports.StreamChooser = StreamChooser;
