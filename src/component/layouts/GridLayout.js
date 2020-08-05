import React, { Component } from 'react';
import { Size } from '../../component/helper/Size';
import { CellConstraints } from './layoutObj/CellConstraints';

class GridLayout extends Component {

    state = {
        content: []
    }
    
    
    componentDidMount() { 
        this.calculateSizes(this.fieldSize(this.props.gridSize.getColumns(), this.props.gridSize.getRows()), this.props.subjects)
    }

    fieldSize(columns, rows){
        let size = this.props.getPreferredSize(this.props.component);
        let margins = this.props.margins
        size.width -= margins.getMarginLeft() + margins.getMarginRight();
        size.height -= margins.getMarginTop() + margins.getMarginBottom();
        let fieldSize = new Size(size.getWidth()/columns, size.getHeight()/rows);
        return fieldSize;
    }

    calculateSizes(fieldSize, components) {
        let tempContent = [];
        components.forEach(component => {
            let componentConstraints = new CellConstraints(component.props.data.constraints)
            let calculatedWidth = componentConstraints.gridWidth * (fieldSize.getWidth() - (this.props.gaps.getHorizontalGap()/componentConstraints.gridWidth - this.props.gaps.getHorizontalGap()/this.props.gridSize.getColumns()))
            let calculatedLeft = componentConstraints.gridX * (fieldSize.getWidth() - (this.props.gaps.getHorizontalGap() - this.props.gaps.getHorizontalGap()/this.props.gridSize.getColumns()) + this.props.gaps.getHorizontalGap())
            let calculatedHeight = componentConstraints.gridHeight * (fieldSize.getHeight() - (this.props.gaps.getVerticalGap()/componentConstraints.gridHeight - this.props.gaps.getVerticalGap()/this.props.gridSize.getRows()))
            let calculatedTop =  componentConstraints.gridY * (fieldSize.getHeight() - (this.props.gaps.getVerticalGap() - this.props.gaps.getVerticalGap()/this.props.gridSize.getRows()) + this.props.gaps.getVerticalGap())
            let style = {
                    position: "absolute",
                    height:  calculatedHeight,
                    width:  calculatedWidth,
                    top: calculatedTop,
                    left: calculatedLeft
                }
            let clonedComponent = React.cloneElement(component, {style: {...component.props.style, ...style}})
            tempContent.push(clonedComponent);
        });
        this.setState({content: tempContent})
    }

    render() {
        window.onresize = () => {
            this.calculateSizes(this.fieldSize(this.props.gridSize.getColumns(), this.props.gridSize.getRows()), this.props.subjects)
        }
        return (
            <div className="gridlayout" style={{position: "relative", height: this.props.getPreferredSize(this.props.component)}}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout