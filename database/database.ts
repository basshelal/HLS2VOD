import * as Datastore from "nedb";

export const streamsDatabase = new Datastore({filename: "database/streams.db", autoload: true})