import React, {Component} from "react"
import {MuiPickersUtilsProvider, TimePicker} from "@material-ui/pickers"
import MomentUtils from "@date-io/moment"
import moment, {Moment} from "moment/moment"
import {Select, Typography} from "@material-ui/core"
import MenuItem from "@material-ui/core/MenuItem"
import {allDays, json} from "../../../shared/Utils"
import {Day} from "../../../shared/Types"
import TextField from "@material-ui/core/TextField"
import Button from "@material-ui/core/Button"
import {Delete} from "@material-ui/icons"
import {SerializedShow} from "../../../shared/Serialized"
import {RequestSender} from "../../RequestSender"
import {AllSettings} from "../../../main/Database"

interface ShowFormProps {
    serializedShow: SerializedShow
    onChange?: (originalName: string, serializedShow: SerializedShow) => void
    onDelete?: (originalName: string, serializedShow: SerializedShow) => void
}

interface ShowFormState extends SerializedShow {
    originalName: string
}

function SerializedShowToShowFormState(originalName: string, serializedShow: SerializedShow): ShowFormState {
    return {
        name: serializedShow.name,
        day: serializedShow.day,
        startTime: serializedShow.startTime,
        duration: serializedShow.duration,
        offsetDuration: serializedShow.offsetDuration,
        originalName: originalName
    }
}

function ShowFormStateToSerializedShow(showFormState: ShowFormState): SerializedShow {
    return {
        name: showFormState.name,
        day: showFormState.day,
        startTime: showFormState.startTime,
        duration: showFormState.duration,
        offsetDuration: showFormState.offsetDuration
    }
}

export class ShowForm extends Component <ShowFormProps, ShowFormState> {

    constructor(props: ShowFormProps) {
        super(props)
        this.onChange = this.onChange.bind(this)
        this.onDayChanged = this.onDayChanged.bind(this)
        this.onDurationChanged = this.onDurationChanged.bind(this)
        this.state = SerializedShowToShowFormState(this.props.serializedShow.name, this.props.serializedShow)
        RequestSender.getAllSettings().then((allSettings: AllSettings) => {
            this.setState({offsetDuration: {amount: allSettings.offsetSeconds, unit: "seconds"}})
        })
    }

    public async onChange(): Promise<void> {
        const serializedShow = ShowFormStateToSerializedShow(this.state)
        console.log(json(this.state))
        if (this.props.onChange) this.props.onChange(this.state.originalName, serializedShow)
    }

    public onDayChanged(dayString: string) {
        const day: Day = dayString as Day
        this.setState({day: day}, () => this.onChange())
    }

    public onDurationChanged(durationString: string) {
        console.log(durationString)
        const duration: number = durationString === "" ? 0 : Number.parseInt(durationString)
        this.setState({duration: {amount: duration, unit: "minutes"}}, () => {
            this.onChange()
        })
    }

    public render() {
        return (
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Typography style={{color: "black"}} variant="h5">{this.state.name}</Typography>
                <TextField label="Show name"
                           value={this.state.name}
                           onChange={(event) => this.setState({name: event.target.value})}/>
                <Typography style={{color: "black"}} variant="h6">Day</Typography>
                <Select value={this.state.day}
                        onChange={(event) => this.onDayChanged(event.target.value as string)}>
                    {allDays.map((day: Day) => (<MenuItem value={day} key={day}>{day}</MenuItem>))}
                </Select>
                <Typography style={{color: "black"}} variant="h6">Time</Typography>
                <TimePicker
                    ampm={false}
                    label="24 hours"
                    value={moment(this.state.startTime)}
                    onChange={(date: Moment | null) => {
                        if (date) {
                            const obj = date.toObject()
                            console.log(obj)
                            const mom = moment(obj)
                            const oobj = mom.toObject()
                            console.log(oobj)
                            console.log(obj == oobj)
                            this.setState({startTime: {h: date.hours(), m: date.minutes()}})
                        }
                    }}
                />
                <Typography style={{color: "black"}} variant="h6">Duration</Typography>
                <TextField label="Duration (minutes)" type="number"
                           value={this.state.duration.amount}
                           onChange={(event) => this.onDurationChanged(event.target.value)}/>
                <Button onClick={() => {
                    if (this.props.onDelete) {
                        this.props.onDelete(this.state.originalName, this.state)
                    }
                }}><Delete/>Delete Show</Button>
            </MuiPickersUtilsProvider>
        )
    }
}
