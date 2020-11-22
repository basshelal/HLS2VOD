import React, {Component, ReactNode} from "react"
import {Button} from "@material-ui/core"
import {AddStreamDialog, DialogStreamEntry} from "./AddStreamDialog"

export interface AddStreamButtonProps {
    onAddStream?: (streamEntry: DialogStreamEntry) => void
}

export interface AddStreamButtonState {
    isDialogOpen: boolean
}

export class AddStreamButton extends Component<AddStreamButtonProps, AddStreamButtonState> {

    constructor(props: AddStreamButtonProps) {
        super(props)
        this.showDialog = this.showDialog.bind(this)
        this.hideDialog = this.hideDialog.bind(this)
        this.onAddStream = this.onAddStream.bind(this)
        this.state = {isDialogOpen: false}
    }

    public showDialog() { this.setState({isDialogOpen: true}) }

    public hideDialog() { this.setState({isDialogOpen: false}) }

    public onAddStream(streamEntry: DialogStreamEntry) {
        if (this.props.onAddStream) this.props.onAddStream(streamEntry)
        this.hideDialog()
    }

    public render(): ReactNode {
        return (
            <div>
                <Button variant="outlined" color="primary" onClick={this.showDialog}>
                    New Stream
                </Button>
                <AddStreamDialog onAddStream={this.onAddStream} open={this.state.isDialogOpen}
                                 onClose={this.hideDialog}/>
            </div>
        )
    }
}