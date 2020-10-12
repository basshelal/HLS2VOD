import axios from "axios"
import {createWriteStream} from "fs"

export async function get(url: string): Promise<string> {
    return (await axios.get(url, {responseType: "text"})).data
}

export async function download(url: string, filePath: string): Promise<void> {
    const stream = (await axios(url, {responseType: "stream"}))
        .data.pipe(createWriteStream(filePath))
    return new Promise((resolve, reject) => {
        stream.on("finish", resolve)
        stream.on("error", reject)
    })
}
