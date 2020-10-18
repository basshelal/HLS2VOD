import React, {FC, useState} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"

interface StreamData {
    streamName: string
    playlistUrl: string
    schedulePath: string
}

const emptyStreamData: StreamData = {streamName: "", playlistUrl: "", schedulePath: ""}

export interface AddStreamButtonProps {
    onFinish: (streamData: StreamData) => void
}

function validateStreamData(streamData: StreamData): boolean {
    return true // TODO: implement
}

export const AddStreamButton: FC<AddStreamButtonProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [streamData, setData] = useState<StreamData>(emptyStreamData)

    const changeData = (changedData: { streamName?: string, playlistUrl?: string, schedulePath?: string }) => {
        setData((prevState: StreamData) => {
            const result: StreamData = prevState
            if (changedData.streamName) result.streamName = changedData.streamName
            if (changedData.playlistUrl) result.playlistUrl = changedData.playlistUrl
            if (changedData.schedulePath) result.schedulePath = changedData.schedulePath
            return result
        })
    }

    const handleCancelled = () => {
        setOpen(false)
    }

    const handleClose = () => {
        setOpen(false)
        // TODO: Validate!
        if (validateStreamData(streamData))
            props.onFinish(streamData)
    }

    return (
        <div>
            <Button variant="outlined" color="primary" onClick={() => {setOpen(true)}}>
                New Stream
            </Button>
            <Dialog open={open} onClose={handleCancelled}>
                <DialogTitle>New Stream</DialogTitle>
                <DialogContent>
                    <DialogContentText>Add a new stream</DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="streamName"
                        label="Stream Name"
                        fullWidth
                        defaultValue={streamData.streamName}
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
                        onChange={event => changeData({schedulePath: event.target.value})}
                    />
                    <Button>Browse Schedule</Button>
                    {/* TODO Electron directory picker here, using React web one isn't good */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Add Stream
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}