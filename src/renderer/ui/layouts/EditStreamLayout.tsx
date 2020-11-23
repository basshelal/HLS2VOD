import React, {Component, Context, ContextType} from "react"
import {Button, Typography} from "@material-ui/core"
import {SerializedStream} from "../../../shared/Serialized"
import {ArrowBack} from "@material-ui/icons"
import {AppContext, AppContextType} from "../UICommons"

interface EditStreamLayoutProps {
    serializedStream: SerializedStream
    onBack?: (serializedStream: SerializedStream) => void
}

interface EditStreamLayoutState {
    serializedStream: SerializedStream
}

export class EditStreamLayout extends Component<EditStreamLayoutProps, EditStreamLayoutState> {

    constructor(props: EditStreamLayoutProps) {
        super(props)
        this.back = this.back.bind(this)
        this.state = {serializedStream: props.serializedStream}
    }

    static contextType: Context<AppContextType> = AppContext
    declare context: ContextType<typeof AppContext>

    public back(serializedStream: SerializedStream) {
        if (this.props.onBack) this.props.onBack(serializedStream)
    }

    public render() {
        const serializedStream = this.state.serializedStream
        return (
            <div>
                <Button title="Back to Streams" onClick={() => this.back(serializedStream)}><ArrowBack/></Button>
                <Typography style={{color: "black"}} variant="h4">{this.props.serializedStream.name}</Typography>
            </div>
        )
    }
}