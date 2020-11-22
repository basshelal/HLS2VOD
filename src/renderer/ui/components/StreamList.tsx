import React, {Component, ReactNode} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {SerializedStream} from "../../../shared/Serialized"
import {RequestSender} from "../../RequestSender"

export interface StreamListProps {
    needsRefresh: boolean
    onRefresh?: () => void
}

export interface StreamListState {
    streamEntries: Array<SerializedStream>
}

export class StreamList extends Component<StreamListProps, StreamListState> {

    public constructor(props: StreamListProps) {
        super(props)
        this.fetchData = this.fetchData.bind(this)
        this.state = {streamEntries: []}
    }

    public async fetchData(): Promise<void> {
        if (this.props.needsRefresh) {
            const allStreams: Array<SerializedStream> = await RequestSender.getAllStreams()
            this.setState({streamEntries: allStreams})
            if (this.props.onRefresh) this.props.onRefresh()
        }
    }

    public render(): ReactNode {
        this.fetchData()
        return (
            <Container>
                {this.state.streamEntries.map((streamEntry: SerializedStream, index: number) => {
                    return <StreamCardView serializedStream={streamEntry} key={streamEntry.name}/>
                })}
            </Container>
        )
    }

}