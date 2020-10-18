import React, {FC, useState} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"

interface NewStreamForm {
    streamName: string
    playlistUrl: string
    schedulePath: string
}

const emptyStreamForm: NewStreamForm = {streamName: "", playlistUrl: "", schedulePath: ""}

export interface AddStreamButtonProps {
    onFinish: (streamForm: NewStreamForm) => void
}

export const AddStreamButton: FC<AddStreamButtonProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [formData, setData] = useState<NewStreamForm>(emptyStreamForm)

    const changeData = (changedStreamForm: { streamName?: string, playlistUrl?: string, schedulePath?: string }) => {
        setData((prevState: NewStreamForm) => {
            const result: NewStreamForm = prevState
            if (changedStreamForm.streamName) result.streamName = changedStreamForm.streamName
            if (changedStreamForm.playlistUrl) result.playlistUrl = changedStreamForm.playlistUrl
            if (changedStreamForm.schedulePath) result.schedulePath = changedStreamForm.schedulePath
            return result
        })
    }

    const handleCancelled = () => {
        setOpen(false)
    }

    const handleClose = () => {
        setOpen(false)
        // TODO: Validate!
        props.onFinish(formData)
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
                        onChange={event => changeData({streamName: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="playlistUrl"
                        label="Playlist Url"
                        fullWidth
                        onChange={event => changeData({playlistUrl: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="schedulePath"
                        label="Schedule Path"
                        fullWidth
                        onChange={event => changeData({schedulePath: event.target.value})}
                    />
                    <Button>Browse Schedule</Button>
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