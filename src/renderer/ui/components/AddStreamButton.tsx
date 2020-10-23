import React, {Component, ReactNode} from "react"
import {Button} from "@material-ui/core"
import {AddStreamDialog} from "./AddStreamDialog"

export interface AddStreamButtonState {
    isDialogOpen: boolean
}

export class AddStreamButton extends Component<{}, AddStreamButtonState> {

    constructor(props: {}) {
        super(props)
        this.showDialog = this.showDialog.bind(this)
        this.hideDialog = this.hideDialog.bind(this)
        this.state = {isDialogOpen: false}
    }

    public showDialog() { this.setState({isDialogOpen: true}) }

    public hideDialog() { this.setState({isDialogOpen: false}) }

    public render(): ReactNode {
        return (
            <div>
                <Button variant="outlined" color="primary" onClick={this.showDialog}>
                    New Stream
                </Button>
                <AddStreamDialog onAddStream={this.hideDialog} open={this.state.isDialogOpen}
                                 onClose={this.hideDialog}/>
            </div>
        )
    }
}