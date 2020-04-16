"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("nedb");
exports.streamsDatabase = new Datastore({ filename: "database/streams.db", autoload: true });
