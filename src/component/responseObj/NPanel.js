import React, { Component } from 'react';
import {Card} from 'primereact/card';
import {withContentChanges} from './withContentChanges'

class NPanel extends Component {

    render() {
        console.log(this.props)
        return (
        <div className="p-col-12" style={{height: '100%', padding: '0'}}>
            <Card style={{height: '100%'}}>
                <h1>{this.props.screenTitle}</h1>
                {this.props.content}
            </Card>
        </div> 
         );
    }
}
 
export default withContentChanges(NPanel);