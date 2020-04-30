const database = require("../../database/database");
const electron = require("electron");

interface StreamEntry {
    name: string,
    playlistUrl: string,
    schedulePath: string,
}

function get<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T
}

const addStreamButton = get<HTMLButtonElement>("addStreamButton")
const displayStreamTemplate = get<HTMLTemplateElement>("displayStreamTemplate")
const displayStreamDiv = displayStreamTemplate.content.querySelector("div") as HTMLDivElement
const allStreamsDiv = get<HTMLDivElement>("allStreamsDiv")
const streamNameTextArea = get<HTMLTextAreaElement>("streamNameTextArea")
const playListURLTextArea = get<HTMLTextAreaElement>("playListURLTextArea")
const importScheduleFileInput = get<HTMLInputElement>("importScheduleFileInput")
const confirmAddStreamButton = get<HTMLButtonElement>("confirmAddStreamButton")

M.Tooltip.init(document.querySelectorAll('.tooltipped'), {inDuration: 500, outDuration: 500})
M.Modal.init(document.querySelectorAll('.modal'), {dismissible: true, inDuration: 500, outDuration: 500})

const modal = M.Modal.getInstance(get("modal"))

function addStream(streamEntry) {
    const rootDiv = document.importNode(displayStreamDiv, true)
    const streamNameText = rootDiv.children.namedItem("streamNameText")
    const currentShowText = rootDiv.children.namedItem("currentShowText")
    const nextShowText = rootDiv.children.namedItem("nextShowText")
    const recordingText = rootDiv.children.namedItem("recordingText")
    const recordingButton = rootDiv.children.namedItem("recordingButton")
    const outputButton = rootDiv.children.namedItem("outputButton")
    const editStreamButton = rootDiv.children.namedItem("editStreamButton")

    streamNameText.textContent = streamEntry.name
    rootDiv.id = `stream-${streamEntry.name}`

    allStreamsDiv.append(rootDiv)
}

electron.ipcRenderer.on("displayStreams", (event, args) => {
    const streams = args as Array<StreamEntry>
    streams.forEach(streamEntry => addStream(streamEntry))
})

confirmAddStreamButton.onclick = () => {
    const streamEntry = {
        name: streamNameTextArea.value,
        playlistUrl: playListURLTextArea.value,
        schedulePath: importScheduleFileInput.name
        // TODO the full path will never work! We have to read the schedule here and send it back
    }
    console.log(streamEntry)
    electron.ipcRenderer.invoke("addStream", streamEntry).then(() => addStream(streamEntry))
    modal.close()
}