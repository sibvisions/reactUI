import React from 'react';
import Base from '../Base';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';

class UILabel extends Base {
    render() {
        let alignments = mapFlex(checkAlignments(this.props));
        return ( 
           <span id={this.props.id} style={{...this.props.layoutStyle, display: 'inline-flex', justifyContent: alignments.ha, alignContent: alignments.va}} >{this.props.text}</span> 
        );
    }
}
export default UILabel;