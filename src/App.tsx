import React, {ReactElement} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import Greetings from "./ui/layouts/Greetings"
import StreamView from "./ui/components/StreamView"

function App(): ReactElement {
    return (
        <>
            <GlobalStyle/>
            <Greetings/>
            <StreamView/>
        </>
    )
}

const mainElement = document.createElement("div")
mainElement.setAttribute("id", "root")
document.body.appendChild(mainElement)
render(<App/>, mainElement)
