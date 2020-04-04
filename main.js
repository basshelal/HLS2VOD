#!/usr/bin/env node
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
// Our code below
/*
 * Look for libraries that can help us with any of this!
 *
 * 1. Given a URL, we need to find the HLS streams's .m3u8 file
 *     the extension can provide us with the code that does this
 * 2. The playlist.m3u8 file will contain more m3u8 files for each version of the stream,
 *     from lowest to highest quality, read this playlist.m3u8 file to get the info
 * 3. Each m3u8 file will now contain URLs to a few videos representing "chunks" of the stream
 *     these will be in .ts format and typically 2 to 5 seconds each, download these as they come
 * 4. The m3u8 will be constantly changing so we need to listen to those changes somehow
 *
 */ 
