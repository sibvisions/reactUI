import React, { Component } from 'react';
import { Size } from '../../component/helper/Size';
import { CellConstraints } from './layoutObj/CellConstraints';

class GridLayout extends Component {

    state = {
        content: []
    }
    
    
    componentDidMount() { 
        this.calculateSizes(this.fieldSize(this.props.gridSize.columns, this.props.gridSize.rows), this.props.subjects)
    }

    componentWillUnmount() {
        window.onresize = null;
    }

    fieldSize(columns, rows){
        let size = this.props.getPreferredSize(this.props.component);
        let margins = this.props.margins
        size.width -= margins.marginLeft + margins.marginRight;
        size.height -= margins.marginTop + margins.marginBottom;
        let fieldSize = new Size(size.width/columns, size.height/rows);
        return fieldSize;
    }

    calculateSizes(fieldSize, components) {
        let tempContent = [];
        components.forEach(component => {
            let componentConstraints = new CellConstraints(component.props.data.constraints)
            let calculatedWidth = componentConstraints.gridWidth * (fieldSize.width - (this.props.gaps.horizontalGap / componentConstraints.gridWidth - this.props.gaps.horizontalGap / this.props.gridSize.columns))
            let calculatedLeft = componentConstraints.gridX * (fieldSize.width - (this.props.gaps.horizontalGap - this.props.gaps.horizontalGap / this.props.gridSize.columns) + this.props.gaps.horizontalGap)
            let calculatedHeight = componentConstraints.gridHeight * (fieldSize.height - (this.props.gaps.verticalGap / componentConstraints.gridHeight - this.props.gaps.verticalGap / this.props.gridSize.rows))
            let calculatedTop = componentConstraints.gridY * (fieldSize.height - (this.props.gaps.verticalGap - this.props.gaps.verticalGap / this.props.gridSize.rows) + this.props.gaps.verticalGap)
            let style = {
                position: "absolute",
                height: calculatedHeight,
                width: calculatedWidth,
                top: calculatedTop,
                left: calculatedLeft
            }
            let clonedComponent = React.cloneElement(component, { style: { ...component.props.style, ...style } })
            tempContent.push(clonedComponent);
        });
        this.setState({ content: tempContent })
    }

    render() {
        window.onresize = () => {
            this.calculateSizes(this.fieldSize(this.props.gridSize.columns, this.props.gridSize.rows), this.props.subjects)
        }
        return (
            <div className="gridlayout" style={{
                position: "relative",
                height: this.props.getPreferredSize(this.props.component).height - (this.props.margins.marginTop + this.props.margins.marginBottom),
                width: this.props.getPreferredSize(this.props.component).width - (this.props.margins.marginLeft + this.props.margins.marginRight)
            }}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout