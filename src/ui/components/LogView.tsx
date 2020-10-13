import React, {FC} from "react"
import {LazyLog} from "react-lazylog"

/*
 * Display Log messages that would be seen in console, these can be written to a file as well
 */

export const LogView: FC = (props) => {
    return (<LazyLog></LazyLog>)
}