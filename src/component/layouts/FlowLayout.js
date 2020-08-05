import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";

class FlowLayout extends Component {

    state = {
        content: [this.props.subjects],
    };
    orientation;
    components = this.props.subjects;
    

    componentDidMount() {
        this.buildComponents()
    }

    buildComponents() {
        let tempContent = [];
        this.components.forEach(component => {
            let preferredSize = this.props.getPreferredSize(component)
            let style={
                    height: preferredSize.getHeight(),
                    width: preferredSize.getWidth(),
                    alignSelf: this.props.alignments.getCAlignment(),
                    marginTop: this.props.gaps.getVerticalGap()/2,
                    marginLeft: this.props.gaps.getHorizontalGap()/2,
                    marginBottom: this.props.gaps.getVerticalGap()/2,
                    marginRight: this.props.gaps.getHorizontalGap()/2
                }
            let clonedComponent = React.cloneElement(component, {style: {...component.props.style, ...style}})
            tempContent.push(clonedComponent)
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
                height: 'calc(100% - ' + toPx((parseInt(this.props.margins.getMarginTop()) + parseInt(this.props.margins.getMarginBottom()))) + ')',
                width: 'calc(100% - ' + toPx((parseInt(this.props.margins.getMarginLeft()) + parseInt(this.props.margins.getMarginRight()))) + ')',
                marginTop: this.props.margins.getMarginTop(),
                marginLeft: this.props.margins.getMarginLeft(),
                marginBottom: this.props.margins.getMarginBottom(),
                marginRight: this.props.margins.getMarginRight(),
                }}>
                    {this.state.content}
            </div>
        )
    }
}
export default FlowLayout