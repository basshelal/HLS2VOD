import React, {FC} from "react"
import {render} from "react-dom"
import {GlobalStyle} from "./ui/GlobalStyle"
import {NavBar} from "./ui/components/NavBar"
import {StreamsLayout} from "./ui/layouts/StreamsLayout"
import {Footer} from "./ui/components/Footer"
import {now} from "./utils/Utils"

interface ReactAppProps {
    message?: string
}

const ReactApp: FC<ReactAppProps> = (props) => {
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
render(<ReactApp message={now()}/>, mainElement)
