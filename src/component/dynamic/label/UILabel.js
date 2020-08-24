import React from 'react';
import Base from '../Base';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';

class UILabel extends Base {

    lblMargins;
    lblAlignments;
    lblFont;
    lblBackground;
    lblColor;

    constructor(props) {
        super(props);
        this.lblMargins = this.getMargins();
        this.lblAlignments = this.getAlignments();
        this.lblBackground = this.props.background;
        this.lblColor = this.props.foreground;
    }

    render() {
        return ( 
           <span id={this.props.id} style={{
               ...this.props.layoutStyle,
               display: 'inline-flex', 
               justifyContent: this.lblAlignments.ha,
               alignContent: this.lblAlignments.va,
               background: this.lblBackground,
               color: this.lblColor,
               paddingTop: this.lblMargins.marginTop,
               paddingLeft: this.lblMargins.marginLeft,
               paddingBottom: this.lblMargins.marginBottom,
               paddingRight: this.lblMargins.marginRight
            }}>{this.props.text}</span> 
        );
    }
}
export default UILabel;