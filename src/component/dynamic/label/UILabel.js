import React from 'react';
import Base from '../Base';
import { getPreferredSize } from '../../helper/GetSizes';
import { RefContext } from '../../helper/Context';
import { getMargins, getAlignments } from '../ComponentProperties';

class UILabel extends Base {

    lblMargins;
    lblAlignments;
    lblFont;
    lblBackground;
    lblColor;

    constructor(props) {
        super(props);
        this.lblMargins = getMargins(props);
        this.lblAlignments = getAlignments(props);
        this.lblBackground = this.props.background;
        this.lblColor = this.props.foreground;
    }

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize({
                    id: this.props.id, 
                    preferredSize: this.props.preferredSize,
                    horizontalTextPosition: this.props.horizontalTextPosition,
                    minimumSize: this.props.minimumSize,
                    maximumSize: this.props.maximumSize
                }), 
                id: this.props.id, 
                parent: this.props.parent
            }
        );
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
UILabel.contextType = RefContext;
export default UILabel;