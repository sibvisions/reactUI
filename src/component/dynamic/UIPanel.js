import React from 'react';
import Base from './Base';
import { Panel } from 'primereact/panel';
import FormLayout from '../../layouts/FormLayout'
import BorderLayout from '../../layouts/BorderLayout'
import './UIPanel.scss'


class UIPanel extends Base {

    insertLayout() {
        if (this.state.content !== undefined) {
            let margins = this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(0, 4)
            let gaps = this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(4, 6)
            gaps[1] = 10;
            switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
                case "FormLayout":
                        return <FormLayout layout={this.props.layout} layoutData={this.props.layoutData} subjects={this.state.content} margins={margins} gaps={gaps}/>;      
                case "BorderLayout":
                        return <BorderLayout subjects={this.state.content} margins={margins} gaps={gaps}/>;
                default: return null;
            }
        }
        
    }

    render() {
        return (
        <div className="p-col-12" style={{ height: '100%' }}>
            <Panel header={this.props.screenTitle} style={{textAlign: "center", height: '100%'}}>
                <div>
                    {this.insertLayout()}
                </div>
            </Panel>
        </div>
        );
    }
}
 
export default UIPanel;