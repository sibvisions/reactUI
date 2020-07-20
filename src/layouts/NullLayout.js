import React, { Component } from 'react';
import { Size } from "../component/helper/Size";

class NullLayout extends Component {

    elements = [
        {
            left: 0,
            top: 0,
            text: "Label at 0:0",
            bgc: "red"
        },
        {
            left: 100,
            top: 0,
            text: "Label at 100:0",
            bgc: "blue"
        },
        {
            left: 0,
            top: 100,
            text: "Label at 0:100",
            bgc: "green"
        },
        {
            left: 100,
            top: 100,
            text: "Label at 100:100",
            bgc: "yellow"
        },
        {
            left: 500,
            top: 500,
            text: "Label at 500:500",
            bgc: "purple"
        }
    ]

    state = {
        content: []
    }

    componentDidMount() {
        this.fillContent(this.elements)
    }

    fillContent(subjects) {
        let tempContent = [];
        subjects.forEach(subject => {
            let element = 
            <div style={{
                position: "absolute",
                left: subject.left,
                top: subject.top,
                backgroundColor: subject.bgc}}>
                    {subject.text}
            </div>
            tempContent.push(element)
        })
        this.setState({content: tempContent})
    }

    render() {
        return (
            <div className="main" style={{position: "relative", width: '100%', height: '100%', overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout