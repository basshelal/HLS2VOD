import React, {Component, ReactNode} from "react"
import {Button, DialogProps} from "@material-ui/core"
import {RequestSender} from "../../RequestSender"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"
import Dialog from "@material-ui/core/Dialog"
import {AllSettings} from "../../../main/Database"

interface SettingsDialogProps extends DialogProps {
    onSaveSettings?: () => void
}

export class SettingsDialog extends Component<SettingsDialogProps, AllSettings> {

    constructor(props: SettingsDialogProps) {
        super(props)
        this.fetchSettings = this.fetchSettings.bind(this)
        this.browseOutputDir = this.browseOutputDir.bind(this)
        this.validateSettings = this.validateSettings.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.state = {offsetSeconds: -1, outputDirectory: ""}
        this.fetchSettings()
    }

    public async fetchSettings(): Promise<void> {
        const allSettings = await RequestSender.getAllSettings()
        this.setState({offsetSeconds: allSettings.offsetSeconds, outputDirectory: allSettings.outputDirectory})
    }

    public async browseOutputDir(): Promise<string | undefined> {
        const result: string | undefined = await RequestSender.browseOutputDir()
        if (result) this.setState({outputDirectory: result})
        return result
    }

    public validateSettings(): boolean {
        let isValid: boolean = false
        if (this.state.offsetSeconds >= 0 && this.state.outputDirectory !== "") isValid = true
        return isValid
    }

    public async onSubmit(): Promise<void> {
        if (this.validateSettings()) {
            const allSettings = await RequestSender.updateSettings(this.state)
            this.setState(allSettings)
            if (this.props.onSaveSettings) this.props.onSaveSettings()
        }
    }

    public render(): ReactNode {
        return (
            <Dialog {...this.props}>
                <DialogTitle>Settings</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="offsetSeconds"
                        label="Offset Seconds"
                        fullWidth
                        value={this.state.offsetSeconds}
                        onChange={event => this.setState({offsetSeconds: parseInt(event.target.value)})}
                    />
                    <TextField
                        margin="dense"
                        id="outputDir"
                        label="Output Directory"
                        fullWidth
                        value={this.state.outputDirectory}
                        onChange={event => this.setState({outputDirectory: event.target.value})}
                    />
                    <Button onClick={this.browseOutputDir}>Browse Output Directory</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onSubmit} color="primary">
                        Save Settings
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}