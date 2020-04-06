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
var url_1 = require("url");
var http_1 = require("./http");
var StreamChooser = /** @class */ (function () {
    function StreamChooser(streamUrl, httpHeaders) {
        this.streamUrl = streamUrl;
        this.httpHeaders = httpHeaders;
    }
    StreamChooser.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var streams, parser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, http_1.get(this.streamUrl, this.httpHeaders)];
                    case 1:
                        streams = _a.sent();
                        parser = new m3u8.Parser();
                        parser.push(streams);
                        parser.end();
                        this.manifest = parser.manifest;
                        return [2 /*return*/, (this.manifest.segments && this.manifest.segments.length > 0)
                                || (this.manifest.playlists && this.manifest.playlists.length > 0)
                                || false];
                }
            });
        });
    };
    StreamChooser.prototype.isMaster = function () {
        if (!this.manifest) {
            throw Error("You need to call 'load' before 'isMaster'");
        }
        return this.manifest.playlists && this.manifest.playlists.length > 0 || false;
    };
    StreamChooser.prototype.getPlaylistUrl = function (maxBandwidth) {
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
            var compareFn = void 0;
            if (maxBandwidth === "best") {
                compareFn = function (prev, current) { return (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current; };
            }
            else if (maxBandwidth === "worst") {
                compareFn = function (prev, current) { return (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? current : prev; };
            }
            else {
                compareFn = function (prev, current) { return (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH || current.attributes.BANDWIDTH > maxBandwidth) ? prev : current; };
            }
            var uri = this.manifest.playlists.reduce(compareFn).uri;
            return new url_1.URL(uri, this.streamUrl).href;
        }
        console.error("No stream or playlist found in URL:", this.streamUrl);
        return false;
    };
    return StreamChooser;
}());
exports.StreamChooser = StreamChooser;
