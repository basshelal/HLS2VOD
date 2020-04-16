"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("nedb");
exports.settingsDatabase = new Datastore({ filename: "database/settings.db", autoload: true });
exports.streamsDatabase = new Datastore({ filename: "database/streams.db", autoload: true });
