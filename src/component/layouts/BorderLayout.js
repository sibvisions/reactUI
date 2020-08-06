import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";

class BorderLayout extends Component {

    elemNorth;
    elemWest;
    elemCenter;
    elemEast;
    elemSouth;

    components = this.props.subjects;

    // state = {
    //     preferredWidth: 0,
    //     preferredHeight: 0
    // }

    // componentDidMount() {
    //     this.calculateSizes()
    // }

    addLayoutComponents() {
        this.components.forEach(component => {
            if (component.props.data.constraints) {
                switch(component.props.data.constraints) {
                    case 'North':
                        this.elemNorth = component;
                        break;
                    case 'West':
                        this.elemWest = component;
                        break;
                    case 'Center':
                        this.elemCenter = component;
                        break;
                    case 'East':
                        this.elemEast = component;
                        break;
                    case 'South':
                        this.elemSouth = component;
                        break;
                    default: return null
                }
            }
        });
    }

    //maybe needed
    // calculateSizes() {
    //     let size = this.props.getPreferredSize(this.props.component);
    //     let preferredWidth = size.getWidth() - this.props.margins.getMarginLeft() - this.props.margins.getMarginRight();
    //     let preferredHeight = size.getHeight() - this.props.margins.getMarginTop() - this.props.margins.getMarginLeft();
    //     this.setState({preferredWidth: preferredWidth, preferredHeight: preferredHeight})
    // }

    render() {
        // window.onresize = () => {
        //     this.calculateSizes()
        // }
        this.addLayoutComponents()
        return (
        <div className="p-grid p-nogutter borderlayout" style={{
                                                            height: 'calc(100% - ' + toPx((parseInt(this.props.margins.marginTop) + parseInt(this.props.margins.marginBottom))) + ')',
                                                            width: 'calc(100% - ' + toPx((parseInt(this.props.margins.marginLeft) + parseInt(this.props.margins.marginRight))) + ')', 
                                                            flexFlow: "column", 
                                                            padding: '0', 
                                                            marginTop: this.props.margins.marginTop, 
                                                            marginLeft: this.props.margins.marginLeft,
                                                            marginBottom: this.props.margins.marginBottom, 
                                                            marginRight: this.props.margins.marginRight}}>
            <div className="p-col-12 north" style={{textAlign:"center",
                                                    padding: '0',
                                                    marginBottom: this.props.gaps.verticalGap}}>
                {this.elemNorth}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{
                                                        textAlign:"center", 
                                                        width:"auto", 
                                                        padding: '0', 
                                                        marginRight: this.props.gaps.horizontalGap}}>
                    {this.elemWest}
                </span>
                <span className="p-col center" style={{
                                                    textAlign:"center", 
                                                    height:"100%", 
                                                    padding: '0', 
                                                    width:"100%"}}>
                    {this.elemCenter}
                </span>
                <span className="p-col-fixed east" style={{
                                                        textAlign:"center", 
                                                        width:"auto", 
                                                        padding: '0', 
                                                        marginLeft: this.props.gaps.horizontalGap}}>
                    {this.elemEast}
                </span>
            </div>
            <div className="p-col-12 south" style={{
                                                textAlign:"center", 
                                                padding: '0', 
                                                marginTop: this.props.gaps.verticalGap}}>
                {this.elemSouth}
            </div>
        </div>);
    }
} 
export default BorderLayout;