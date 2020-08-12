import React from 'react';
import Base from '../Base';

class UILabel extends Base {
    render() { 
        return ( 
           <span id={this.props.id} style={this.props.style}>{this.props.text}: </span> 
        );
    }
}
export default UILabel;