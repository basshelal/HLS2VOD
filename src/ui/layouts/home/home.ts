// @ts-ignore
const database = require("../../../Database")
const electron = require("electron")

interface StreamEntry {
    name: string,
    playlistUrl: string,
    schedulePath: string,
}

function get<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T
}

function sendToMain<T>(name: string, args?: T): Promise<T> {
    return electron.ipcRenderer.invoke(name, args)
}

function handle<T>(name: string, listener: (event: Electron.IpcRendererEvent, args: T) => void) {
    electron.ipcRenderer.on(name, listener)
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

M.Tooltip.init(document.querySelectorAll(".tooltipped"), {inDuration: 500, outDuration: 500})
M.Modal.init(document.querySelectorAll(".modal"), {dismissible: true, inDuration: 500, outDuration: 500})

const addNewStreamModal = M.Modal.getInstance(get("addNewStreamModal"))
const settingsModal = M.Modal.getInstance(get("settingsModal"))

function displayStream(streamEntry: StreamEntry) {
    const rootDiv: HTMLDivElement = document.importNode(displayStreamDiv, true)
    const streamNameText = rootDiv.querySelector<HTMLParagraphElement>("#streamNameText")
    const currentShowText = rootDiv.querySelector<HTMLParagraphElement>("#currentShowText")
    const recordingText = rootDiv.querySelector<HTMLParagraphElement>("#recordingText")
    const nextShowText = rootDiv.querySelector<HTMLParagraphElement>("#nextShowText")
    const outputButton = rootDiv.querySelector<HTMLButtonElement>("#outputButton")
    const recordingButton = rootDiv.querySelector<HTMLButtonElement>("#recordingButton")
    const editStreamButton = rootDiv.querySelector<HTMLButtonElement>("#editStreamButton")
    const streamInfoText = rootDiv.querySelector<HTMLParagraphElement>("#streamInfoText")

    streamNameText.textContent = streamEntry.name
    rootDiv.id = `stream-${streamEntry.name}`

    outputButton.onclick = () => sendToMain("outputButtonClicked", streamEntry)
    recordingButton.onclick = () => sendToMain("recordingButtonClicked", streamEntry)

    recordingText.textContent = "Not recording yet"
    recordingButton.textContent = "Start Recording"

    allStreamsDiv.append(rootDiv)
}

function getStreamDiv(streamName: string): HTMLDivElement | null {
    return get<HTMLDivElement>(`stream-${streamName}`)
}

handle<Array<StreamEntry>>("displayStreams", (event, streams) => {
    streams.forEach(streamEntry => displayStream(streamEntry))
})

handle<Map<string, string>>("displaySettings", (event, settings) => {
    const offsetSeconds = settings.get("offsetSeconds")
    const outputDirectory = settings.get("outputDirectory")
    offsetSecondsInput.value = offsetSeconds
    outputDirectoryTextArea.value = outputDirectory
    M.updateTextFields()
})

handle<StreamEntry>("streamNewCurrentShow", (event, streamEntry) => {
    const currentShow = streamEntry["currentShow"]
    const nextShow = streamEntry["nextShow"]

    const streamDiv: HTMLDivElement = getStreamDiv(streamEntry.name)
    const currentShowText = streamDiv.querySelector<HTMLParagraphElement>("#currentShowText")
    const nextShowText = streamDiv.querySelector<HTMLParagraphElement>("#nextShowText")

    currentShowText.textContent = `Current Show: ${currentShow.name}`
    nextShowText.textContent = `Next Show: ${nextShow.name}`
})

function changeRecordingState(streamName: string, textContent: string, isRecording: boolean) {
    const streamDiv: HTMLDivElement = getStreamDiv(streamName)
    const recordingText = streamDiv.querySelector<HTMLParagraphElement>("#recordingText")
    const recordingButton = streamDiv.querySelector<HTMLButtonElement>("#recordingButton")
    recordingText.textContent = textContent
    if (isRecording) recordingButton.textContent = "Stop Recording"
    else recordingButton.textContent = "Start Recording"
}

handle<StreamEntry>("streamStarted", (event, streamEntry) =>
    changeRecordingState(streamEntry.name, "Recording...", true))

handle<StreamEntry>("streamStopped", (event, streamEntry) =>
    changeRecordingState(streamEntry.name, "Stopped", false))

confirmAddStreamButton.onclick = () => {
    const streamEntry: StreamEntry = {
        name: streamNameTextArea.value,
        playlistUrl: playListURLTextArea.value,
        schedulePath: importScheduleFileInput.name
        // TODO the full path will never work! We have to read the schedule here and send it back
    }
    sendToMain("addStream", streamEntry)
        .then((s: StreamEntry) => displayStream(s))
    addNewStreamModal.close()
}

saveSettingsButton.onclick = () => {
    const settings = new Map<string, string>()
    settings.set("offsetSeconds", offsetSecondsInput.value)
    settings.set("outputDirectory", outputDirectoryTextArea.value)
    sendToMain("saveSettings", settings)
    settingsModal.close()
}