import React, {Component, ReactNode} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"
import {Footer} from "./ui/components/Footer"
import {AppContext, AppContextType, LayoutType} from "./ui/UICommons"

interface AppState {
    appContext: AppContextType
}


class ReactApp extends Component<{}, AppState> {

    constructor(props: {}) {
        super(props)
        this.state = {
            appContext: {
                layout: "StreamsLayout",
                setLayout(newLayout: LayoutType): void { this.layout = newLayout }
            }
        }
    }

    public render(): ReactNode {
        return (
            <>
                <AppContext.Provider value={this.state.appContext}>
                    <GlobalStyle/>
                    <NavBar>
                        <StreamsLayout/>
                    </NavBar>
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
