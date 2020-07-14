import React from 'react';
import { Panel } from 'primereact/panel';
import Base from './Base';
import FormLayout from '../../layouts/FormLayout'
import BorderLayout from '../../layouts/BorderLayout'
import {createTable} from "../factories/CFactory";

class NPanel extends Base {

    insertLayout() {
        switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
            case "FormLayout": return <FormLayout layout={this.props.layout} layoutData={this.props.layoutData} children={this.props.children}/>;
            case "BorderLayout":
                let elemNorth
                let elemWest
                let elemCenter
                let elemEast
                let elemSouth
                if(this.state.content.length === 0) {
                    console.log(this.props)
                    this.props.children.forEach(childComponent => {
                        if(childComponent.elem.constraints === "North") {
                            elemNorth = childComponent
                        }
                        else if(childComponent.elem.constraints === "Center") {
                            elemCenter = childComponent
                        }
                    })
                    console.log(elemCenter)
                    return <BorderLayout {...elemNorth} {...elemCenter}/>
                }
                this.state.content.forEach(elem => {
                    console.log(elem)
                    if(elem.props.children !== undefined)
                    console.log(elem.props.children)
                    //return <BorderLayout center={table}/>
                });
            default: return null;
        }
    }

    render() {
        console.log(this.state.content)
        return (
            <div className="p-col-12" style={{ height: '100%' }}>
                <Panel header={this.props.screenTitle} style={{ height: '100%' }}>
                    {this.insertLayout()}
                    {this.state.content}
                </Panel>
            </div>
        );
    }
}
export default NPanel;