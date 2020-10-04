import React from 'react'

import {Container, Image, Text} from './styles'

export default function Greetings(): JSX.Element {
    return (
        <Container>
            <Image
                src="https://www.vectorlogo.zone/logos/reactjs/reactjs-icon.svg"
                alt="ReactJS logo"
            />
            <Text>TypeScript Electron & React ^_^</Text>
        </Container>
    )
}