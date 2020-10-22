import React, {Component} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"
import {sendToMain} from "../UICommons"
import {Events} from "../../../shared/Events"

export interface StreamData {
    streamName?: string
    playlistUrl?: string
    schedulePath?: string
}

const emptyStreamData: StreamData = {streamName: "", playlistUrl: "", schedulePath: ""}

export interface AddStreamButtonProps {

}

export interface AddStreamButtonState {
    isDialogOpen: boolean
    streamData: StreamData
    schedulePathText: string
}

function validateStreamData(streamData: StreamData): boolean {
    let isValid: boolean = false
    if (streamData.streamName !== "" && streamData.playlistUrl !== "") isValid = true
    return isValid
}

export class AddStreamButton extends Component<AddStreamButtonProps, AddStreamButtonState> {

    constructor(props: AddStreamButtonProps) {
        super(props)
        this.state = {
            isDialogOpen: false,
            streamData: emptyStreamData,
            schedulePathText: ""
        }
    }

    public render() {

        const handleCancelled = () => {
            this.setState({isDialogOpen: false})
        }

        const handleSubmit = async () => {
            if (validateStreamData(this.state.streamData)) {
                await sendToMain(Events.NewStream, this.state.streamData)
                this.setState({streamData: {streamName: "", playlistUrl: "", schedulePath: ""}})
            }
            this.setState({isDialogOpen: false})
        }

        return (
            <div>
                <Button variant="outlined" color="primary" onClick={() => this.setState({isDialogOpen: true})}>
                    New Stream
                </Button>
                <Dialog open={this.state.isDialogOpen} onClose={handleCancelled}>
                    <DialogTitle>New Stream</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="streamName"
                            label="Stream Name"
                            fullWidth
                            defaultValue={this.state.streamData.streamName}
                            onChange={event => this.setState({streamData: {streamName: event.target.value}})}
                        />
                        <TextField
                            margin="dense"
                            id="playlistUrl"
                            label="Playlist Url"
                            fullWidth
                            defaultValue={this.state.streamData.playlistUrl}
                            onChange={event => this.setState({streamData: {streamName: event.target.value}})}
                        />
                        <TextField
                            margin="dense"
                            id="schedulePath"
                            label="Schedule Path"
                            fullWidth
                            defaultValue={this.state.streamData.schedulePath}
                            value={this.state.schedulePathText}
                            onChange={event => {
                                this.setState({schedulePathText: event.target.value})
                                this.setState({streamData: {schedulePath: event.target.value}})
                            }}
                        />
                        <Button onClick={async () => {
                            const result: string | undefined = await sendToMain<string>(Events.BrowseSchedule)
                            if (result) {
                                this.setState({schedulePathText: result})
                                this.setState({streamData: {schedulePath: result}})
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
}