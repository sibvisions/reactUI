import React from 'react';
import Base from './Base';
import {Card} from 'primereact/card';

class NPanel extends Base {

    state= {content: []};
    
    render() { 
        return (
        <div className="p-col-4">
            <Card>
                <h1>NPanel</h1>
                {this.state.content}
            </Card>
        </div> 
         );
    }
}
 
export default NPanel;