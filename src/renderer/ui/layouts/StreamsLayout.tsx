import React, {Component, ReactNode} from "react"
import {Typography} from "@material-ui/core"
import Container from "@material-ui/core/Container"
import {StreamList} from "../components/StreamList"
import {AddStreamButton} from "../components/AddStreamButton"
import {SettingsButton} from "../components/SettingsButton"
import {sendToMain} from "../UICommons"
import {Requests} from "../../../shared/Requests"
import {SettingsEntry} from "../../../main/Database"

function saveSettings(settings: Array<SettingsEntry>): Promise<Array<SettingsEntry>> {
    return sendToMain(Requests.UpdateSettings, settings)
}

export class StreamsLayout extends Component<{}, {}> {

    constructor(props: {}) {
        super(props)
    }

    public render(): ReactNode {
        return (
            <Container style={{alignItems: "center"}}>
                <Typography style={{color: "black"}} variant="h4">All Streams</Typography>
                <SettingsButton/>
                <StreamList/>
                <AddStreamButton/>
            </Container>
        )
    }
}