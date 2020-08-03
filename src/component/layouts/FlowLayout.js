import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";

class FlowLayout extends Component {

    state = {
        content: [this.props.subjects],
        preferredWidth: 0,
        preferredHeight: 0
    }
    orientation;
    

    componentDidMount() {
        this.wrapSubjects()
        this.calculateSizes()
    }

    wrapSubjects() {
        let tempContent = [];
        this.props.subjects.forEach(subject => {
            let preferredSize = this.props.getPreferredSize(subject)
            var flowElement =   <div style={{
                                    height: preferredSize.getHeight(),
                                    width: preferredSize.getWidth(),
                                    alignSelf: this.props.alignments.getCAlignment(),
                                    marginTop: toPx(this.props.gaps.getVerticalGap()/2),
                                    marginLeft: toPx(this.props.gaps.getHorizontalGap()/2),
                                    marginBottom: toPx(this.props.gaps.getVerticalGap()/2),
                                    marginRight: toPx(this.props.gaps.getHorizontalGap()/2)}}>
                                        {subject}
                                </div>
            tempContent.push(flowElement)
        })
        this.setState({content: tempContent})
    }

    calculateSizes() {
        let size = this.props.getPreferredSize(this.props.component);
        let preferredWidth = size.getWidth() - this.props.margins.getMarginLeft() - this.props.margins.getMarginRight();
        let preferredHeight = size.getHeight() - this.props.margins.getMarginTop() - this.props.margins.getMarginLeft();
        this.setState({preferredWidth: preferredWidth, preferredHeight: preferredHeight})
    }

    render() {
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
                height: this.state.preferredHeight,
                width: this.state.preferredWidth,
                marginTop: toPx(this.props.margins.getMarginTop()),
                marginLeft: toPx(this.props.margins.getMarginLeft()),
                marginBottom: toPx(this.props.margins.getMarginBottom()),
                marginRight: toPx(this.props.margins.getMarginRight()),
                }}>
                    {this.state.content}
            </div>
        )
    }
}
export default FlowLayout