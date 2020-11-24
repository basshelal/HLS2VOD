import React, {Component} from "react"
import {SerializedShow} from "../../../shared/Serialized"
import {MuiPickersUtilsProvider, TimePicker} from "@material-ui/pickers"
import {MaterialUiPickersDate} from "@material-ui/pickers/typings/date"
import MomentUtils from "@date-io/moment"
import moment, {Moment} from "moment/moment"
import {Select, Typography} from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import {allDays} from "../../../shared/Utils"
import {Day} from "../../../shared/Types"
import TextField from "@material-ui/core/TextField"
import Button from "@material-ui/core/Button"
import {Delete} from "@material-ui/icons"
import {Show} from "../../../main/models/Show"
import {duration} from "moment"

interface ShowFormProps {
    serializedShow: SerializedShow
    onChange?: (serializedShow: SerializedShow) => void
    onDelete?: (serializedShow: SerializedShow) => void
}

interface ShowFormState {
    name: string
    startTimeMoment: Moment
    day: Day
    durationAmount: number
    offsetSeconds: number
}

function SerializedShowToShowFormState(serializedShow: SerializedShow): ShowFormState {
    const startTime: Moment = moment(serializedShow.startTime)
    const durationMinutes: number = duration({from: serializedShow.startTime, to: serializedShow.endTime}).asMinutes()
    const offsetSeconds: number = duration({
        from: serializedShow.offsetStartTime,
        to: serializedShow.startTime
    }).asSeconds()

    return {
        name: serializedShow.name,
        startTimeMoment: startTime,
        day: startTime.format("dddd") as Day,
        durationAmount: durationMinutes,
        offsetSeconds: offsetSeconds
    }
}

function ShowFormStateToSerializedShow(showFormState: ShowFormState): SerializedShow {
    return new Show({
        name: showFormState.name,
        startTimeMoment: showFormState.startTimeMoment,
        duration: duration(showFormState.durationAmount, "minutes"),
        offsetSeconds: showFormState.offsetSeconds
    }).serialize()
}

export class ShowForm extends Component <ShowFormProps, ShowFormState> {

    constructor(props: ShowFormProps) {
        super(props)
        this.onChange = this.onChange.bind(this)
        this.onDayChanged = this.onDayChanged.bind(this)
        this.state = SerializedShowToShowFormState(this.props.serializedShow)
    }

    public onChange() {
        const serializedShow = ShowFormStateToSerializedShow(this.state)
        if (this.props.onChange) this.props.onChange(serializedShow)
    }

    public onDayChanged(day: Day) {
        this.setState({day: day})
        this.onChange()
    }

    public render() {
        return (
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Typography style={{color: "black"}} variant="h5">{this.state.name}</Typography>
                <Typography style={{color: "black"}} variant="h6">Day</Typography>
                <Select value={this.state.day} onChange={event => this.onDayChanged(event.target.value as Day)}>
                    {allDays.map((day: Day) => (<MenuItem value={day} key={day}>{day}</MenuItem>))}
                </Select>
                <Typography style={{color: "black"}} variant="h6">Time</Typography>
                <TimePicker
                    clearable
                    ampm={false}
                    label="24 hours"
                    value={this.state.startTimeMoment}
                    onChange={(date: MaterialUiPickersDate) => {
                        if (date) this.setState({startTimeMoment: date})
                    }}
                />
                <Typography style={{color: "black"}} variant="h6">Duration</Typography>
                <TextField label="Duration (minutes)" type="number" value={this.state.durationAmount}/>
                <Button><Delete/>Delete Show</Button>
            </MuiPickersUtilsProvider>
        )
    }
}
