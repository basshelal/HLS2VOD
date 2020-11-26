import React, {Component} from "react"
import {Button, Typography} from "@material-ui/core"
import {SerializedShow, SerializedStream} from "../../../shared/Serialized"
import {ArrowBack, Delete, Save} from "@material-ui/icons"
import TextField from "@material-ui/core/TextField"
import {RequestSender} from "../../RequestSender"
import {ShowForm} from "../components/ShowForm"
import moment from "moment"
import {Moment} from "moment/moment"
import {todayDay} from "../../../shared/Utils"


interface EditStreamLayoutProps {
    serializedStream: SerializedStream
    onBack?: (editStreamLayoutState: EditStreamLayoutState) => void
    onSubmit?: (editStreamLayoutState: EditStreamLayoutState) => void
    onDelete?: (editStreamLayoutState: EditStreamLayoutState) => void
}

interface EditStreamLayoutState {
    name: string
    url: string
    scheduledShows: Array<SerializedShow>
    streamDirectory: string
}

export class EditStreamLayout extends Component<EditStreamLayoutProps, EditStreamLayoutState> {

    constructor(props: EditStreamLayoutProps) {
        super(props)
        this.updateStream = this.updateStream.bind(this)
        this.onBack = this.onBack.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.onDeleteStream = this.onDeleteStream.bind(this)
        this.newShow = this.newShow.bind(this)
        this.onShowChanged = this.onShowChanged.bind(this)
        this.onShowDeleted = this.onShowDeleted.bind(this)
        this.state = props.serializedStream
    }

    public async updateStream(): Promise<void> {
        await RequestSender.updateStream({
            streamName: this.props.serializedStream.name,
            updatedStream: {
                name: this.state.name,
                url: this.state.url,
                streamDirectory: this.state.streamDirectory,
                scheduledShows: this.state.scheduledShows,
                state: this.props.serializedStream.state,
                isForced: this.props.serializedStream.isForced
            }
        })
    }

    public async onBack(): Promise<void> {
        await this.updateStream()
        if (this.props.onBack) this.props.onBack(this.state)
    }

    public async onSubmit(): Promise<void> {
        await this.updateStream()
        if (this.props.onSubmit) this.props.onSubmit(this.state)
    }

    public async onDeleteStream(): Promise<void> {
        await RequestSender.deleteStream(this.state.name)
        if (this.props.onDelete) this.props.onDelete(this.state)
    }

    public newShow() {
        if (!this.state.scheduledShows.find(it => it.name === "")) {
            this.setState((prevState: EditStreamLayoutState) => {
                const now: Moment = moment()
                prevState.scheduledShows.push({
                    name: "",
                    day: todayDay(),
                    startTime: {h: now.hours(), m: now.minutes()},
                    duration: {amount: 0, unit: "seconds"},
                    offsetDuration: {amount: 0, unit: "seconds"}
                })
                return {scheduledShows: prevState.scheduledShows}
            })
        }
    }

    public onShowChanged(originalName: string, serializedShow: SerializedShow) {
        const scheduledShows = this.state.scheduledShows
        const foundShow: SerializedShow | undefined = scheduledShows.find(it => it.name === originalName)
        if (foundShow) {
            const index: number = scheduledShows.indexOf(foundShow)
            scheduledShows[index] = serializedShow
            this.setState({scheduledShows: scheduledShows})
        }
    }

    public onShowDeleted(originalName: string, serializedShow: SerializedShow) {
        const scheduledShows = this.state.scheduledShows
        const foundShow: SerializedShow | undefined = scheduledShows.find(it => it.name === originalName)
        if (foundShow) {
            const index: number = scheduledShows.indexOf(foundShow)
            scheduledShows.splice(index)
            this.setState({scheduledShows: scheduledShows})
        }
    }

    public render() {
        return (
            <div>
                <Button title="Back to Streams" onClick={this.onBack}><ArrowBack/></Button>
                <Typography style={{color: "black"}} variant="h4">{this.props.serializedStream.name}</Typography>
                <TextField fullWidth
                           margin="dense"
                           label="Stream Name"
                           value={this.state.name}
                           onChange={event => this.setState({name: event.target.value})}/>
                <TextField fullWidth
                           margin="dense"
                           label="Stream Url"
                           value={this.state.url}
                           onChange={event => this.setState({url: event.target.value})}/>
                <Typography style={{color: "black"}} variant="h4">Schedule</Typography>
                <div>
                    {this.state.scheduledShows.map((show: SerializedShow) => {
                        return <ShowForm serializedShow={show} key={show.name} onChange={this.onShowChanged}
                                         onDelete={this.onShowDeleted}/>
                    })}
                </div>
                <Button onClick={this.newShow}>New Show</Button>
                <Button onClick={this.onSubmit}><Save/>Save Stream</Button>
                <Button onClick={this.onDeleteStream}><Delete/>Delete Stream</Button>
            </div>
        )
    }
}