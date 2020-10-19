import React, {FC, PropsWithChildren, useState} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {handleFromMain, sendToMain} from "../UICommons"
import {Events} from "../../Events"
import {StreamEntry} from "../../stream/Stream"

export interface StreamListProps {

}

let handler: (streamEntries: Array<StreamEntry>) => void = (streamEntries: Array<StreamEntry>) => {}

handleFromMain<Array<StreamEntry>>(Events.GetStreams, (event, streamEntries) => handler(streamEntries))

export const StreamList: FC = (props: PropsWithChildren<StreamListProps>) => {

    const [streamEntries, setStreamEntries] = useState<Array<StreamEntry>>([])

    sendToMain<Array<StreamEntry>>(Events.GetStreams).then(returned => setStreamEntries(returned))

    handler = (streamEntries: Array<StreamEntry>) => {
        setStreamEntries(streamEntries)
        console.log(streamEntries)
    }

    return (
        <Container>
            {streamEntries.map((streamEntry: StreamEntry, index: number) => {
                return <StreamCardView streamEntry={streamEntry} key={streamEntry.name}/>
            })}
        </Container>
    )
}