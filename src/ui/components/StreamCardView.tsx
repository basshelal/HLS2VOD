import React, {FC, PropsWithChildren, useState} from "react"
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Typography from "@material-ui/core/Typography"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"
import {Button} from "@material-ui/core"
import {Edit, FiberManualRecord, FolderOpen, Pause} from "@material-ui/icons"
import {StreamEntry} from "../../stream/Stream"

interface StreamCardViewProps {
    streamEntry: StreamEntry
}

function styles(): ClassNameMap {
    return makeStyles((theme: Theme) =>
        createStyles({
            root: {
                maxWidth: 700,
                margin: "12px"
            }
        })
    )()
}

export const StreamCardView: FC<StreamCardViewProps> = (props: PropsWithChildren<StreamCardViewProps>) => {
    const classes = styles()
    const [raised, setRaised] = useState<boolean>(false)
    const streamEntry: StreamEntry = props.streamEntry

    return (
        <Card className={classes.root} raised={raised}
              onMouseOver={() => setRaised(true)} onMouseLeave={() => setRaised(false)}>
            <CardContent>
                <Typography align="center" variant="h4" title="Stream Name">{streamEntry.name}</Typography>
                <Typography align="center" variant="h6">{streamEntry.state}</Typography>
            </CardContent>
            <CardActions>
                <Button><Edit/>Edit Stream</Button>
                <Button><Pause/>Start / Pause</Button>
                <Button><FiberManualRecord/>Force / UnForce Record</Button>
                <Button><FolderOpen/>View Output</Button>
            </CardActions>
        </Card>
    )
}
