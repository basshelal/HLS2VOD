const database = require("../../database/database");
const ipc = require("electron").ipcRenderer;
document.getElementById("alJazeera").onclick = () => {
    ipc.send('invokeAction', 'alJazeera');
};
document.getElementById("alHiwar").onclick = () => {
    ipc.send('invokeAction', 'alHiwar');
};
document.getElementById("alAraby").onclick = () => {
    ipc.send('invokeAction', 'alAraby');
};
document.getElementById("addStreamButton").onclick = () => {
    ipc.send("buttonClick", "addStream");
};
ipc.on("message", (event, args) => {
    console.log(args);
});
database.Streams.getAllStreams().then(console.log);
