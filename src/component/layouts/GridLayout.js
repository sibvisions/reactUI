import React, { Component } from 'react';
import { Size } from '../../component/helper/Size';
import { CellConstraints } from './layoutObj/CellConstraints';
import { getPreferredSize } from '../helper/GetSizes';

class GridLayout extends Component {

    preferredHeight;
    preferredWidth;
    components = this.props.subjects;

    state = {
        content: [this.components]
    }
    constructor(props) {
        super(props)
        this.handleCalculations = this.handleCalculations.bind(this)
    }
    
    componentDidMount() {
        console.log('mounted')
        this.calculateLayoutSize();
        this.calculateGridComponents(this.fieldSize(this.props.gridSize.columns, this.props.gridSize.rows), this.components);
        window.addEventListener("resize", this.handleCalculations)
        
    }

    componentWillUnmount() {
        console.log('unmounted')
        window.removeEventListener("resize", this.handleCalculations);
    }

    handleCalculations() {
        this.calculateLayoutSize();
        this.calculateGridComponents(this.fieldSize(this.props.gridSize.columns, this.props.gridSize.rows), this.components);
    }

    calculateLayoutSize() {
        if (this.props.constraints === "Center" || this.props.constraints === undefined) {
            let margins = this.props.margins
            this.preferredWidth = document.getElementById(this.props.id).parentElement.clientWidth - (margins.marginLeft + margins.marginRight);
            this.preferredHeight = document.getElementById(this.props.id).parentElement.clientHeight - (margins.marginTop + margins.marginBottom);
        }
        else {
            let widest = 0;
            let highest = 0;
            this.components.forEach(component => {
                let componentConstraints = new CellConstraints(component.props.constraints)
                let prefSize = getPreferredSize(component.props);
                let widthOneField = Math.ceil(prefSize.width / componentConstraints.gridWidth)
                let heightOneField = Math.ceil(prefSize.height / componentConstraints.gridHeight)
                if (widthOneField > widest) {
                    widest = widthOneField;
                }
                if (heightOneField > highest) {
                    highest = heightOneField
                }
            });
            let margins = this.props.margins
            this.preferredWidth = widest * this.props.gridSize.columns - (margins.marginLeft + margins.marginRight);
            this.preferredHeight = highest * this.props.gridSize.rows - (margins.marginTop + margins.marginBottom);
        }
        //console.log(this.preferredWidth, this.preferredHeight);
    }

    fieldSize(columns, rows){
        return new Size(this.preferredWidth/columns, this.preferredHeight/rows);
    }

    calculateGridComponents(fieldSize, components) {
        let tempContent = [];
        components.forEach(component => {
            if (component.props.visible === undefined || component.props.visible) {
                let componentConstraints = new CellConstraints(component.props.constraints)
                let calculatedWidth = componentConstraints.gridWidth * (fieldSize.width - (this.props.gaps.horizontalGap / componentConstraints.gridWidth - this.props.gaps.horizontalGap / this.props.gridSize.columns))
                let calculatedLeft = componentConstraints.gridX * (fieldSize.width - (this.props.gaps.horizontalGap - this.props.gaps.horizontalGap / this.props.gridSize.columns) + this.props.gaps.horizontalGap)
                let calculatedHeight = componentConstraints.gridHeight * (fieldSize.height - (this.props.gaps.verticalGap / componentConstraints.gridHeight - this.props.gaps.verticalGap / this.props.gridSize.rows))
                let calculatedTop = componentConstraints.gridY * (fieldSize.height - (this.props.gaps.verticalGap - this.props.gaps.verticalGap / this.props.gridSize.rows) + this.props.gaps.verticalGap)
                let layoutStyle = {
                    position: "absolute",
                    height: calculatedHeight,
                    width: calculatedWidth,
                    top: calculatedTop,
                    left: calculatedLeft
                }
                let clonedComponent = React.cloneElement(component, { layoutStyle: { ...layoutStyle } })
                tempContent.push(clonedComponent);
            }
            
        });
        this.setState({ content: tempContent })
    }

    render() {
        return (
            <div className="gridlayout" style={{
                position: "relative",
                height: this.preferredHeight,
                width: this.preferredWidth,
                marginTop: this.props.margins.marginTop,
                marginLeft: this.props.margins.marginLeft,
                //marginBottom: this.props.margins.marginBottom,
                //marginRight: this.props.margins.marginRight
            }}>
                {this.state.content}
            </div>
        )
    }
}
export default GridLayout