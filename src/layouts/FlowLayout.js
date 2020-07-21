import React, { Component } from 'react';
import { toPx } from "../component/helper/ToPx";

class FlowLayout extends Component {

    content = [];
    orientation;

    wrapSubjects() {
        this.props.subjects.forEach(subject => {
            var flowElement =   <div style={{ 
                                    alignSelf: this.props.alignments.getCAlignment(),
                                    marginTop: toPx(this.props.gaps.getVerticalGap()/2),
                                    marginLeft: toPx(this.props.gaps.getHorizontalGap()/2),
                                    marginBottom: toPx(this.props.gaps.getVerticalGap()/2),
                                    marginRight: toPx(this.props.gaps.getHorizontalGap()/2)}}>
                                        {subject}
                                </div>
            this.content.push(flowElement)
        })
        return this.content 
    }

    render() {
        console.log(this.props)
        if (this.props.orientation.getOrientation() === 'horizontal') {
            this.orientation = 'row'
        } 
        else {
            this.orientation = 'column'
        }
        return (
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: this.orientation,
                justifyContent: this.props.alignments.getHAlignment(),
                alignContent: this.props.alignments.getVAlignment(),
                marginTop: toPx(this.props.margins.getMarginTop()),
                marginLeft: toPx(this.props.margins.getMarginLeft()),
                marginBottom: toPx(this.props.margins.getMarginBottom()),
                marginRight: toPx(this.props.margins.getMarginRight()),
                }}>
                    {this.wrapSubjects()}
            </div>
        )
    }
}
export default FlowLayout