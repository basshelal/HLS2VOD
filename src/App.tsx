import React, {ReactElement} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"

function App(): ReactElement {
    return (
        <>
            <GlobalStyle/>
            <NavBar>
                <StreamsLayout/>
            </NavBar>
        </>
    )
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<App/>, mainElement)
