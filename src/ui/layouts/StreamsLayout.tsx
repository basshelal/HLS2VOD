import React, {FC, PropsWithChildren} from "react"
import {Typography} from "@material-ui/core"
import Container from "@material-ui/core/Container"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"

export interface StreamsLayoutProps {

}

export const StreamsLayout: FC = (props: PropsWithChildren<StreamsLayoutProps>) => {
    return (
        <Container style={{alignItems: "center"}}>
            <Typography variant="h4">All Streams</Typography>
            <StreamList/>
            <AddStreamButton/>
        </Container>
    )
}