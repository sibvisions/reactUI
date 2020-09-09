import React, { Component } from 'react';
import { getPreferredSize } from '../helper/GetSizes';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

class FlowLayout extends Component {

    state = {
        content: [this.props.subjects],
    };

    preferredWidth;
    preferredHeight;

    orientation;
    components = this.props.subjects;
    
    constructor(props) {
        super(props)
        this.handleCalculations = this.handleCalculations.bind(this)
    }

    componentDidMount() {
        this.calculateLayoutSize();
        this.layoutContainer();
        this.context.contentStore.emitSizeCalculated(
            {
                size: new Size(this.preferredWidth + this.props.margins.marginLeft + this.props.margins.marginRight, this.preferredHeight + this.props.margins.marginTop + this.props.margins.marginBottom), 
                id: this.props.id, 
                parent: this.props.parent,
                disableFlag: true
            }
        );
        window.addEventListener("resize", this.handleCalculations)
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleCalculations)
    }

    handleCalculations() {
        this.calculateLayoutSize();
        this.layoutContainer();
        this.context.contentStore.emitSizeCalculated(
            {
                size: new Size(this.preferredWidth + this.props.margins.marginLeft + this.props.margins.marginRight, this.preferredHeight + this.props.margins.marginTop + this.props.margins.marginBottom), 
                id: this.props.id, 
                parent: this.props.parent,
                disableFlag: true
            }
        );
    }

    calculateLayoutSize() {
        if (this.props.constraints === "Center" || this.props.constraints === undefined) {
            let margins = this.props.margins
            this.preferredWidth = document.getElementById(this.props.id).parentElement.clientWidth - (margins.marginLeft + margins.marginRight);
            this.preferredHeight = document.getElementById(this.props.id).parentElement.clientHeight - (margins.marginTop + margins.marginBottom) - 1;
        }
        else {
            if (this.props.orientation === 'horizontal') {
                let highest = 0;
                let calcWidth = 0;
                this.components.forEach(component => {
                    let prefSize = getPreferredSize(component.props);
                    if (prefSize.height > highest) {
                        highest = prefSize.height;
                    }
                    calcWidth += prefSize.width + this.props.gaps.horizontalGap
                });
                //let margins = this.props.margins
                this.preferredWidth = calcWidth;
                this.preferredHeight = highest;
            }
            else {
                let widest = 0;
                let calcHeight = 0;
                this.components.forEach(component => {
                    let prefSize = getPreferredSize(component.props);
                    if (prefSize.width > widest) {
                        widest = prefSize.width;
                    }
                    calcHeight += prefSize.height + this.props.gaps.verticalGap
                });
                //let margins = this.props.margins
                this.preferredWidth = widest;
                this.preferredHeight = calcHeight;
            }
            if (this.preferredHeight < document.getElementById(this.props.id).offsetHeight) {
                this.preferredHeight = document.getElementById(this.props.id).offsetHeight;
            }
            if (this.preferredWidth < document.getElementById(this.props.id).offsetWidth) {
                this.preferredWidth = document.getElementById(this.props.id).offsetWidth;
            }
        }
    }

    layoutContainer() {
        let tempContent = [];
        this.components.forEach(component => {
            if (component.props.visible === undefined || component.props.visible) {
                let preferredSize = getPreferredSize(component.props);
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
                flexWrap: this.props.autoWrap ? 'wrap' : null,
                flexDirection: this.orientation,
                justifyContent: this.props.alignments.ha,
                alignItems: this.props.alignments.va,
                height: this.preferredHeight,
                width: this.preferredWidth,
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
FlowLayout.contextType = RefContext
export default FlowLayout