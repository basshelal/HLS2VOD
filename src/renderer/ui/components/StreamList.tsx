import React, {Component} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {handleFromMain, sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import {SerializedStream} from "../../../main/Stream"

export interface StreamListProps {

}

export class StreamList extends Component {

    state: { streamEntries: Array<SerializedStream> }

    public constructor(props) {
        super(props)
        this.state = {streamEntries: []}
        this.fetchData()
        handleFromMain(Requests.RefreshAllStreams, () => this.fetchData())
    }

    public fetchData() {
        sendToMain<Array<SerializedStream>>(Requests.GetStreams).then(returned => {
            this.setState({streamEntries: returned})
        })
    }

    public render(): React.ReactNode {
        return (
            <Container>
                {this.state.streamEntries.map((streamEntry: SerializedStream, index: number) => {
                    return <StreamCardView streamEntry={streamEntry} key={streamEntry.name}/>
                })}
            </Container>
        )
    }

}