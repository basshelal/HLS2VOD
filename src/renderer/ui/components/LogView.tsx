import React, {Component, ReactNode} from "react"
import {LazyLog} from "react-lazylog"

/*
 * Display Log messages that would be seen in console, these can be written to a file as well
 */

export class LogView extends Component<{}, {}> {

    constructor(props: {}) {
        super(props)
    }

    public render(): ReactNode {
        return (<LazyLog></LazyLog>)
    }
}