import React from 'react';
import Base from './Base';
import { Card } from "primereact/card";


class UIPanel extends Base {
    render() { 
        return ( 
        <Card style= {{textAlign: "center", width: '100%'}}>
            <h3>{this.props.id}</h3>
            <div>
                {this.state.content}
            </div>
        </Card> );
    }
}
 
export default UIPanel;