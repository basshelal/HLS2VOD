import React, {Component, ReactNode} from "react"
import {Button, DialogProps} from "@material-ui/core"
import {RequestSender} from "../../RequestSender"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import DialogActions from "@material-ui/core/DialogActions"
import Dialog from "@material-ui/core/Dialog"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"

interface SettingsDialogProps extends DialogProps {
    onSaveSettings?: () => void
}

export interface SettingsDialogState {
    offsetSeconds: number
    outputDir: string
}

export class SettingsDialog extends Component<SettingsDialogProps, SettingsDialogState> {

    constructor(props: SettingsDialogProps) {
        super(props)
        this.fetchSettings = this.fetchSettings.bind(this)
        this.browseOutputDir = this.browseOutputDir.bind(this)
        this.validateSettings = this.validateSettings.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.state = {offsetSeconds: -1, outputDir: ""}
        this.fetchSettings()
    }

    public async fetchSettings() {
        RequestSender.getAllSettings()
            .then(returned => {
                const offsetSeconds = parseInt(returned.find(it => it.key === "offsetSeconds").value)
                const outputDir = returned.find(it => it.key === "outputDirectory").value
                this.setState({offsetSeconds: offsetSeconds, outputDir: outputDir})
            })
    }

    public async browseOutputDir(): Promise<string | undefined> {
        const result: string | undefined = await RequestSender.browseOutputDir()
        if (result) this.setState({outputDir: result})
        return result
    }

    public validateSettings(): boolean {
        let isValid: boolean = false
        if (this.state.offsetSeconds >= 0 && this.state.outputDir !== "") isValid = true
        return isValid
    }

    public async onSubmit() {
        if (this.validateSettings()) {
            await sendToMain(Requests.UpdateSettings, this.state)
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
                        value={this.state.outputDir}
                        onChange={event => this.setState({outputDir: event.target.value})}
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