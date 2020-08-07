import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";

class FlowLayout extends Component {

    state = {
        content: [this.props.subjects],
    };
    orientation;
    components = this.props.subjects;
    

    componentDidMount() {
        this.layoutContainer()
    }

    layoutContainer() {
        let tempContent = [];
        this.components.forEach(component => {
            if (this.props.isVisible(component)) {
                let preferredSize = this.props.getPreferredSize(component)
                let style={
                        height: preferredSize.height,
                        width: preferredSize.width,
                        alignSelf: this.props.alignments.cAlignment,
                        marginTop: this.props.gaps.verticalGap / 2,
                        marginLeft: this.props.gaps.horizontalGap / 2,
                        marginBottom: this.props.gaps.verticalGap / 2,
                        marginRight: this.props.gaps.horizontalGap / 2
                    }
                let clonedComponent = React.cloneElement(component, {style: {...component.props.style, ...style}})
                tempContent.push(clonedComponent)
            }
        })
        this.setState({content: tempContent})
    }

    render() {
        console.log(this.props)
        if (this.props.orientation === 'horizontal') {
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
                justifyContent: this.props.alignments.hAlignment,
                alignContent: this.props.alignments.vAlignment,
                height: 'calc(100% - ' + toPx((parseInt(this.props.margins.marginTop) + parseInt(this.props.margins.marginBottom))) + ')',
                width: 'calc(100% - ' + toPx((parseInt(this.props.margins.marginLeft) + parseInt(this.props.margins.marginRight))) + ')',
                marginTop: this.props.margins.marginTop,
                marginLeft: this.props.margins.marginLeft,
                marginBottom: this.props.margins.marginBottom,
                marginRight: this.props.margins.marginRight,
                }}>
                    {this.state.content}
            </div>
        )
    }
}
export default FlowLayout