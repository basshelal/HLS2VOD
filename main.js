#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var downloader_1 = require("./downloader");
var app = require('./app');
var debug = require('debug')('newsstreamdownloader:server');
var http = require('http');
var nodeFetch = require("node-fetch");
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
var port = normalizePort(process.env.PORT || '42069');
app.set('port', port);
var server = http.createServer(app);
server.listen(port);
server.on('error', function (error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
server.on('listening', function () {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
});
// Our code below
/*
 * Look for libraries that can help us with any of this!
 *
 * 1. Given a URL, we need to find the HLS streams's .m3u8 file
 *     the extension can provide us with the code that does this
 *
 * 2. The playlist.m3u8 file will contain more m3u8 files for each version of the stream,
 *     from lowest to highest quality, read this playlist.m3u8 file to get the info
 *
 * 3. Each m3u8 file will now contain URLs to a few videos representing "chunks" of the stream
 *     these will be in .ts format and typically 2 to 5 seconds each, download these as they come
 *
 * 4. The m3u8 will be constantly changing so we need to listen to those changes somehow
 *
 */
var myTwitchUrl = "https://usher.ttvnw.net/api/channel/hls/basshelal.m3u8" +
    "?allow_source=true&fast_bread=true&p=2071208&play_session_id=322565b8c41780c6514136b1ef0b238d&" +
    "player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&" +
    "sig=328179a8f74fb2d312b61960124679b678cfb7a5&" +
    "supported_codecs=avc1&token=%7B%22adblock%22%3Atrue%2C%22authorization%22%3A%7B%22" +
    "forbidden%22%3Afalse%2C%22reason%22%3A%22%22%7D%2C%22blackout_enabled%22%3Afalse%2C%22channel" +
    "%22%3A%22basshelal%22%2C%22channel_id%22%3A216747279%2C%22chansub%22%3A%7B%22restricted_bitrates" +
    "%22%3A%5B%5D%2C%22view_until%22%3A1924905600%7D%2C%22ci_gb%22%3Afalse%2C%22geoblock_reason%22%3A%22%22%2C%22device_id" +
    "%22%3A%2254d4589a9a2c2c7a%22%2C%22expires%22%3A1586148919%2C%22extended_history_allowed%22%3Afalse%2C%22game%22%3A%22%22%2C%22hide_ads" +
    "%22%3Afalse%2C%22https_required%22%3Atrue%2C%22mature%22%3Afalse%2C%22partner%22%3Afalse%2C%22platform%22%3A%22web%22%2C%22player_type" +
    "%22%3A%22site%22%2C%22private%22%3A%7B%22allowed_to_view%22%3Atrue%7D%2C%22privileged%22%3Afalse%2C%22server_ads%22%3Atrue%2C%22show_ads%22%3Atrue" +
    "%2C%22subscriber%22%3Afalse%2C%22turbo%22%3Afalse%2C%22user_id%22%3A216747279%2C%22user_ip%22%3A%2281.104.162.240%22%2C%22version%22%3A2%7D&cdm=wv&player_version=0.9.5";
var alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
// Node HLS Downloader
// https://www.npmjs.com/package/node-hls-downloader
// This is good, it works, downloads the ts videos and all we need to provide it is the m3u8 url
// but there is no flexibility or control! I think it merges at the end of the stream which isn't great
// I think this is good for a fork! If we want to do this ourselves we can use the code from this library!
downloader_1.download({
    quality: "best",
    concurrency: 25,
    mergeUsingFfmpeg: true,
    segmentsDir: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\segments",
    mergedSegmentsFile: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\merged.ts",
    outputFile: "C:\\Users\\bassh\\Desktop\\StreamDownloader\\video.mp4",
    streamUrl: alHiwarUrl
});
