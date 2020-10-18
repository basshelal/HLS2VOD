import React, {FC, PropsWithChildren} from "react"
import {Typography} from "@material-ui/core"
import Container from "@material-ui/core/Container"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"
import {SettingsButton} from "../components/SettingsButton"

export interface StreamsLayoutProps {

}

export const StreamsLayout: FC = (props: PropsWithChildren<StreamsLayoutProps>) => {
    return (
        <Container style={{alignItems: "center"}}>
            <Typography variant="h4">All Streams</Typography>
            <SettingsButton/>
            <StreamList/>
            <AddStreamButton onFinish={(string) => console.log(string)}/>
        </Container>
    )
}