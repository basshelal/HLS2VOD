// Web request testing stuff
import {BrowserWindow, session} from "electron"
import {logD} from "../../shared/Log"

function testWebRequest() {
    let masterPlaylist: string
    session.defaultSession.webRequest.onBeforeRequest({
        urls: ["http://*/*.m3u8", "https://*/*.m3u8", "http://*/*.m3u8?*", "https://*/*.m3u8?*"]
    }, (details, callback) => {
        if (!masterPlaylist) masterPlaylist = details.url
        logD(masterPlaylist)
        // detach listener now
        session.defaultSession.webRequest.onBeforeRequest(null)
        // The very first .m3u8 request will be the master playlist, we can remove the webRequest listener after that
        // callback({}) // We don't need this because we only need to run once!
    })

    // Must have autoplay, though most do
    const streamUrl = "https://www.aljazeera.com/live/"
    // Using an invisible window will simulate a visit
    const invisibleWindow = new BrowserWindow({
        show: false, width: 0, height: 0
    })
    invisibleWindow.loadURL(streamUrl)
    invisibleWindow.webContents.setAudioMuted(true)
}