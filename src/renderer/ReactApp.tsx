import React, {Component, ReactNode} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"
import {Footer} from "./ui/components/Footer"
import {AppContext, AppContextType, LayoutType} from "./ui/UICommons"
import {EditStreamScheduleLayout} from "./ui/layouts/EditStreamScheduleLayout"

interface AppState extends AppContextType {

}

class ReactApp extends Component<{}, AppState> {

    constructor(props: {}) {
        super(props)
        this.resolveLayout = this.resolveLayout.bind(this)
        this.state = {
            layout: "StreamsLayout",
            setLayout: (newLayout: LayoutType) => {
                this.setState({layout: newLayout})
                console.log(`Layout from inside ReactApp`)
                console.log(this.state.layout)
            }
        }
    }

    public resolveLayout(): ReactNode {
        const layout: LayoutType = this.state.layout
        console.log(`Layout from inside Resolve Layout`)
        console.log(layout)
        if (layout === "StreamsLayout") return (<StreamsLayout/>)
        else if (layout === "EditStreamScheduleLayout") return (<EditStreamScheduleLayout/>)
        else return null
    }

    public render(): ReactNode {
        return (
            <>
                <AppContext.Provider value={this.state}>
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
