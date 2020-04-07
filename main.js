#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var downloader_1 = require("./downloader");
var app = require('./app');
var debug = require('debug')('newsstreamdownloader:server');
var http = require('http');
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
var stdin = process.openStdin();
stdin.on('data', function (input) {
    console.log(input.toString());
    if (input.toString().trim() == "stop") {
        console.log("Stopping!");
        downloader_1.downloader.stop();
        downloader_1.mergeAll_().then(function () {
            process.exit(0);
        });
    }
});
var alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
var alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";
downloader_1.startDownloader(alArabyUrl);
