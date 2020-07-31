import React from 'react';
import Base from './Base';

class UILabel extends Base {
    render() { 
        return ( 
           <span 
                id={this.props.data.id} 
                style={this.state.style} 
            >
                {this.props.data.text}: 
            </span> 
        );
    }
}
export default UILabel;