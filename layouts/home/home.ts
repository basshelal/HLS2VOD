const database = require("../../database/database");
const ipc = require("electron").ipcRenderer;

(document.getElementById("alJazeera") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alJazeera')
}
(document.getElementById("alHiwar") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alHiwar')
}
(document.getElementById("alAraby") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alAraby')
}
(document.getElementById("addStreamButton") as HTMLButtonElement).onclick = () => {
    ipc.send("buttonClick", "addStream")
}

ipc.on("message", (event, args) => {
    console.log(args)
})

database.Streams.getAllStreams().then(console.log)