import {downloader, mergeAll_, startDownloader} from "./downloader";

const app = require('./app');
const debug = require('debug')('newsstreamdownloader:server');
const http = require('http');

function normalizePort(val) {
    let port = parseInt(val, 10);

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

let port = normalizePort(process.env.PORT || '42069');
app.set('port', port);

let server = http.createServer(app);

server.listen(port);

server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
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

server.on('listening', () => {
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
});

process.openStdin().on('data', (input: string) => {
    console.log(input.toString());
    if (input.toString().trim() == "stop") {
        console.log("Stopping!");
        downloader.stop();
        mergeAll_().then(() => {
                process.exit(0);
            }
        );
    }
});

const alHiwarUrl = "https://mn-nl.mncdn.com/alhiwar_live/smil:alhiwar.smil/playlist.m3u8";
const alArabyUrl = "https://alaraby.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/playlist.m3u8";

startDownloader(alArabyUrl);