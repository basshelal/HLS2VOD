import React, {FunctionComponent, PropsWithChildren, useState} from "react"
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles"
import clsx from "clsx"
import Card from "@material-ui/core/Card"
import CardContent from "@material-ui/core/CardContent"
import CardActions from "@material-ui/core/CardActions"
import Collapse from "@material-ui/core/Collapse"
import IconButton from "@material-ui/core/IconButton"
import Typography from "@material-ui/core/Typography"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"

/*
 * Card Showing a Stream:
 * Stream Name
 * Stream State (Recording, paused etc)
 * Next Show
 * Edit utils (Edit url, Edit schedule, Edit name, delete etc)
 * Recording controls (Start, Pause, Stop)
 * View Output button
 * Info messages
 */

function styles(): ClassNameMap {
    return makeStyles((theme: Theme) =>
        createStyles({
            root: {
                maxWidth: 700,
                alignSelf: "center"
            },
            media: {
                height: 0,
                paddingTop: "56.25%" // 16:9
            },
            expand: {
                transform: "rotate(0deg)",
                marginLeft: "auto",
                transition: theme.transitions.create("transform", {
                    duration: theme.transitions.duration.shortest
                })
            },
            expandOpen: {
                transform: "rotate(180deg)"
            }
        })
    )()
}

export const StreamCardView: FunctionComponent = (props: PropsWithChildren<{}>) => {
    const classes = styles()
    const [expanded, setExpanded] = useState<boolean>(false)

    return (
        <Card className={classes.root}>
            <CardContent>
                <Typography align="center" variant="h4">Stream Name</Typography>
            </CardContent>
            <CardActions>
                <IconButton className={clsx(classes.expand, {[classes.expandOpen]: expanded})}
                            onClick={() => {setExpanded(!expanded)}}
                            title={expanded ? "show less" : "show more"}
                            aria-expanded={expanded}
                            aria-label={expanded ? "show less" : "show more"}>
                    <ExpandMoreIcon/>
                </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout="auto">
                <CardContent>
                    <Typography paragraph>Content:</Typography>
                </CardContent>
            </Collapse>
        </Card>
    )
}
