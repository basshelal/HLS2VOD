import React, {Component, Context, ContextType, ReactNode} from "react"
import {Typography} from "@material-ui/core"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"
import {SettingsButton} from "../components/SettingsButton"
import {DialogStreamEntry} from "../components/AddStreamDialog"
import {AppContext, AppContextType} from "../UICommons"
import {SerializedStream} from "../../../shared/Serialized"
import {EditStreamLayout} from "./EditStreamLayout"

interface StreamsLayoutState {
    needsRefresh: boolean
    isEdit: boolean
    focusedStream?: SerializedStream
}

export class StreamsLayout extends Component<{}, StreamsLayoutState> {

    constructor(props: {}) {
        super(props)
        this.onStreamAdded = this.onStreamAdded.bind(this)
        this.onListRefreshed = this.onListRefreshed.bind(this)
        this.onEditStream = this.onEditStream.bind(this)
        this.layout = this.layout.bind(this)
        this.state = {needsRefresh: true, isEdit: false}
    }

    static contextType: Context<AppContextType> = AppContext
    declare context: ContextType<typeof AppContext>

    public onStreamAdded(streamEntry: DialogStreamEntry) { this.setState({needsRefresh: true}) }

    public onListRefreshed() { this.setState({needsRefresh: false}) }

    public onEditStream(serializedStream: SerializedStream) {
        this.setState({isEdit: true, focusedStream: serializedStream})
    }

    public layout(): ReactNode {
        if (this.state.isEdit) {
            if (this.state.focusedStream)
                return (<div>
                    <EditStreamLayout serializedStream={this.state.focusedStream}
                                      onBack={() => this.setState({isEdit: false, needsRefresh: true})}/>
                </div>)
        } else return (<div>
            <Typography style={{color: "black"}} variant="h4">All Streams</Typography>
            <SettingsButton/>
            <StreamList needsRefresh={this.state.needsRefresh} onRefresh={this.onListRefreshed}
                        onEditStream={this.onEditStream}/>
            <AddStreamButton onAddStream={this.onStreamAdded}/>
        </div>)
    }

    public render(): ReactNode {
        return (
            <div>{this.layout()}</div>
        )
    }
}