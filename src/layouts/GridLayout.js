import React, { Component } from 'react';
import { Size } from '../component/helper/Size';

class GridLayout extends Component {

    elements = [
        {
            column: 0,
            row: 0,
            bgc: "red"
        },
        {
            column: 1,
            row: 0,
            bgc: "blue"
        },
        {
            column: 2,
            row: 0,
            width: 1,
            height: 2,
            bgc: "green"
        },
        {
            column: 0,
            row: 1,
            width: 2,
            height: 1,
            bgc: "yellow"
        },
        {
            column: 0,
            row: 2,
            width: 3,
            height: 1,
            bgc: "purple"
        }
    ]

    gridSize = {
        columns: 3,
        rows: 3
    }

    gaps = {
        horizontal: 5,
        vertical: 5
    }

    state = {
        content: []
    }
    
    componentDidMount() {
        let fieldSize = this.fieldSize(this.gridSize.columns, this.gridSize.rows)
        this.calculateSizes(fieldSize, this.elements)
    }

    fieldSize(columns, rows){
        let divSize = new Size(document.getElementsByClassName("main")[0].clientWidth, document.getElementsByClassName("main")[0].clientHeight, undefined);
        let fieldSize = new Size(divSize.getWidth()/columns, divSize.getHeight()/rows);
        return fieldSize;
    }

    calculateSizes(fieldSize, subjects) {
        let tempContent = [];

        subjects.forEach(subject => {
            let addLeft = 0;
            let addTop = 0;
            
            if (subject.width === undefined) {
                subject.width = 1;
            }
            if (subject.height === undefined) {
                subject.height = 1;
            }

            let x = <div style={{position: "absolute", top: subject.row * fieldSize.getHeight(), left: (subject.column * (fieldSize.getWidth()-this.gaps.horizontal)) + (this.gaps.horizontal*subject.column),
                                 width: (subject.width * fieldSize.getWidth()) - this.gaps.horizontal/this.gridSize.columns, height: (subject.height * fieldSize.getHeight()) - this.gaps.vertical,
                                 backgroundColor: subject.bgc}}/>;
            tempContent.push(x);
        });
        this.setState({content: tempContent});
    }


    render() {
        window.onresize = () => {
            let fieldSize = this.fieldSize(3, 3)
            this.calculateSizes(fieldSize, this.elements)
        }
        return (
            <div className="main" style={{position: "relative", width: '100%', height: '100%'}}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout