import React, { Component } from 'react';
import { Button } from "primereact/button";

class FlowLayout extends Component {

    content = []
    orientation;
    hAlignment;
    vAlignment;
    cAlignment;

    constructor(props) {
        super(props)
        this.wrapSubjects = this.wrapSubjects.bind(this)
    }

    translateString(orientation, alignments) {

        console.log(orientation[0])
        if (orientation[0] === '0') {
            this.orientation = 'row'
            console.log(this.orientation)
        }
        else {
            this.orientation = 'column'
        }

        this.setAlignments(0, alignments, this.hAlignment);
        this.setAlignments(1, alignments, this.vAlignment);
        this.setAlignments(2, alignments, this.cAlignment)
        console.log(this.hAlignment)
        console.log(this.vAlignment)
        console.log(this.cAlignment)
    }

    setAlignments(index, alignments, field) {
        if (alignments[index] === '0') {
            field = 'flex-start'
        }
        else if (alignments[index] === '1') {
            field = 'center'
        }
        else if (alignments[index] === '2') {
            if (field === this.hAlignment) field = 'right'
            else if(field === this.vAlignment) field = 'bottom'
        }
        else if (alignments[index] === '3') {
            field = 'stretch'
        }
        else {
            field = 'flex-start'
        }
    }

    wrapSubjects() {
        this.props.subjects.forEach(subject => {
            let x = <div style={{ alignSelf: this.cAlignment, marginRight: this.props.gaps[0] + 'px', marginBottom: this.props.gaps[1] }}>{subject}</div>
            this.content.push(x)
        })
        return this.content 
    }

    render() {
        console.log(this.props)
        this.translateString(this.props.orientation, this.props.alignments)
        return (
            <div style={{
                display: 'flex',
                flexDirection: this.orientation,
                justifyContent: this.hAlignment,
                alignItems: this.vAlignment,
                marginTop: this.props.margins[0],
                marginLeft: this.props.margins[1],
                marginBottom: this.props.margins[2],
                marginRight: this.props.margins[3],
                overflow: 'hidden'
                }}>
                    {this.wrapSubjects()}
            </div>
        )
    }
}
export default FlowLayout