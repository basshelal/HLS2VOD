import axios from "axios"
import {createWriteStream} from "fs"
import {ReadableStream, WritableStream} from "../utils/Utils"

export async function get(url: string): Promise<string> {
    return (await axios.get(url, {responseType: "text"})).data
}

export async function download(url: string, filePath: string): Promise<void> {
    const stream: WritableStream = ((await axios(url, {responseType: "stream"}))
        .data as ReadableStream).pipe(createWriteStream(filePath))
    return new Promise((resolve, reject) => {
        stream.on("finish", resolve)
        stream.on("error", reject)
    })
}
