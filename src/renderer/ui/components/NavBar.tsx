import React, {FC, PropsWithChildren, useState} from "react"
import clsx from "clsx"
import {createStyles, makeStyles, Theme, useTheme} from "@material-ui/core/styles"
import Drawer from "@material-ui/core/Drawer"
import CssBaseline from "@material-ui/core/CssBaseline"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import List from "@material-ui/core/List"
import Typography from "@material-ui/core/Typography"
import Divider from "@material-ui/core/Divider"
import IconButton from "@material-ui/core/IconButton"
import MenuIcon from "@material-ui/icons/Menu"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import {Info, Settings, ViewStream} from "@material-ui/icons"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"
import {AppName} from "../UICommons"
import createPalette from "@material-ui/core/styles/createPalette"

const drawerWidth: number = 240

function styles(): ClassNameMap {
    return makeStyles((theme: Theme) =>
        createStyles({
            root: {
                display: "flex"
            },
            appBar: {
                transition: theme.transitions.create(["margin", "width"], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen
                })
            },
            appBarShift: {
                width: `calc(100% - ${drawerWidth}px)`,
                marginLeft: drawerWidth,
                transition: theme.transitions.create(["margin", "width"], {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen
                })
            },
            menuButton: {
                marginRight: theme.spacing(2)
            },
            hide: {
                display: "none"
            },
            drawer: {
                width: drawerWidth,
                flexShrink: 0
            },
            drawerPaper: {
                width: drawerWidth
            },
            drawerHeader: {
                display: "flex",
                alignItems: "center",
                padding: theme.spacing(0, 1),
                // necessary for content to be below app bar
                ...theme.mixins.toolbar,
                justifyContent: "flex-end"
            },
            content: {
                flexGrow: 1,
                padding: theme.spacing(3),
                transition: theme.transitions.create("margin", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen
                }),
                marginLeft: -drawerWidth
            },
            contentShift: {
                transition: theme.transitions.create("margin", {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen
                }),
                marginLeft: 0
            }
        })
    )()
}

export const NavBar: FC = (props: PropsWithChildren<{}>) => {
    const classes = styles()
    const theme = useTheme()
    theme.palette = createPalette({primary: {main: "#880E4F"}})
    const [open, setOpen] = useState<boolean>(false)

    return (
        <div className={classes.root}>
            <CssBaseline/>
            <AppBar position="fixed" className={clsx(classes.appBar, {[classes.appBarShift]: open})}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={() => setOpen(true)}
                        edge="start"
                        className={clsx(classes.menuButton, open && classes.hide)}>
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h4" style={{flexGrow: 1}} align="center" noWrap>{AppName}</Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={open}
                classes={{paper: classes.drawerPaper}}>
                <div className={classes.drawerHeader}>
                    <IconButton onClick={() => {setOpen(false)}}>
                        {theme.direction === "ltr" ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
                    </IconButton>
                </div>
                <Divider/>
                <List>
                    <ListItem button key="Streams">
                        <ListItemIcon><ViewStream/></ListItemIcon>
                        <ListItemText primary="Streams"/>
                    </ListItem>
                    <ListItem button key="Settings">
                        <ListItemIcon><Settings/></ListItemIcon>
                        <ListItemText primary="Settings"/>
                    </ListItem>
                    <ListItem button key="About">
                        <ListItemIcon><Info/></ListItemIcon>
                        <ListItemText primary="About"/>
                    </ListItem>
                </List>
            </Drawer>
            <main className={clsx(classes.content, {[classes.contentShift]: open})}>
                <div className={classes.drawerHeader}/>
                {props.children}
            </main>
        </div>
    )
}