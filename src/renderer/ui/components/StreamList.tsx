import React, {Component, ReactNode} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {SerializedStream} from "../../../shared/Serialized"
import {RequestSender} from "../../RequestSender"

export interface StreamListProps {

}

export interface StreamListState {
    streamEntries: Array<SerializedStream>
}

export class StreamList extends Component<StreamListProps, StreamListState> {

    public constructor(props: StreamListProps) {
        super(props)
        this.fetchData = this.fetchData.bind(this)
        this.state = {streamEntries: []}
        this.fetchData()
    }

    public async fetchData(): Promise<void> {
        const allStreams: Array<SerializedStream> = await RequestSender.getAllStreams()
        this.setState({streamEntries: allStreams})
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