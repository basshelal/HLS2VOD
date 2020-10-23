import React, {Component} from "react"
import {Button} from "@material-ui/core"
import {SettingsDialog} from "./SettingsDialog"

export interface SettingsData {
    offsetSeconds: number
    outputDir: string
}

interface SettingsButtonState {
    isDialogOpen: boolean
}

export class SettingsButton extends Component<{}, SettingsButtonState> {

    constructor(props: {}) {
        super(props)
        this.showDialog = this.showDialog.bind(this)
        this.hideDialog = this.hideDialog.bind(this)
        this.state = {isDialogOpen: false}
    }

    public showDialog() { this.setState({isDialogOpen: true}) }

    public hideDialog() { this.setState({isDialogOpen: false}) }

    public render() {
        return (
            <div>
                <Button variant="outlined" color="primary" onClick={this.showDialog}>
                    Settings
                </Button>
                <SettingsDialog onSaveSettings={this.hideDialog} open={this.state.isDialogOpen}
                                onClose={this.hideDialog}/>
            </div>
        )
    }
}