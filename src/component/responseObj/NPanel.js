import React from 'react';
import {Card} from 'primereact/card';
import Base from './Base';

class NPanel extends Base {

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