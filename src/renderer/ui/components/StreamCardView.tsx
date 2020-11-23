import React, {Component, ReactNode} from "react"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Typography from "@material-ui/core/Typography"
import {Button} from "@material-ui/core"
import {Edit, FiberManualRecord, FolderOpen, Pause} from "@material-ui/icons"
import {
    ForceRecordStreamArgsType,
    ForceRecordStreamReturnType,
    PauseStreamArgsType,
    PauseStreamReturnType,
    StartStreamArgsType,
    StartStreamReturnType,
    UnForceRecordStreamArgsType,
    UnForceRecordStreamReturnType,
    ViewStreamDirArgsType,
    ViewStreamDirReturnType
} from "../../../shared/Requests"
import {SerializedStream} from "../../../shared/Serialized"
import {RequestSender} from "../../RequestSender"

interface StreamCardViewProps {
    serializedStream: SerializedStream
    onEditStreamClicked?: (serializedStream: SerializedStream) => void
}

interface StreamCardViewState {
    serializedStream: SerializedStream
}

export class StreamCardView extends Component<StreamCardViewProps, StreamCardViewState> {

    constructor(props: StreamCardViewProps) {
        super(props)
        this.startStream = this.startStream.bind(this)
        this.pauseStream = this.pauseStream.bind(this)
        this.forceRecordStream = this.forceRecordStream.bind(this)
        this.unForceRecordStream = this.unForceRecordStream.bind(this)
        this.pauseUnpauseButton = this.pauseUnpauseButton.bind(this)
        this.forceUnForceButton = this.forceUnForceButton.bind(this)
        this.viewDir = this.viewDir.bind(this)
        this.editStream = this.editStream.bind(this)
        this.state = {serializedStream: props.serializedStream}
    }

    public async startStream(stream: StartStreamArgsType): Promise<StartStreamReturnType> {
        const result: StartStreamReturnType = await RequestSender.startStream(stream)
        if (result) this.setState({serializedStream: result})
        return result
    }

    public async pauseStream(stream: PauseStreamArgsType): Promise<PauseStreamReturnType> {
        const result: PauseStreamReturnType = await RequestSender.pauseStream(stream)
        if (result) this.setState({serializedStream: result})
        return result
    }

    public async forceRecordStream(stream: ForceRecordStreamArgsType): Promise<ForceRecordStreamReturnType> {
        const result: ForceRecordStreamReturnType = await RequestSender.forceRecordStream(stream)
        if (result) this.setState({serializedStream: result})
        return result
    }

    public async unForceRecordStream(stream: UnForceRecordStreamArgsType): Promise<UnForceRecordStreamReturnType> {
        const result: UnForceRecordStreamReturnType = await RequestSender.unForceRecordStream(stream)
        if (result) this.setState({serializedStream: result})
        return result
    }

    public async viewDir(stream: ViewStreamDirArgsType): Promise<ViewStreamDirReturnType> {
        const result: ViewStreamDirReturnType = await RequestSender.viewStreamDir(stream)
        if (result) this.setState({serializedStream: result})
        return result
    }

    public pauseUnpauseButton(serializedStream: SerializedStream): ReactNode {
        if (serializedStream.state === "paused") {
            return (
                <Button onClick={() => this.startStream(serializedStream)}><Pause/>Start Recording</Button>
            )
        } else {
            return (
                <Button onClick={() => this.pauseStream(serializedStream)}><Pause/>Pause Recording</Button>
            )
        }
    }

    public forceUnForceButton(serializedStream: SerializedStream): ReactNode {
        if (serializedStream.isForced) {
            return (
                <Button onClick={() => this.unForceRecordStream(serializedStream)}><FiberManualRecord/>
                    UnForce Record</Button>
            )
        } else {
            return (
                <Button onClick={() => this.forceRecordStream(serializedStream)}><FiberManualRecord/>
                    Force Record</Button>
            )
        }
    }

    public editStream(serializedStream: SerializedStream) {
        if (this.props.onEditStreamClicked) this.props.onEditStreamClicked(serializedStream)
    }

    public render(): ReactNode {
        const serializedStream: SerializedStream | undefined = this.state.serializedStream
        return (
            <Card style={{maxWidth: 700, margin: "12px"}}>
                <CardContent>
                    <Typography align="center" variant="h4" title="Stream Name">{serializedStream.name}</Typography>
                    <Typography align="center" variant="h6" title="Stream Url">{serializedStream.url}</Typography>
                    <Typography align="center" variant="h6" title="Stream State">{serializedStream.state}</Typography>
                </CardContent>
                <CardActions>
                    <Button onClick={() => this.editStream(serializedStream)}><Edit/>Edit Stream</Button>
                    {this.pauseUnpauseButton(serializedStream)}
                    {this.forceUnForceButton(serializedStream)}
                    <Button onClick={() => this.viewDir(serializedStream)}><FolderOpen/>View Output</Button>
                </CardActions>
            </Card>
        )
    }
}
