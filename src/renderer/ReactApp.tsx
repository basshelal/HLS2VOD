import React, {Component, ReactNode} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"
import {Footer} from "./ui/components/Footer"
import {AppContext, AppContextType, LayoutType, SomeAppContextType} from "./ui/UICommons"
import {EditStreamScheduleLayout} from "./ui/layouts/EditStreamScheduleLayout"

interface AppState {
    appContext: AppContextType
}

class ReactApp extends Component<{}, AppState> {

    constructor(props: {}) {
        super(props)
        this.setAppContext = this.setAppContext.bind(this)
        this.resolveLayout = this.resolveLayout.bind(this)
        this.state = {
            appContext: {
                layout: "StreamsLayout",
                setLayout: (newLayout: LayoutType) => {
                    this.setAppContext({layout: newLayout})
                    console.log(`Layout from inside ReactApp`)
                    console.log(this.state.appContext.layout)
                }
            }
        }
    }

    public setAppContext(appContext: SomeAppContextType) {
        this.setState((prevState: AppState) => ({
                appContext: {
                    layout: appContext.layout ? appContext.layout : prevState.appContext.layout,
                    setLayout: appContext.setLayout ? appContext.setLayout : prevState.appContext.setLayout
                }
            })
        )
    }

    public resolveLayout(): ReactNode {
        const layout: LayoutType = this.state.appContext.layout
        console.log(`Layout from inside Resolve Layout`)
        console.log(layout)
        if (layout === "StreamsLayout") return (<StreamsLayout/>)
        else if (layout === "EditStreamScheduleLayout") return (<EditStreamScheduleLayout/>)
        else return null
    }

    public render(): ReactNode {
        return (
            <>
                <AppContext.Provider value={this.state.appContext}>
                    <GlobalStyle/>
                    <NavBar>{this.resolveLayout()}</NavBar>
                    <Footer/>
                </AppContext.Provider>
            </>
        )
    }
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<ReactApp/>, mainElement)
