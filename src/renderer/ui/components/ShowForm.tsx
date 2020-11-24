import React, {Component} from "react"
import {SerializedShow} from "../../../shared/Serialized"
import {MuiPickersUtilsProvider, TimePicker} from "@material-ui/pickers"
import {MaterialUiPickersDate} from "@material-ui/pickers/typings/date"
import MomentUtils from "@date-io/moment"
import {Moment} from "moment/moment"
import {Select} from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import {allDays} from "../../../shared/Utils"
import {Day} from "../../../shared/Types"
import TextField from "@material-ui/core/TextField"

interface ShowFormProps {
    serializedShow: SerializedShow
    // TODO: Shit ton of listeners
}

interface ShowFormState {
    name?: string
    startTimeMoment?: Moment | null
    day?: string
    hour?: number
    minute?: number
    duration?: number
}

export class ShowForm extends Component <ShowFormProps, ShowFormState> {

    constructor(props: ShowFormProps) {
        super(props)

        this.state = {}
    }

    public render() {
        return (
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <h1>{this.state.name}</h1>
                <h4>Day</h4>
                <Select value={"Monday"}>
                    {allDays.map((day: Day) => (
                        <MenuItem value={day} key={day}>{day}</MenuItem>)
                    )}
                </Select>
                <h4>Time</h4>
                <TimePicker
                    clearable
                    ampm={false}
                    label="24 hours"
                    value={this.state.startTimeMoment}
                    onChange={(date: MaterialUiPickersDate) => this.setState({startTimeMoment: date})}
                />
                <h4>Duration</h4>
                <TextField label="Duration (number)" type="number"/>
                <Select value={"Minutes"}>
                    {["Minutes", "Hours"].map((dur: string) => (
                        <MenuItem value={dur} key={dur}>{dur}</MenuItem>)
                    )}
                </Select>
            </MuiPickersUtilsProvider>
        )
    }
}
