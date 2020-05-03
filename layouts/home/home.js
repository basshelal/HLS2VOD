const database = require("../../database/database");
const electron = require("electron");
function get(id) {
    return document.getElementById(id);
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
function addStream(streamEntry) {
    const rootDiv = document.importNode(displayStreamDiv, true);
    const streamNameText = rootDiv.children.namedItem("streamNameText");
    const currentShowText = rootDiv.children.namedItem("currentShowText");
    const nextShowText = rootDiv.children.namedItem("nextShowText");
    const recordingText = rootDiv.children.namedItem("recordingText");
    const recordingButton = rootDiv.children.namedItem("recordingButton");
    const outputButton = rootDiv.children.namedItem("outputButton");
    const editStreamButton = rootDiv.children.namedItem("editStreamButton");
    streamNameText.textContent = streamEntry.name;
    rootDiv.id = `stream-${streamEntry.name}`;
    allStreamsDiv.append(rootDiv);
}
electron.ipcRenderer.on("displayStreams", (event, args) => {
    const streams = args;
    streams.forEach(streamEntry => addStream(streamEntry));
});
electron.ipcRenderer.on("displaySettings", (event, args) => {
    const settings = args;
    const offsetSeconds = settings.get("offsetSeconds");
    const outputDirectory = settings.get("outputDirectory");
    offsetSecondsInput.value = offsetSeconds;
    outputDirectoryTextArea.value = outputDirectory;
    M.updateTextFields();
});
confirmAddStreamButton.onclick = () => {
    const streamEntry = {
        name: streamNameTextArea.value,
        playlistUrl: playListURLTextArea.value,
        schedulePath: importScheduleFileInput.name
        // TODO the full path will never work! We have to read the schedule here and send it back
    };
    console.log(streamEntry);
    electron.ipcRenderer.invoke("addStream", streamEntry).then(() => addStream(streamEntry));
    addNewStreamModal.close();
};
saveSettingsButton.onclick = () => {
    const settings = new Map();
    settings.set("offsetSeconds", offsetSecondsInput.value);
    settings.set("outputDirectory", outputDirectoryTextArea.value);
    electron.ipcRenderer.invoke("saveSettings", settings);
    settingsModal.close();
};
