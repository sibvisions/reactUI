import React, { Component } from 'react';
import { toPx } from "../../component/helper/ToPx";

class BorderLayout extends Component {

    elemNorth;
    elemWest;
    elemCenter;
    elemEast;
    elemSouth;

    components = this.props.subjects;

    layoutContainer() {
        this.components.forEach(component => {
            if(this.props.isVisible(component)) {
                let clonedComponent;
                if (component.props.constraints) {
                    const props={
                        layoutStyle: {
                            height: "100%",
                            width: "100%"
                        }                        
                    }
                    switch(component.props.constraints) {
                        case 'North':
                            clonedComponent = React.cloneElement(component, {...props});
                            this.elemNorth = clonedComponent;
                            break;
                        case 'West':
                            clonedComponent = React.cloneElement(component, {...props});
                            this.elemWest = clonedComponent;
                            break;
                        case 'Center':
                            clonedComponent = React.cloneElement(component, {...props});
                            this.elemCenter = clonedComponent;
                            break;
                        case 'East':
                            clonedComponent = React.cloneElement(component, {...props});
                            this.elemEast = clonedComponent;
                            break;
                        case 'South':
                            clonedComponent = React.cloneElement(component, {...props});
                            this.elemSouth = clonedComponent;
                            break;
                        default: return null
                    }
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
        this.layoutContainer()
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
                                                    marginBottom: this.props.isVisible(this.elemNorth) ? this.props.gaps.verticalGap : '0px'}}>
                {this.elemNorth}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{
                                                        textAlign:"center", 
                                                        width:"auto", 
                                                        padding: '0', 
                                                        marginRight: this.props.isVisible(this.elemWest) ? this.props.gaps.horizontalGap : '0px'}}>
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
                                                        marginLeft: this.props.isVisible(this.elemEast) ? this.props.gaps.horizontalGap : '0px'}}>
                    {this.elemEast}
                </span>
            </div>
            <div className="p-col-12 south" style={{
                                                textAlign:"center", 
                                                padding: '0', 
                                                marginTop: this.props.isVisible(this.elemSouth) ? this.props.gaps.verticalGap : '0px'}}>
                {this.elemSouth}
            </div>
        </div>);
    }
}
export default BorderLayout;