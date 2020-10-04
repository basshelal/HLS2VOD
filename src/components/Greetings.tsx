import React from 'react'

import styled, {keyframes} from 'styled-components'
import {from} from "../Utils";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Container = styled.div`
    height: 100vh;
    padding: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

const Image = styled.img`
    width: 300px;
    animation: ${rotate} 15s linear infinite;
    opacity: 0.1;
`
const Text = styled.p`
    margin-top: 35px;
    font-size: 20px;
    font-weight: bold;
`

export default function (): JSX.Element {
    return (
        <Container>
            <Image
                src="https://www.vectorlogo.zone/logos/reactjs/reactjs-icon.svg"
                alt="ReactJS logo"
            />
            <Text>TypeScript Electron & React ^_^</Text>
            <p>{from(0).to(100).map(i => `${i}, `)}</p>
        </Container>
    )
}