import React, {FC, PropsWithChildren} from "react"
import {Typography} from "@material-ui/core"
import Container from "@material-ui/core/Container"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"
import {SettingsButton} from "../components/SettingsButton"
import {sendToMain} from "../UICommons"
import {Events} from "../../Events"
import {SettingsEntry} from "../../Database"

export interface StreamsLayoutProps {

}

function saveSettings(settings: Array<SettingsEntry>): Promise<Array<SettingsEntry>> {
    return sendToMain(Events.UpdateSettings, settings)
}

export const StreamsLayout: FC = (props: PropsWithChildren<StreamsLayoutProps>) => {
    return (
        <Container style={{alignItems: "center"}}>
            <Typography style={{color: "black"}} variant="h4">All Streams</Typography>
            <SettingsButton/>
            <StreamList/>
            <AddStreamButton onFinish={(string) => console.log(string)}/>
        </Container>
    )
}