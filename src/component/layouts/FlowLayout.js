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
                height: 'calc(100% - ' + (parseInt(this.props.margins.getMarginTop()) + parseInt(this.props.margins.getMarginBottom())) + 'px)' ,
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