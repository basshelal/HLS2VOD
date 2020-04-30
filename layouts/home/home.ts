const database = require("../../database/database");
const electron = require("electron");

const addStreamButton = document.getElementById("addStreamButton") as HTMLButtonElement
const displayStreamTemplate = document.getElementById("displayStreamTemplate") as HTMLTemplateElement
const displayStreamDiv = displayStreamTemplate.content.querySelector("div") as HTMLDivElement
const allStreamsDiv = document.getElementById("allStreamsDiv") as HTMLDivElement

M.Tooltip.init(document.querySelectorAll('.tooltipped'), {inDuration: 500, outDuration: 500})
M.Modal.init(document.querySelectorAll('.modal'), {dismissible: true, inDuration: 500, outDuration: 500})

database.Streams.getAllStreams().then(streams =>
    streams.forEach(streamEntry => {
            const rootDiv = document.importNode(displayStreamDiv, true)
            const streamNameText = rootDiv.children.namedItem("streamNameText")
            const currentShowText = rootDiv.children.namedItem("currentShowText")
            const nextShowText = rootDiv.children.namedItem("nextShowText")
            const recordingText = rootDiv.children.namedItem("recordingText")
            const recordingButton = rootDiv.children.namedItem("recordingButton")
            const outputButton = rootDiv.children.namedItem("outputButton")
            const editStreamButton = rootDiv.children.namedItem("editStreamButton")

            streamNameText.textContent = streamEntry.name

            allStreamsDiv.append(rootDiv)
    })
)


