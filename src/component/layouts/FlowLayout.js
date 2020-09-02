import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";
import { getPreferredSize } from '../helper/GetSizes';

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
            if (component.props.visible === undefined || component.props.visible) {
                let preferredSize = getPreferredSize({
                    id: component.props.id, 
                    preferredSize: component.props.preferredSize, 
                    horizontalTextPosition: component.props.horizontalTextPosition,
                    minimumSize: component.props.minimumSize,
                    maximumSize: component.props.maximumSize
                });
                let style={
                        height: preferredSize.height,
                        width: preferredSize.width,
                        alignSelf: this.props.alignments.ca,
                        marginTop: this.props.gaps.verticalGap / 2,
                        marginLeft: this.props.gaps.horizontalGap / 2,
                        marginBottom: this.props.gaps.verticalGap / 2,
                        marginRight: this.props.gaps.horizontalGap / 2
                    }
                let clonedComponent = React.cloneElement(component, {layoutStyle: style});
                tempContent.push(clonedComponent)
            }
        })
        this.setState({content: tempContent})
    }

    render() {
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
                justifyContent: this.props.alignments.ha,
                alignContent: this.props.alignments.va,
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