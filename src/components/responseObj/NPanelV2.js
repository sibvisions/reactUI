import React from 'react';
import {Card} from 'primereact/card';
import BaseV2 from './BaseV2';

class NPanel extends BaseV2 {

    render() { 
        return (
        <div className="p-col-4">
            <Card>
                <h1>{this.props.id}</h1>
                {this.state.content}
            </Card>
        </div> 
         );
    }
}
 
export default NPanel;