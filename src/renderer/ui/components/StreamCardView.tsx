import React, {FC, PropsWithChildren, useState} from "react"
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Typography from "@material-ui/core/Typography"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"
import {Button} from "@material-ui/core"
import {Edit, FiberManualRecord, FolderOpen, Pause} from "@material-ui/icons"
import {SerializedStream} from "../../../main/Stream"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"

interface StreamCardViewProps {
    streamEntry: SerializedStream
}

function styles(): ClassNameMap {
    return makeStyles((theme: Theme) =>
        createStyles({
            root: {
                maxWidth: 700,
                margin: "12px"
            }
        })
    )()
}

function startStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.StartStream, stream) }

function pauseStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.PauseStream, stream) }

function forceRecordStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.ForceRecordStream, stream) }

function unForceRecordStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.UnForceRecordStream, stream) }

function viewDir(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.ViewStreamDir, stream) }

export const StreamCardView: FC<StreamCardViewProps> = (props: PropsWithChildren<StreamCardViewProps>) => {
    const classes = styles()
    const [raised, setRaised] = useState<boolean>(false)
    const streamEntry: SerializedStream = props.streamEntry

    return (
        <Card className={classes.root} raised={raised}
              onMouseOver={() => setRaised(true)} onMouseLeave={() => setRaised(false)}>
            <CardContent>
                <Typography align="center" variant="h4" title="Stream Name">{streamEntry.name}</Typography>
                <Typography align="center" variant="h6">{streamEntry.state}</Typography>
            </CardContent>
            <CardActions>
                <Button><Edit/>Edit Stream</Button>
                <Button onClick={() => startStream(streamEntry)}><Pause/>Start Recording</Button>
                <Button onClick={() => pauseStream(streamEntry)}><Pause/>Pause Recording</Button>
                <Button onClick={() => forceRecordStream(streamEntry)}><FiberManualRecord/>Force Record</Button>
                <Button onClick={() => unForceRecordStream(streamEntry)}><FiberManualRecord/>UnForce Record</Button>
                <Button onClick={() => viewDir(streamEntry)}><FolderOpen/>View Output</Button>
            </CardActions>
        </Card>
    )
}
