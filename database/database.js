"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("nedb");
exports.settingsDatabase = new Datastore({ filename: "database/settings.db", autoload: true });
exports.streamsDatabase = new Datastore({ filename: "database/streams.db", autoload: true });
exports.Settings = {
    async setRootDirectory(newRootDirectory) {
        return new Promise((resolve, reject) => exports.settingsDatabase.update({ key: "rootDirectory" }, { key: "rootDirectory", value: newRootDirectory }, {}, (err, numberOfUpdated, upsert) => {
            if (err)
                reject(err);
            else
                resolve();
        }));
    },
    async getRootDirectory() {
        return new Promise((resolve, reject) => exports.settingsDatabase.find({ key: "rootDirectory" }, (err, documents) => {
            if (err)
                reject(err);
            else if (!documents || documents.length == 0)
                reject("Documents is null or empty");
            else
                resolve(documents[0].value);
        }));
    }
};
function streamToStreamEntry(stream) {
    return {
        name: stream.name,
        playlistUrl: stream.playlistUrl,
        schedulePath: stream.schedulePath,
        offsetSeconds: stream.offsetSeconds
    };
}
exports.Streams = {
    async addNewStream(stream) {
        return new Promise((resolve, reject) => exports.streamsDatabase.update({ name: stream.name }, streamToStreamEntry(stream), { upsert: true }, (err, numberOfUpdated, upsert) => {
            if (err)
                reject(err);
            else
                resolve();
        }));
    },
    async getAllStreams() {
        return new Promise((resolve, reject) => exports.streamsDatabase.find({}, (err, documents) => {
            if (err)
                reject(err);
            else
                resolve(documents);
        }));
    },
    async deleteStream(stream) {
        return null;
    },
    async updateStream(streamName, updatedStream) {
        return null;
    },
    async getStreamByName(streamName) {
        return new Promise((resolve, reject) => exports.streamsDatabase.find({ name: streamName }, (err, documents) => {
            if (err)
                reject(err);
            else if (!documents || documents.length == 0)
                reject("Documents is null or empty");
            else
                resolve(documents[0]);
        }));
    },
};
