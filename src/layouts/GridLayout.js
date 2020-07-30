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

    calculateSizes(fieldSize, components) {
        let tempContent = [];
        components.forEach(component => {
            let componentConstraints = new CellConstraints(component.props.constraints)
            let calculatedWidth = componentConstraints.gridWidth * (fieldSize.getWidth() - (this.props.gaps.getHorizontalGap()/componentConstraints.gridWidth - this.props.gaps.getHorizontalGap()/this.props.gridSize.getColumns()))
            let calculatedLeft = componentConstraints.gridX * (fieldSize.getWidth() - (this.props.gaps.getHorizontalGap() - this.props.gaps.getHorizontalGap()/this.props.gridSize.getColumns()) + this.props.gaps.getHorizontalGap())
            let calculatedHeight = componentConstraints.gridHeight * (fieldSize.getHeight() - (this.props.gaps.getVerticalGap()/componentConstraints.gridHeight - this.props.gaps.getVerticalGap()/this.props.gridSize.getRows()))
            let calculatedTop =  componentConstraints.gridY * (fieldSize.getHeight() - (this.props.gaps.getVerticalGap() - this.props.gaps.getVerticalGap()/this.props.gridSize.getRows()) + this.props.gaps.getVerticalGap())
            let gridElement =   <div style={{
                                    position: "absolute",
                                    height:  calculatedHeight,
                                    width:  calculatedWidth,
                                    top: calculatedTop,
                                    left: calculatedLeft}}>
                                    {component}
                                </div>
                        
            tempContent.push(gridElement);
        });
        this.setState({content: tempContent})
    }

    render() {
        window.onresize = () => {
            this.calculateSizes(this.fieldSize(this.props.gridSize.getColumns(), this.props.gridSize.getRows()), this.props.subjects)
        }
        return (
            <div className="gridlayout" style={{position: "relative", height: '100%'}}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout