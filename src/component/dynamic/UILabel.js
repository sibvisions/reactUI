import React from 'react';
import Base from './Base';

class UILabel extends Base {
    render() { 
        return ( 
           <span id={this.props.id} ref={ref => this.compRef = ref} >{this.props.text}: </span> 
        );
    }
}
export default UILabel;