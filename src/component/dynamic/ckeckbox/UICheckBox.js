import React from 'react';
import Base from '../Base';

import {Checkbox} from 'primereact/checkbox';


class UICheckBox extends Base {

    render() { 
        return ( 
            <Checkbox id={this.props.data.id} style={this.props.style} checked={true} />
         );
    }
}
 
export default UICheckBox;