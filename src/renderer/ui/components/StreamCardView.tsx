import React, {Component, ReactNode} from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Typography from "@material-ui/core/Typography"
import {Button} from "@material-ui/core"
import {Edit, FiberManualRecord, FolderOpen, Pause} from "@material-ui/icons"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import {SerializedStream} from "../../../shared/Serialized"

function startStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.StartStream, stream) }

function pauseStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.PauseStream, stream) }

function forceRecordStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.ForceRecordStream, stream) }

function unForceRecordStream(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.UnForceRecordStream, stream) }

function viewDir(stream: SerializedStream): Promise<SerializedStream> { return sendToMain(Requests.ViewStreamDir, stream) }

interface StreamCardViewProps {
    serializedStream: SerializedStream
}

interface StreamCardViewState {
    isRaised: boolean
}

export class StreamCardView extends Component<StreamCardViewProps, StreamCardViewState> {

    constructor(props: StreamCardViewProps) {
        super(props)
        this.state = {isRaised: false}
    }

    public render(): ReactNode {
        const serializedStream: SerializedStream = this.props.serializedStream

        return (
            <Card raised={this.state.isRaised} onMouseOver={() => this.setState({isRaised: true})}
                  onMouseLeave={() => this.setState({isRaised: false})}
                  style={{maxWidth: 700, margin: "12px"}}>
                <CardContent>
                    <Typography align="center" variant="h4" title="Stream Name">{serializedStream.name}</Typography>
                    <Typography align="center" variant="h6">{serializedStream.state}</Typography>
                </CardContent>
                <CardActions>
                    <Button><Edit/>Edit Stream</Button>
                    <Button onClick={() => startStream(serializedStream)}><Pause/>Start Recording</Button>
                    <Button onClick={() => pauseStream(serializedStream)}><Pause/>Pause Recording</Button>
                    <Button onClick={() => forceRecordStream(serializedStream)}><FiberManualRecord/>Force
                        Record</Button>
                    <Button onClick={() => unForceRecordStream(serializedStream)}><FiberManualRecord/>UnForce
                        Record</Button>
                    <Button onClick={() => viewDir(serializedStream)}><FolderOpen/>View Output</Button>
                </CardActions>
            </Card>
        )
    }
}
