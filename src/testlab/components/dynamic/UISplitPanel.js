import React, { Component } from 'react';
import Split from 'react-split/'
import Base from './Base';

class UISplitPanel extends Base {
    state = {  }
    render() { 
        console.log(<Split />)
        return ( 
            <Split 
            sizes={[25, 75]}
            minSize={[2000, 2000]}
            expandToMin={true}
            gutterSize={10}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
            style= {{height: "100%"}}>
            
            <h1>adasd</h1>
            <h1>dasdas</h1>
               
            </Split>    
        );
    }
}
 
export default UISplitPanel;