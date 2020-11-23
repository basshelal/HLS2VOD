import React, {Component, Context, ContextType} from "react"
import {Button, Typography} from "@material-ui/core"
import {SerializedShow, SerializedStream} from "../../../shared/Serialized"
import {ArrowBack, Delete, Save} from "@material-ui/icons"
import {AppContext, AppContextType} from "../UICommons"
import TextField from "@material-ui/core/TextField"


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
        if (this.props.onSubmit) this.props.onSubmit(this.state)
    }

    public async onDelete(): Promise<void> {
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
                {/*TODO Schedule is list of Shows, a show being: name, Day, hour, minute, duration*/}
                <Button onClick={this.onSubmit}><Save/>Save Stream</Button>
                <Button onClick={this.onDelete}><Delete/>Delete Stream</Button>
            </div>
        )
    }
}