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

const settingsButton = get<HTMLButtonElement>("settingsButton")
const offsetSecondsInput = get<HTMLInputElement>("offsetSecondsInput")
const outputDirectoryTextArea = get<HTMLTextAreaElement>("outputDirectoryTextArea")
const saveSettingsButton = get<HTMLButtonElement>("saveSettingsButton")
const displayStreamTemplate = get<HTMLTemplateElement>("displayStreamTemplate")
const displayStreamDiv = displayStreamTemplate.content.querySelector("div") as HTMLDivElement
const allStreamsDiv = get<HTMLDivElement>("allStreamsDiv")
const addStreamButton = get<HTMLButtonElement>("addStreamButton")
const streamNameTextArea = get<HTMLTextAreaElement>("streamNameTextArea")
const playListURLTextArea = get<HTMLTextAreaElement>("playListURLTextArea")
const importScheduleFileInput = get<HTMLInputElement>("importScheduleFileInput")
const confirmAddStreamButton = get<HTMLButtonElement>("confirmAddStreamButton")

M.Tooltip.init(document.querySelectorAll('.tooltipped'), {inDuration: 500, outDuration: 500})
M.Modal.init(document.querySelectorAll('.modal'), {dismissible: true, inDuration: 500, outDuration: 500})

const addNewStreamModal = M.Modal.getInstance(get("addNewStreamModal"))
const settingsModal = M.Modal.getInstance(get("settingsModal"))

function addStream(streamEntry) {
    const rootDiv = document.importNode(displayStreamDiv, true)
    const streamNameText = rootDiv.querySelector("#streamNameText")
    const currentShowText = rootDiv.querySelector("#currentShowText")
    const recordingText = rootDiv.querySelector("#recordingText")
    const nextShowText = rootDiv.querySelector("#nextShowText")
    const outputButton = rootDiv.querySelector("#outputButton") as HTMLButtonElement
    const recordingButton = rootDiv.querySelector("#recordingButton") as HTMLButtonElement
    const editStreamButton = rootDiv.querySelector("#editStreamButton") as HTMLButtonElement

    streamNameText.textContent = streamEntry.name
    rootDiv.id = `stream-${streamEntry.name}`

    outputButton.onclick = () => electron.ipcRenderer.invoke("outputButtonClicked", streamEntry)
    recordingButton.onclick = () => electron.ipcRenderer.invoke("recordingButtonClicked", streamEntry)

    allStreamsDiv.append(rootDiv)
}

electron.ipcRenderer.on("displayStreams", (event, args) => {
    const streams = args as Array<StreamEntry>
    streams.forEach(streamEntry => addStream(streamEntry))
})

electron.ipcRenderer.on("displaySettings", (event, args) => {
    const settings = args as Map<string, string>
    const offsetSeconds = settings.get("offsetSeconds")
    const outputDirectory = settings.get("outputDirectory")
    offsetSecondsInput.value = offsetSeconds
    outputDirectoryTextArea.value = outputDirectory
    M.updateTextFields()
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
    addNewStreamModal.close()
}

saveSettingsButton.onclick = () => {
    const settings = new Map<string, string>()
    settings.set("offsetSeconds", offsetSecondsInput.value)
    settings.set("outputDirectory", outputDirectoryTextArea.value)
    electron.ipcRenderer.invoke("saveSettings", settings)
    settingsModal.close()
}