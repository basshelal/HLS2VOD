import React, {Component, Context, ContextType, ReactNode} from "react"
import {Typography} from "@material-ui/core"
import Container from "@material-ui/core/Container"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"
import {SettingsButton} from "../components/SettingsButton"
import {DialogStreamEntry} from "../components/AddStreamDialog"
import Button from "@material-ui/core/Button"
import {AppContext, AppContextType} from "../UICommons"

interface StreamsLayoutState {
    needsRefresh: boolean
}

export class StreamsLayout extends Component<{}, StreamsLayoutState> {

    constructor(props: {}) {
        super(props)
        this.onStreamAdded = this.onStreamAdded.bind(this)
        this.onListRefreshed = this.onListRefreshed.bind(this)
        this.state = {needsRefresh: true}
    }

    declare context: ContextType<typeof AppContext>

    static contextType: Context<AppContextType> = AppContext

    public onStreamAdded(streamEntry: DialogStreamEntry) { this.setState({needsRefresh: true}) }

    public onListRefreshed() { this.setState({needsRefresh: false}) }

    public render(): ReactNode {
        console.log(this.context.layout)
        return (
            <Container style={{alignItems: "center"}}>
                <Typography style={{color: "black"}} variant="h4">All Streams</Typography>
                <Button onClick={() => {
                    this.context.setLayout("EditStreamScheduleLayout")
                    console.log(this.context.layout)
                }}>TEST!</Button>
                <SettingsButton/>
                <StreamList needsRefresh={this.state.needsRefresh} onRefresh={this.onListRefreshed}/>
                <AddStreamButton onAddStream={this.onStreamAdded}/>
            </Container>
        )
    }
}