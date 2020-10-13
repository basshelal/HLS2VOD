import React, {ReactElement} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import Greetings from "./ui/layouts/Greetings"
import {NavBar} from "./ui/components/NavBar"
import {StreamCardView} from "./ui/components/StreamCardView"

function App(): ReactElement {
    return (
        <>
            <GlobalStyle/>
            <NavBar>
                <Greetings/>
                <StreamCardView/>
            </NavBar>
        </>
    )
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<App/>, mainElement)
