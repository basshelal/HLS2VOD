import React, {FC, useState} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"

export interface AddStreamButtonProps {
    onFinish: (string: string) => void
}

export const AddStreamButton: FC<AddStreamButtonProps> = (props) => {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")

    const handleClose = () => {
        setOpen(false)
        props.onFinish(text)
        setText("")
    }

    return (
        <div>
            <Button variant="outlined" color="primary" onClick={() => {setOpen(true)}}>
                Open form dialog
            </Button>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To subscribe to this website, please enter your email address here. We will send updates
                        occasionally.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Email Address"
                        type="email"
                        fullWidth
                        onChange={(event) => setText(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Subscribe
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}