import * as Datastore from "nedb";

export const settingsDatabase = new Datastore({filename: "database/settings.db", autoload: true})
export const streamsDatabase = new Datastore({filename: "database/streams.db", autoload: true})