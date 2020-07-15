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
        <div className="p-grid p-nogutter borderlayout" style={{height:"100%", "flexFlow":"column", width:"100%"}}>
            <div className="p-col-12 north" style={{textAlign:"center"}}>
                {this.elemNorth}
            </div>
            <div className="p-grid p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto"}}>
                    {this.elemWest}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%"}}>
                    {this.elemCenter}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto"}}>
                    {this.elemEast}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center"}}>
                {this.elemSouth}
            </div>
        </div>);
    }
} 
export default BorderLayout;