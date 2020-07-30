import React from 'react';
import Base from './Base';

class UILabel extends Base {
    state = {  }
    render() { 
        return ( 
           <h3>{this.props.text}: </h3>    
        );
    }
}
export default UILabel;