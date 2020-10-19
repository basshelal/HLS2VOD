import React, {FC, PropsWithChildren, useState} from "react"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"
import {sendToMain} from "../UICommons"
import {Events} from "../../Events"
import {StreamEntry} from "../../stream/Stream"
import {delay, now} from "../../utils/Utils"

export interface StreamListProps {

}

export const StreamList: FC = (props: PropsWithChildren<StreamListProps>) => {

    // TODO: This renders forever because a state change re-renders

    console.log(now())

    const [streamEntries, setStreamEntries] = useState<Array<StreamEntry>>([])

    sendToMain<Array<StreamEntry>>(Events.GetStreams).then(returned => {
        console.log(returned)
        delay(5000).then(() => setStreamEntries(returned))
    })

    return (
        <Container>
            {streamEntries.map((streamEntry: StreamEntry, index: number) => {
                return <StreamCardView streamEntry={streamEntry} key={streamEntry.name}/>
            })}
        </Container>
    )
}