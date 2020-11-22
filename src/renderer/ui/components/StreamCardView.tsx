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
}

interface StreamCardViewState {
    isRaised: boolean
}

export class StreamCardView extends Component<StreamCardViewProps, StreamCardViewState> {

    constructor(props: StreamCardViewProps) {
        super(props)
        this.startStream = this.startStream.bind(this)
        this.pauseStream = this.pauseStream.bind(this)
        this.forceRecordStream = this.forceRecordStream.bind(this)
        this.unForceRecordStream = this.unForceRecordStream.bind(this)
        this.viewDir = this.viewDir.bind(this)
        this.state = {isRaised: false}
    }

    public async startStream(stream: StartStreamArgsType): Promise<StartStreamReturnType> {
        return await RequestSender.startStream(stream)
    }

    public async pauseStream(stream: PauseStreamArgsType): Promise<PauseStreamReturnType> {
        return await RequestSender.pauseStream(stream)
    }

    public async forceRecordStream(stream: ForceRecordStreamArgsType): Promise<ForceRecordStreamReturnType> {
        return await RequestSender.forceRecordStream(stream)
    }

    public async unForceRecordStream(stream: UnForceRecordStreamArgsType): Promise<UnForceRecordStreamReturnType> {
        return await RequestSender.unForceRecordStream(stream)
    }

    public async viewDir(stream: ViewStreamDirArgsType): Promise<ViewStreamDirReturnType> {
        return await RequestSender.viewStreamDir(stream)
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
                    <Button onClick={() => this.startStream(serializedStream)}><Pause/>Start Recording</Button>
                    <Button onClick={() => this.pauseStream(serializedStream)}><Pause/>Pause Recording</Button>
                    <Button onClick={() => this.forceRecordStream(serializedStream)}><FiberManualRecord/>Force
                        Record</Button>
                    <Button onClick={() => this.unForceRecordStream(serializedStream)}><FiberManualRecord/>UnForce
                        Record</Button>
                    <Button onClick={() => this.viewDir(serializedStream)}><FolderOpen/>View Output</Button>
                </CardActions>
            </Card>
        )
    }
}
