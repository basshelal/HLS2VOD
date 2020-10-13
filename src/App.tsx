import React, {ReactElement} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import Greetings from "./ui/layouts/Greetings"
import StreamCardView from "./ui/components/StreamCardView"
import NavBar from "./ui/components/NavBar"

function App(): ReactElement {
    return (
        <>
            <GlobalStyle/>
            <Greetings/>
            <NavBar/>
            <StreamCardView/>
        </>
    )
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<App/>, mainElement)
