import React, {ReactElement} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"
import {Footer} from "./ui/components/Footer"

function App(): ReactElement {
    return (
        <>
            <GlobalStyle/>
            <NavBar>
                <StreamsLayout/>
            </NavBar>
            <Footer/>
        </>
    )
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<App/>, mainElement)
