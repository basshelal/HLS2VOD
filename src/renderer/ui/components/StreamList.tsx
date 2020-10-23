import React, {Component} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {handleFromMain, sendToMain} from "../UICommons"
import {Events} from "../../../shared/Events"
import {StreamEntry} from "../../../main/Stream"

export interface StreamListProps {

}

export class StreamList extends Component {

    state: { streamEntries: Array<StreamEntry> }

    public constructor(props) {
        super(props)
        this.state = {streamEntries: []}
        this.fetchData()
        handleFromMain(Events.RefreshAllStreams, () => this.fetchData())
    }

    public fetchData() {
        sendToMain<Array<StreamEntry>>(Events.GetStreams).then(returned => {
            this.setState({streamEntries: returned})
        })
    }

    public render(): React.ReactNode {
        return (
            <Container>
                {this.state.streamEntries.map((streamEntry: StreamEntry, index: number) => {
                    return <StreamCardView streamEntry={streamEntry} key={streamEntry.name}/>
                })}
            </Container>
        )
    }

}