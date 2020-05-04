const database = require("../../database/database");
const electron = require("electron");
function get(id) {
    return document.getElementById(id);
}
function sendToMain(name, args) {
    return electron.ipcRenderer.invoke(name, args);
}
function handle(name, listener) {
    electron.ipcRenderer.on(name, listener);
}
const settingsButton = get("settingsButton");
const offsetSecondsInput = get("offsetSecondsInput");
const outputDirectoryTextArea = get("outputDirectoryTextArea");
const saveSettingsButton = get("saveSettingsButton");
const displayStreamTemplate = get("displayStreamTemplate");
const displayStreamDiv = displayStreamTemplate.content.querySelector("div");
const allStreamsDiv = get("allStreamsDiv");
const addStreamButton = get("addStreamButton");
const streamNameTextArea = get("streamNameTextArea");
const playListURLTextArea = get("playListURLTextArea");
const importScheduleFileInput = get("importScheduleFileInput");
const confirmAddStreamButton = get("confirmAddStreamButton");
M.Tooltip.init(document.querySelectorAll('.tooltipped'), { inDuration: 500, outDuration: 500 });
M.Modal.init(document.querySelectorAll('.modal'), { dismissible: true, inDuration: 500, outDuration: 500 });
const addNewStreamModal = M.Modal.getInstance(get("addNewStreamModal"));
const settingsModal = M.Modal.getInstance(get("settingsModal"));
function displayStream(streamEntry) {
    const rootDiv = document.importNode(displayStreamDiv, true);
    const streamNameText = rootDiv.querySelector("#streamNameText");
    const currentShowText = rootDiv.querySelector("#currentShowText");
    const recordingText = rootDiv.querySelector("#recordingText");
    const nextShowText = rootDiv.querySelector("#nextShowText");
    const outputButton = rootDiv.querySelector("#outputButton");
    const recordingButton = rootDiv.querySelector("#recordingButton");
    const editStreamButton = rootDiv.querySelector("#editStreamButton");
    const streamInfoText = rootDiv.querySelector("#streamInfoText");
    streamNameText.textContent = streamEntry.name;
    rootDiv.id = `stream-${streamEntry.name}`;
    outputButton.onclick = () => sendToMain("outputButtonClicked", streamEntry);
    recordingButton.onclick = () => sendToMain("recordingButtonClicked", streamEntry);
    recordingText.textContent = "Not recording yet";
    recordingButton.textContent = "Start Recording";
    allStreamsDiv.append(rootDiv);
}
function getStreamDiv(streamName) {
    return get(`stream-${streamName}`);
}
handle("displayStreams", (event, streams) => {
    streams.forEach(streamEntry => displayStream(streamEntry));
});
handle("displaySettings", (event, settings) => {
    const offsetSeconds = settings.get("offsetSeconds");
    const outputDirectory = settings.get("outputDirectory");
    offsetSecondsInput.value = offsetSeconds;
    outputDirectoryTextArea.value = outputDirectory;
    M.updateTextFields();
});
handle("streamNewCurrentShow", (event, streamEntry) => {
    const currentShow = streamEntry["currentShow"];
    const nextShow = streamEntry["nextShow"];
    const streamDiv = getStreamDiv(streamEntry.name);
    const currentShowText = streamDiv.querySelector("#currentShowText");
    const nextShowText = streamDiv.querySelector("#nextShowText");
    currentShowText.textContent = `Current Show: ${currentShow.name}`;
    nextShowText.textContent = `Next Show: ${nextShow.name}`;
});
function changeRecordingState(streamName, textContent, isRecording) {
    const streamDiv = getStreamDiv(streamName);
    const recordingText = streamDiv.querySelector("#recordingText");
    const recordingButton = streamDiv.querySelector("#recordingButton");
    recordingText.textContent = textContent;
    if (isRecording)
        recordingButton.textContent = "Stop Recording";
    else
        recordingButton.textContent = "Start Recording";
}
handle("streamStarted", (event, streamEntry) => changeRecordingState(streamEntry.name, "Recording...", true));
handle("streamStopped", (event, streamEntry) => changeRecordingState(streamEntry.name, "Stopped", false));
confirmAddStreamButton.onclick = () => {
    const streamEntry = {
        name: streamNameTextArea.value,
        playlistUrl: playListURLTextArea.value,
        schedulePath: importScheduleFileInput.name
        // TODO the full path will never work! We have to read the schedule here and send it back
    };
    sendToMain("addStream", streamEntry)
        .then((s) => displayStream(s));
    addNewStreamModal.close();
};
saveSettingsButton.onclick = () => {
    const settings = new Map();
    settings.set("offsetSeconds", offsetSecondsInput.value);
    settings.set("outputDirectory", outputDirectoryTextArea.value);
    sendToMain("saveSettings", settings);
    settingsModal.close();
};
