import React, { Component } from 'react';
import { Button } from "primereact/button";

class FlowLayout extends Component {
    buttons = [
        <Button style={{width: '300px'}} label="Button"/>,
        <Button style={{width: '300px'}} label="Button"/>,
        <Button style={{width: '300px'}} label="Button"/>,
        <Button style={{width: '300px'}} label="Button"/>,
        <Button style={{width: '300px'}} label="Button"/>
    ]

    content = []

    constructor(props) {
        super(props)
        this.wrapSubjects = this.wrapSubjects.bind(this)
    }

    wrapSubjects() {
        this.buttons.forEach(btn => {
            let x = <div style={{ marginRight: '10px', marginBottom: '10px' }}>{btn}</div>
            this.content.push(x)
        })
        return this.content 
    }

    render() {
        return (
            <div style={{display: 'flex', marginLeft: '50px', marginRight: '50px', alignItems: 'center', overflow: 'hidden', flexWrap: 'wrap'}}>
                    {this.wrapSubjects()}
            </div>
        )
    }
}
export default FlowLayout