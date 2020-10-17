import React, {FunctionComponent, PropsWithChildren, useRef, useState} from "react"
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Typography from "@material-ui/core/Typography"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"
import {Button} from "@material-ui/core"
import {Edit, FiberManualRecord, FolderOpen, GetApp, Pause} from "@material-ui/icons"

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

export const StreamCardView: FunctionComponent = (props: PropsWithChildren<{}>) => {
    const classes = styles()
    const [raised, setRaised] = useState<boolean>(false)
    const cardRef = useRef(null)

    return (
        <Card className={classes.root} raised={raised} ref={cardRef}
              onMouseOver={() => setRaised(true)} onMouseLeave={() => setRaised(false)}>
            <CardContent>
                <Typography align="center" variant="h4">Stream Name</Typography>
                <Typography align="center" variant="h6"><GetApp/>State</Typography>
            </CardContent>
            <CardActions>
                <Button><Edit/>Edit Stream</Button>
                <Button><Pause/>Pause</Button>
                <Button><FiberManualRecord/>Force Record</Button>
                <Button><FolderOpen/>View Output</Button>
            </CardActions>
        </Card>
    )
}
