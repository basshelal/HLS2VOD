import React, {FC, PropsWithChildren} from "react"
import {from} from "../../Utils"
import {StreamCardView} from "./StreamCardView"
import Container from "@material-ui/core/Container"

export interface StreamListProps {

}

export const StreamList: FC = (props: PropsWithChildren<StreamListProps>) => {
    return (
        <Container>
            {from(0).to(10).map((number: number) => (<StreamCardView/>))}
        </Container>
    )
}