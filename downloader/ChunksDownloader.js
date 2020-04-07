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
var m3u8 = require("m3u8-parser");
var p_queue_1 = require("p-queue");
var path = require("path");
var url_1 = require("url");
var http_1 = require("./http");
var ChunksDownloader = /** @class */ (function () {
    function ChunksDownloader(playlistUrl, concurrency, fromEnd, segmentDirectory, timeoutDuration, playlistRefreshInterval, httpHeaders, onDownloadSegment) {
        if (timeoutDuration === void 0) { timeoutDuration = 60; }
        if (playlistRefreshInterval === void 0) { playlistRefreshInterval = 5; }
        this.playlistUrl = playlistUrl;
        this.concurrency = concurrency;
        this.fromEnd = fromEnd;
        this.segmentDirectory = segmentDirectory;
        this.timeoutDuration = timeoutDuration;
        this.playlistRefreshInterval = playlistRefreshInterval;
        this.httpHeaders = httpHeaders;
        this.onDownloadSegment = onDownloadSegment;
        this.queue = new p_queue_1.default({
            concurrency: this.concurrency,
        });
    }
    ChunksDownloader.prototype.start = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
            _this.queue.add(function () { return _this.refreshPlayList(); });
        });
    };
    ChunksDownloader.prototype.refreshPlayList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var playlist, interval, segments, toLoad, index, _loop_1, this_1, _i, toLoad_1, uri;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadPlaylist()];
                    case 1:
                        playlist = _a.sent();
                        interval = playlist.targetDuration || this.playlistRefreshInterval;
                        segments = playlist.segments.map(function (s) { return new url_1.URL(s.uri, _this.playlistUrl).href; });
                        this.refreshHandle = setTimeout(function () { return _this.refreshPlayList(); }, interval * 1000);
                        toLoad = [];
                        if (!this.lastSegment) {
                            toLoad = segments.slice(segments.length - this.fromEnd);
                        }
                        else {
                            index = segments.indexOf(this.lastSegment);
                            if (index < 0) {
                                console.error("Could not find last segment in playlist");
                                toLoad = segments;
                            }
                            else if (index === segments.length - 1) {
                                console.log("No new segments since last check");
                                return [2 /*return*/];
                            }
                            else {
                                toLoad = segments.slice(index + 1);
                            }
                        }
                        this.lastSegment = toLoad[toLoad.length - 1];
                        _loop_1 = function (uri) {
                            console.log("Queued:", uri);
                            this_1.queue.add(function () { return _this.downloadSegment(uri); });
                        };
                        this_1 = this;
                        for (_i = 0, toLoad_1 = toLoad; _i < toLoad_1.length; _i++) {
                            uri = toLoad_1[_i];
                            _loop_1(uri);
                        }
                        // Timeout after X seconds without new segment
                        if (this.timeoutHandle) {
                            clearTimeout(this.timeoutHandle);
                        }
                        this.timeoutHandle = setTimeout(function () { return _this.timeout(); }, this.timeoutDuration * 1000);
                        return [2 /*return*/];
                }
            });
        });
    };
    ChunksDownloader.prototype.stop = function () {
        console.log("No new segment for a while, stopping");
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }
        this.resolve();
    };
    ChunksDownloader.prototype.timeout = function () {
        console.log("No new segment for a while, stopping");
        this.stop();
    };
    ChunksDownloader.prototype.loadPlaylist = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, parser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, http_1.get(this.playlistUrl, this.httpHeaders)];
                    case 1:
                        response = _a.sent();
                        parser = new m3u8.Parser();
                        parser.push(response);
                        parser.end();
                        return [2 /*return*/, parser.manifest];
                }
            });
        });
    };
    ChunksDownloader.prototype.downloadSegment = function (segmentUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var question, filename, slash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        question = segmentUrl.indexOf("?");
                        filename = question > 0 ? segmentUrl.substr(0, question) : segmentUrl;
                        slash = filename.lastIndexOf("/");
                        filename = filename.substr(slash + 1);
                        // Download file
                        return [4 /*yield*/, http_1.download(segmentUrl, path.join(this.segmentDirectory, filename), this.httpHeaders)];
                    case 1:
                        // Download file
                        _a.sent();
                        console.log("Downloaded:", segmentUrl);
                        this.onDownloadSegment();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ChunksDownloader;
}());
exports.ChunksDownloader = ChunksDownloader;
