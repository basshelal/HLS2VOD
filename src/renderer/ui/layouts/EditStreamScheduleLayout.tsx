import React, {Component} from "react"
import {Typography} from "@material-ui/core"

export class EditStreamScheduleLayout extends Component<{}, {}> {

    constructor(props: {}) {
        super(props)

        this.state = {}
    }

    public render() {
        return (
            <div>
                <Typography style={{color: "black"}} variant="h4">Hello World!</Typography>
            </div>
        )
    }
}