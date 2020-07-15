import React, { Component } from 'react';
import { createButton, createPanel, createTable} from "../component/factories/CFactory";

class BorderLayout extends Component {

    elemNorth;
    elemWest;
    elemCenter;
    elemEast;
    elemSouth;

    constructElement() {
        this.props.childComponents.forEach(childComponent => {
            //this.getElementType(childComponent, this.getBorderArea(childComponent.elem.constraints))
        })
    }

    getBorderArea(constraints) {
        console.log(constraints)
        if (constraints === 'North') {
            return this.elemNorth;
        }
        else if (constraints === 'West') {
            return this.elemWest;
        }
        else if (constraints === 'Center') {
            return this.elemCenter;
        }
        else if (constraints === 'East') {
            return this.elemEast;
        }
        else if (constraints === 'South') {
            return this.elemSouth;
        }
    }

    getElementType(childComponent, area) {
        console.log(area)
        if(childComponent.name === "Panel") {
            area = createPanel(
                childComponent.id,
                childComponent.pid,
                childComponent.elem.name,
                childComponent.children,
                undefined,
                childComponent.elem.layout,
                childComponent.elem.layoutData,
                childComponent.elem.constraints
            )
        }
        else if (childComponent.name === "Table") {
            area = createTable(
                childComponent.id,
                childComponent.pid,
                childComponent.elem.columnLabels,
                childComponent.elem.columnNames,
                childComponent.elem.dataProvider,
                childComponent.elem.maximumSize
            )
        }
    }

    render() {
        if (!this.props.component) {
            console.log(this.props.childComponents)
        }
        else {
            console.log(this.props.component)
            this.elemCenter = this.props.component
        }
        return (
        <div className="p-grid p-nogutter borderlayout" style={{height:"100%", "flexFlow":"column", width:"100%", padding: '0', margin: '0'}}>
            <div className="p-col-12 north" style={{textAlign:"center", padding: '0'}}>
                {this.props.north}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto", padding: '0', margin: '0'}}>
                    {this.props.west}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%", padding: '0'}}>
                    {this.props.center}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto", padding: '0'}}>
                    {this.props.east}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center", padding: '0'}}>
                {this.props.south}
            </div>
        </div>);
    }
} 
export default BorderLayout;