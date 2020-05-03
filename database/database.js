"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("nedb");
exports.settingsDatabase = new Datastore({ filename: "database/settings.db", autoload: true });
exports.streamsDatabase = new Datastore({ filename: "database/streams.db", autoload: true });
exports.Settings = {
    async getAllSettings() {
        return new Promise((resolve, reject) => {
            exports.settingsDatabase.find({}, (err, documents) => {
                if (err)
                    reject(err);
                else
                    resolve(documents);
            });
        });
    },
    async getAllSettingsMapped() {
        const settingsArray = await this.getAllSettings();
        return new Map(settingsArray.map(it => [it.key, it.value]));
    },
    // region outputDirectory
    async setOutputDirectory(newOutputDirectory) {
        return new Promise((resolve, reject) => exports.settingsDatabase.update({ key: "outputDirectory" }, { key: "outputDirectory", value: newOutputDirectory }, { upsert: true, returnUpdatedDocs: true }, (err, numberOfUpdated, affectedDocuments, upsert) => {
            if (err)
                reject(err);
            else
                resolve(affectedDocuments.value);
        }));
    },
    async getOutputDirectory() {
        return new Promise((resolve, reject) => exports.settingsDatabase.find({ key: "outputDirectory" }, (err, documents) => {
            if (err)
                reject(err);
            else if (!documents || documents.length == 0)
                reject("Documents is null or empty");
            else
                resolve(documents[0].value);
        }));
    },
    // endregion outputDirectory
    // region offsetSeconds
    async setOffsetSeconds(newOffsetSeconds) {
        return new Promise((resolve, reject) => exports.settingsDatabase.update({ key: "offsetSeconds" }, { key: "offsetSeconds", value: newOffsetSeconds }, { upsert: true, returnUpdatedDocs: true }, (err, numberOfUpdated, affectedDocuments, upsert) => {
            if (err)
                reject(err);
            else
                resolve(Number.parseInt(affectedDocuments.value));
        }));
    },
    async getOffsetSeconds() {
        return new Promise((resolve, reject) => exports.settingsDatabase.find({ key: "offsetSeconds" }, (err, documents) => {
            if (err)
                reject(err);
            else if (!documents || documents.length == 0)
                reject("Documents is null or empty");
            else
                resolve(Number.parseInt(documents[0].value));
        }));
    },
};
exports.Streams = {
    async addStream(stream) {
        return new Promise((resolve, reject) => exports.streamsDatabase.update({ name: stream.name }, stream.toStreamEntry(), { upsert: true }, (err, numberOfUpdated, upsert) => {
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
        return new Promise((resolve, reject) => exports.streamsDatabase.remove(stream.toStreamEntry(), (err, n) => {
            if (err)
                reject(err);
            else
                resolve();
        }));
    },
    async updateStream(streamName, updatedStream) {
        return new Promise((resolve, reject) => exports.streamsDatabase.update({ name: streamName }, updatedStream.toStreamEntry(), { upsert: false, returnUpdatedDocs: true }, (err, numberOfUpdated, affectedDocuments, upsert) => {
            if (err)
                reject(err);
            else
                resolve(affectedDocuments);
        }));
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
