import React from 'react';
import { Panel } from 'primereact/panel';
import Base from './Base';
import './NPanel.scss'
import FormLayout from '../../layouts/FormLayout'
import BorderLayout from '../../layouts/BorderLayout'
import {createTable} from "../factories/CFactory";

class NPanel extends Base {

    insertLayout() {
        switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
            case "FormLayout": return <FormLayout layout={this.props.layout} layoutData={this.props.layoutData} children={this.props.children}/>;
            case "BorderLayout":
                if(this.state.content.length !== 0) {
                    console.log('yo')
                    return <BorderLayout childComponents={this.state.content}/>;
                }
            default: return null;
        }
    }

    render() {
        console.log(this.state.content)
        return (
            <div className="p-col-12" style={{ height: '100%' }}>
                <Panel header={this.props.screenTitle} style={{ height: '100%' }}>
                    {this.insertLayout()}
                    {/* {this.state.content} */}
                </Panel>
            </div>
        );
    }
}
export default NPanel;