"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var os = require("os");
var path = require("path");
var ChunksDownloader_1 = require("./ChunksDownloader");
var ffmpeg_1 = require("./ffmpeg");
var stream_1 = require("./stream");
var StreamChooser_js_1 = require("./StreamChooser.js");
function download(config) {
    return __awaiter(this, void 0, void 0, function () {
        var runId, mergedSegmentsFile, segmentsDir, streamChooser, playlistUrl, chunksDownloader, segments, mergeFunction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    runId = Date.now();
                    mergedSegmentsFile = config.mergedSegmentsFile || os.tmpdir() + "/hls-downloader/" + runId + ".ts";
                    segmentsDir = config.segmentsDir || os.tmpdir() + "/hls-downloader/" + runId + "/";
                    // Create target directory
                    fs.mkdirpSync(path.dirname(mergedSegmentsFile));
                    fs.mkdirpSync(segmentsDir);
                    streamChooser = new StreamChooser_js_1.StreamChooser(config.streamUrl, config.httpHeaders);
                    return [4 /*yield*/, streamChooser.load()];
                case 1:
                    if (!(_a.sent())) {
                        return [2 /*return*/];
                    }
                    playlistUrl = streamChooser.getPlaylistUrl(config.quality);
                    if (!playlistUrl) {
                        return [2 /*return*/];
                    }
                    chunksDownloader = new ChunksDownloader_1.ChunksDownloader(playlistUrl, config.concurrency || 1, config.fromEnd || 1, segmentsDir, undefined, undefined, config.httpHeaders);
                    return [4 /*yield*/, chunksDownloader.start()];
                case 2:
                    _a.sent();
                    segments = fs.readdirSync(segmentsDir).map(function (f) { return segmentsDir + f; });
                    segments.sort();
                    mergeFunction = config.mergeUsingFfmpeg ? ffmpeg_1.mergeChunks : stream_1.mergeFiles;
                    return [4 /*yield*/, mergeFunction(segments, mergedSegmentsFile)];
                case 3:
                    _a.sent();
                    // Transmux
                    return [4 /*yield*/, ffmpeg_1.transmuxTsToMp4(mergedSegmentsFile, config.outputFile)];
                case 4:
                    // Transmux
                    _a.sent();
                    // Delete temporary files
                    fs.remove(segmentsDir);
                    fs.remove(mergedSegmentsFile);
                    return [2 /*return*/];
            }
        });
    });
}
exports.download = download;
