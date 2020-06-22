import React from 'react';
import Base from './Base';

class NPanel extends Base {

    render() { 
        return ( 
        <div style={{marginLeft: "10px"}}>
            <h1>NPanel</h1>
            {this.state.content}
            
        </div> );
    }
}
 
export default NPanel;