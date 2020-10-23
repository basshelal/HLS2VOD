import React, {Component, ReactNode} from "react"
import {Button, Dialog, DialogProps} from "@material-ui/core"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import DialogActions from "@material-ui/core/DialogActions"

interface AddStreamDialogProps extends DialogProps {
    onAddStream?: (streamEntry: DialogStreamEntry) => void
}

export interface DialogStreamEntry {
    streamName: string
    playlistUrl: string
    schedulePath: string
}

export class AddStreamDialog extends Component<AddStreamDialogProps, DialogStreamEntry> {

    constructor(props: AddStreamDialogProps) {
        super(props)
        this.browseSchedule = this.browseSchedule.bind(this)
        this.validateStreamEntry = this.validateStreamEntry.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.state = {streamName: "", playlistUrl: "", schedulePath: ""}
    }

    public async browseSchedule(): Promise<string | undefined> {
        const result: string | undefined = await sendToMain<string>(Requests.BrowseSchedule)
        if (result) this.setState({schedulePath: result})
        return result
    }

    public validateStreamEntry(): boolean {
        let isValid: boolean = false
        if (this.state.streamName !== "" && this.state.playlistUrl !== "") isValid = true
        return isValid
    }

    public async onSubmit() {
        if (this.validateStreamEntry()) {
            await sendToMain(Requests.NewStream, this.state)
            if (this.props.onAddStream) this.props.onAddStream(this.state)
            this.setState({})
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
                        value={this.state.streamName}
                        onChange={event => this.setState({streamName: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="playlistUrl"
                        label="Playlist Url"
                        fullWidth
                        value={this.state.playlistUrl}
                        onChange={event => this.setState({playlistUrl: event.target.value})}
                    />
                    <TextField
                        margin="dense"
                        id="schedulePath"
                        label="Schedule Path"
                        fullWidth
                        value={this.state.schedulePath}
                        onChange={event => this.setState({schedulePath: event.target.value})}
                    />
                    <Button onClick={this.browseSchedule}>Browse Schedule</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onSubmit} color="primary">Add Stream</Button>
                </DialogActions>
            </Dialog>
        )
    }

}