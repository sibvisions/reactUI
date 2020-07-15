import React, { Component } from 'react';
import Base from './Base';

class UILabel extends Base {
    state = {  }
    render() { 
        return ( 
           <span>{this.props.text}: </span>    
        );
    }
}
export default UILabel;