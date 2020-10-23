import React, {FC, useState} from "react"
import {Button} from "@material-ui/core"
import Dialog from "@material-ui/core/Dialog"
import DialogTitle from "@material-ui/core/DialogTitle"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import DialogActions from "@material-ui/core/DialogActions"
import {SettingsEntry} from "../../../main/Database"
import {RequestSender} from "../../RequestSender"

export interface SettingsData {
    offsetSeconds: number
    outputDir: string
}

const emptySettingsData: SettingsData = {offsetSeconds: 0, outputDir: ""}

function validateSettings(settingsData: SettingsData): boolean {
    let isValid: boolean = false
    if (settingsData.offsetSeconds >= 0 && settingsData.outputDir !== "") isValid = true
    return isValid
}

export const SettingsButton: FC = (props) => {

    const [open, setOpen] = useState(false)
    const [settingsData, setData] = useState<SettingsData>(emptySettingsData)
    const [outputDirText, setOutputDirText] = useState<string>("")

    const changeData = (changedData: { offsetSeconds?: number, outputDir?: string }) => {
        setData((prevState: SettingsData) => {
            const result: SettingsData = prevState
            if (changedData.offsetSeconds) result.offsetSeconds = changedData.offsetSeconds
            if (changedData.outputDir) result.outputDir = changedData.outputDir
            return result
        })
    }

    const handleCancelled = () => {
        setOpen(false)
    }

    const handleSubmit = async () => {
        if (validateSettings(settingsData)) {
            await sendToMain(Requests.UpdateSettings, settingsData)
            setData(settingsData)
        }
        setOpen(false)
    }

    sendToMain<Array<SettingsEntry>>(Requests.GetSettings)
        .then(returned => {
            const offsetSeconds = parseInt(returned.find(it => it.key === "offsetSeconds").value)
            const outputDir = returned.find(it => it.key === "outputDirectory").value
            changeData({offsetSeconds: offsetSeconds, outputDir: outputDir})
            setOutputDirText(outputDir)
        })

    return (
        <div>
            <Button variant="outlined" color="primary" onClick={() => {setOpen(true)}}>
                Settings
            </Button>
            <Dialog open={open} onClose={handleCancelled}>
                <DialogTitle>Settings</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="offsetSeconds"
                        label="Offset Seconds"
                        fullWidth
                        defaultValue={settingsData.offsetSeconds}
                        onChange={event => changeData({offsetSeconds: parseInt(event.target.value)})}
                    />
                    <TextField
                        margin="dense"
                        id="outputDir"
                        label="Output Directory"
                        fullWidth
                        value={outputDirText}
                        onChange={event => {
                            setOutputDirText(event.target.value)
                            changeData({outputDir: event.target.value})
                        }}
                    />
                    <Button onClick={async () => {
                        const result: string | undefined = await RequestSender.browseOutputDir()
                        if (result) {
                            setOutputDirText(result)
                            changeData({outputDir: result})
                        }
                    }}>Browse Output Directory</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSubmit} color="primary">
                        Save Settings
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}