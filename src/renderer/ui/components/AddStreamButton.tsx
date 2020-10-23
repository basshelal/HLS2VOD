import React, {Component, ReactNode} from "react"
import {Button} from "@material-ui/core"
import {AddStreamDialog} from "./AddStreamDialog"

export interface AddStreamButtonProps {

}

export interface AddStreamButtonState {
    isDialogOpen: boolean
}

export class AddStreamButton extends Component<AddStreamButtonProps, AddStreamButtonState> {

    constructor(props: AddStreamButtonProps) {
        super(props)
        this.state = {isDialogOpen: false}
    }

    public showDialog() { this.setState({isDialogOpen: true}) }

    public hideDialog() { this.setState({isDialogOpen: false}) }

    public render(): ReactNode {
        return (
            <div>
                <Button variant="outlined" color="primary" onClick={() => this.showDialog()}>
                    New Stream
                </Button>
                <AddStreamDialog open={this.state.isDialogOpen} onClose={() => this.hideDialog()}/>
            </div>
        )
    }
}