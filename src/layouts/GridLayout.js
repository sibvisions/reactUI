import React, { Component } from 'react';
import { Size } from '../component/helper/Size';
import { CellConstraints } from './layoutObj/CellConstraints';

class GridLayout extends Component {

    state = {
        content: []
    }
    
    
    componentDidMount() { 
        this.calculateSizes(this.fieldSize(this.props.gridSize.getColumns(), this.props.gridSize.getRows()), this.props.subjects)
    }

    fieldSize(columns, rows){
        let divSize = new Size(document.getElementsByClassName("gridlayout")[0].clientWidth, document.getElementsByClassName("gridlayout")[0].clientHeight, undefined);
        let fieldSize = new Size(divSize.getWidth()/columns, divSize.getHeight()/rows);
        return fieldSize;
    }

    calculateSizes(fieldSize, subjects) {
        let tempContent = [];
        subjects.forEach(subject => {
            console.log(subject)
            let subjectConstraints = new CellConstraints(subject.props.constraints)
            let calculatedWidth = subjectConstraints.gridWidth * (fieldSize.getWidth() - (this.props.gaps.getHorizontalGap()/subjectConstraints.gridWidth - this.props.gaps.getHorizontalGap()/this.props.gridSize.getColumns()))
            let calculatedHeight = subjectConstraints.gridHeight * (fieldSize.getHeight() - (this.props.gaps.getVerticalGap()/subjectConstraints.gridHeight - this.props.gaps.getVerticalGap()/this.props.gridSize.getRows()))
            let gridElement =   <div style={{
                                        position: "absolute",
                                        height: calculatedHeight,
                                        top: (calculatedHeight + this.props.gaps.getVerticalGap())*subjectConstraints.gridY,
                                        width: calculatedWidth,
                                        left: (calculatedWidth + this.props.gaps.getHorizontalGap())*subjectConstraints.gridX}}>
                                    {subject}
                                </div>
                        
            tempContent.push(gridElement);
        });
        this.setState({content: tempContent})
    }

    render() {
        console.log(this.props.gaps.getVerticalGap())
        window.onresize = () => {
            this.calculateSizes(this.fieldSize(this.props.gridSize.getColumns(), this.props.gridSize.getRows()), this.props.subjects)
        }
        return (
            <div className="gridlayout" style={{position: "relative", width: '100%', height: '100%'}}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout