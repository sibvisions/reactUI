import React from 'react';
import { Card } from 'primereact/card';
import Base from './Base';
import FormLayout from '../../layouts/FormLayout'

class NPanel extends Base {

    insertLayout() {
        switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
            case "FormLayout": return <FormLayout layout={this.props.layout} layoutData={this.props.layoutData} childComponents={this.props.childComponents}/>;
            default: return null;
        }
    }

    render() {
        return (
            <div className="p-col-12" style={{ height: '100%' }}>
                <Card style={{ height: '100%' }}>
                    <h1>{this.props.screenTitle}</h1>
                    {this.insertLayout()}
                    {this.state.content}
                </Card>
            </div>
        );
    }
}
export default NPanel;