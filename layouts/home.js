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
window.onkeydown = (keyboardEvent) => {
    if (keyboardEvent.key === "F12")
        ipc.send("devTools");
};