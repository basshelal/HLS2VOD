const ipc = require("electron").ipcRenderer;

(document.getElementById("alJazeera") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alJazeera');
};
(document.getElementById("alHiwar") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alHiwar');
};
(document.getElementById("alAraby") as HTMLButtonElement).onclick = () => {
    ipc.send('invokeAction', 'alAraby');
};