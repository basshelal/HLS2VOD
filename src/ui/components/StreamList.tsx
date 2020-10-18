import React, {FC, PropsWithChildren, useState} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {handleFromMain, UIGlobals} from "../UICommons"
import {Events} from "../../Events"
import {StreamEntry} from "../../Database"

export interface StreamListProps {

}

let handler = (streamEntries: Array<StreamEntry>) => {}

handleFromMain<Array<StreamEntry>>(Events.GetStreams,
    async (event, streamEntries) => handler(streamEntries))

export const StreamList: FC = (props: PropsWithChildren<StreamListProps>) => {

    const [streamEntries, setStreamEntries] = useState<Array<StreamEntry>>([])

    handler = (streamEntries: Array<StreamEntry>) => {
        UIGlobals.StreamEntries = streamEntries
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