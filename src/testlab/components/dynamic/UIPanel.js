import React from 'react';
import Base from './Base';

class UIPanel extends Base {
    render() { 
        return ( 
        <div>
            {this.props.id}
            {this.state.content}
        </div> );
    }
}
 
export default UIPanel;