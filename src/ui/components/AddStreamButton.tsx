import React, {FC, useState} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"
import {sendToMain} from "../UICommons"
import {Events} from "../../Events"

export interface StreamData {
    name: string
    playlistUrl: string
    schedulePath: string
}

const emptyStreamData: StreamData = {name: "", playlistUrl: "", schedulePath: ""}

export interface AddStreamButtonProps {

}

function validateStreamData(streamData: StreamData): boolean {
    let isValid: boolean = false
    if (streamData.name !== "" && streamData.playlistUrl !== "") isValid = true
    return isValid
}

export const AddStreamButton: FC<AddStreamButtonProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [streamData, setData] = useState<StreamData>(emptyStreamData)
    const [schedulePathText, setSchedulePathText] = useState<string>("")

    const changeData = (changedData: { streamName?: string, playlistUrl?: string, schedulePath?: string }) => {
        setData((prevState: StreamData) => {
            const result: StreamData = prevState
            if (changedData.streamName) result.name = changedData.streamName
            if (changedData.playlistUrl) result.playlistUrl = changedData.playlistUrl
            if (changedData.schedulePath) result.schedulePath = changedData.schedulePath
            return result
        })
    }

    const handleCancelled = () => {
        setOpen(false)
    }

    const handleSubmit = async () => {
        if (validateStreamData(streamData)) {
            await sendToMain(Events.NewStream, streamData)
            setData({name: "", playlistUrl: "", schedulePath: ""})
        }
        setOpen(false)
    }

    return (
        <div>
            <Button variant="outlined" color="primary" onClick={() => {setOpen(true)}}>
                New Stream
            </Button>
            <Dialog open={open} onClose={handleCancelled}>
                <DialogTitle>New Stream</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="streamName"
                        label="Stream Name"
                        fullWidth
                        defaultValue={streamData.name}
                        onChange={event => changeData({streamName: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="playlistUrl"
                        label="Playlist Url"
                        fullWidth
                        defaultValue={streamData.playlistUrl}
                        onChange={event => changeData({playlistUrl: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="schedulePath"
                        label="Schedule Path"
                        fullWidth
                        defaultValue={streamData.schedulePath}
                        value={schedulePathText}
                        onChange={event => {
                            setSchedulePathText(event.target.value)
                            changeData({schedulePath: event.target.value})
                        }}
                    />
                    <Button onClick={async () => {
                        const result: string | undefined = await sendToMain<string>(Events.BrowseSchedule)
                        if (result) {
                            setSchedulePathText(result)
                            changeData({schedulePath: result})
                        }
                    }}>Browse Schedule</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSubmit} color="primary">
                        Add Stream
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}