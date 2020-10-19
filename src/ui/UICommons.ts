import * as electron from "electron"

export const AppName: string = "HLS2VOD"

export function sendToMain<T>(name: string, args?: T): Promise<T> {
    return electron.ipcRenderer.invoke(name, args)
}

export function handleFromMain<T>(name: string, listener: (event: Electron.IpcRendererEvent, args: T) => void) {
    electron.ipcRenderer.on(name, listener)
}