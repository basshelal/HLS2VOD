import React, {Component, ReactNode} from "react"
import {Button, Dialog, DialogProps} from "@material-ui/core"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"
import {RequestSender} from "../../RequestSender"

interface AddStreamDialogProps extends DialogProps {
    onAddStream?: (streamEntry: DialogStreamEntry) => void
}

export interface DialogStreamEntry {
    name: string
    url: string
}

export class AddStreamDialog extends Component<AddStreamDialogProps, DialogStreamEntry> {

    constructor(props: AddStreamDialogProps) {
        super(props)
        this.validateStreamEntry = this.validateStreamEntry.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.state = {name: "", url: ""}
    }

    public validateStreamEntry(): boolean {
        let isValid: boolean = false
        if (this.state.name !== "" && this.state.url !== "") isValid = true
        return isValid
    }

    public async onSubmit(): Promise<void> {
        if (this.validateStreamEntry()) {
            if (await RequestSender.newStream(this.state)) {
                if (this.props.onAddStream) this.props.onAddStream(this.state)
                this.setState({})
            }
        }
    }

    public render(): ReactNode {
        return (
            <Dialog {...this.props}>
                <DialogTitle>New Stream</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="streamName"
                        label="Stream Name"
                        fullWidth
                        value={this.state.name}
                        onChange={event => this.setState({name: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="playlistUrl"
                        label="Playlist Url"
                        fullWidth
                        value={this.state.url}
                        onChange={event => this.setState({url: event.target.value})}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onSubmit} color="primary">Add Stream</Button>
                </DialogActions>
            </Dialog>
        )
    }

}