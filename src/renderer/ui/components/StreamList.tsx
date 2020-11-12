import React, {Component, ReactNode} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {handleFromMain, sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import {SerializedStream} from "../../../shared/Serialized"

export interface StreamListProps {

}

export interface StreamListState {
    streamEntries: Array<SerializedStream>
}

export class StreamList extends Component<StreamListProps, StreamListState> {

    public constructor(props: StreamListProps) {
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

    public render(): ReactNode {
        return (
            <Container>
                {this.state.streamEntries.map((streamEntry: SerializedStream, index: number) => {
                    return <StreamCardView serializedStream={streamEntry} key={streamEntry.name}/>
                })}
            </Container>
        )
    }

}