import React, {FC} from "react"

const footerHeight = 60
const footerPadding = 2

export const Footer: FC = (props) => {
    return (
        <div>
            {/* Empty gap */}
            <div style={{
                display: "block",
                padding: `${footerPadding}px`,
                height: `${footerHeight}px`,
                width: "100%"
            }}/>
            {/*Actual Footer*/}
            <div style={{
                backgroundColor: "#880E4F",
                fontSize: "20px",
                color: "white",
                borderTop: "1px solid #E7E7E7",
                textAlign: "center",
                padding: `${footerPadding}px`,
                position: "fixed",
                left: "0",
                bottom: "0",
                height: `${footerHeight}px`,
                width: "100%"
            }}>{props.children}
            </div>
        </div>
    )
}