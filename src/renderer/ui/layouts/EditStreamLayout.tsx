import React, {Component, Context, ContextType} from "react"
import {Button, Typography} from "@material-ui/core"
import {SerializedShow, SerializedStream} from "../../../shared/Serialized"
import {ArrowBack, Delete, Save} from "@material-ui/icons"
import {AppContext, AppContextType} from "../UICommons"
import TextField from "@material-ui/core/TextField"
import {RequestSender} from "../../RequestSender"
import {ShowForm} from "../components/ShowForm"


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
        this.onBack = this.onBack.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
        this.onDelete = this.onDelete.bind(this)
        this.state = props.serializedStream
    }

    static contextType: Context<AppContextType> = AppContext
    declare context: ContextType<typeof AppContext>

    public onBack() {
        if (this.props.onBack) this.props.onBack(this.state)
    }

    public async onSubmit(): Promise<void> {
        // TODO: Validate
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
        if (this.props.onSubmit) this.props.onSubmit(this.state)
    }

    public async onDelete(): Promise<void> {
        await RequestSender.deleteStream(this.state.name)
        if (this.props.onDelete) this.props.onDelete(this.state)
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
                    {this.state.scheduledShows.map((show: SerializedShow, index: number) => {
                        return <ShowForm serializedShow={show} key={show.name}/>
                    })}
                </div>
                <Button onClick={() => this.setState((prevState: EditStreamLayoutState) => {
                        prevState.scheduledShows.push({
                            name: "", startTime: -1, endTime: -1, offsetEndTime: -1, offsetStartTime: -1
                        })
                        return {
                            scheduledShows: prevState.scheduledShows
                        }
                    }
                )}>New Show</Button>
                <Button onClick={this.onSubmit}><Save/>Save Stream</Button>
                <Button onClick={this.onDelete}><Delete/>Delete Stream</Button>
            </div>
        )
    }
}