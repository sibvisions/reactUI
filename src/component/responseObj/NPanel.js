import React from 'react';
import {Card} from 'primereact/card';
import Base from './Base';

class NPanel extends Base {

    render() { 
        return (
        <div className="p-col-12" style={{height: '100%'}}>
            <Card style={{height: '100%'}}>
                <h1>{this.props.screenTitle}</h1>
                {this.state.content}
            </Card>
        </div> 
         );
    }
}
 
export default NPanel;