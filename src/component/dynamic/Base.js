import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

import FormLayout from '../layouts/FormLayout'
import BorderLayout from '../layouts/BorderLayout'
import FlowLayout from '../layouts/FlowLayout';
import GridLayout from "../layouts/GridLayout";
import NullLayout from '../layouts/NullLayout';
import { Gaps } from '../layouts/layoutObj/Gaps';
import { Margins } from '../layouts/layoutObj/Margins';
import { Orientation } from '../layouts/layoutObj/Orientation';
import { Alignments } from "../layouts/layoutObj/Alignments";
import { GridSize } from '../layouts/layoutObj/GridSize';

class Base extends Component {

    state = { 
        
    }

    startUp(){
        let content = [];
        content.length = 0
        if (this.props.data.subjects) {
            this.props.data.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                if(temp) content.push(temp)
            });
            this.setState({content: content});
        }
    }

    getPreferredSize(comp) {
        let prefSize;
        if (comp) {
            if (comp.props.data.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.data.preferredSize)
            }
            else {
                let element = document.getElementById(comp.props.data.id);
                if (element.getBoundingClientRect()) {
                    prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height), undefined)
                }
                else {
                    prefSize = new Size(element.offsetWidth, element.offsetHeight, undefined)
                }
            }
            if (comp.props.data.minimumSize) {
                let minSize = new Size(undefined, undefined, comp.props.data.minimumSize)
                if (prefSize.width < minSize.width) {
                    prefSize.setWidth(minSize.width);
                }
                if (prefSize.height < minSize.height) {
                    prefSize.setHeight(minSize.height);
                }
            }

            if (comp.props.data.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
                if (maxSize.width < prefSize.width) {
                    prefSize.setWidth(maxSize.width);
                }
                if (maxSize.height < prefSize.height) {
                    prefSize.setHeight(maxSize.height);
                }
            }
            return prefSize
        }
    }
    
    componentDidMount() {
        this.startUp();
    }

    getMinimumSize(comp) {
        let minSize;
        if (comp) {
            if (comp.props.data.minimumSize) {
                minSize = new Size(undefined, undefined, comp.props.data.minimumSize);
            }
            else {
                minSize = this.getPreferredSize(comp);
            }
    
            if (comp.props.data.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
                if (maxSize.width < minSize.width) {
                    minSize.setWidth(maxSize.width);
                }
                if (maxSize.height < minSize.height) {
                    minSize.setHeight(maxSize.height);
                }
            }
            return minSize
        }
    }

    getMaximumSize(comp) {
        let maxSize;
        if (comp) {
            if (comp.props.data.maximumSize) {
                maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
            }
            else {
                maxSize = new Size(Math.pow(2, 31) - 1, Math.pow(2, 31) - 1, undefined)
            }
            return maxSize;
        }
    }

    isVisible(comp) {
        if (comp) {
            if (comp.props.data.visible === undefined || comp.props.data.visible) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    insertLayout() {
        if (this.state.content !== undefined) {
            if (this.props.data.layout !== null) {
                let margins = new Margins(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(0, 4))
                let gaps = new Gaps(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(4, 6))
                switch (this.props.data.layout.substring(0, this.props.data.layout.indexOf(','))) {
                    case "FormLayout":
                        var alignments = new Alignments(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(6, 8), 'form')
                        return <FormLayout
                            component={this}
                            layout={this.props.data.layout}
                            layoutData={this.props.data.layoutData}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            alignments={alignments}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.data.minimumSize}
                            maximumSize={this.props.data.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            getMinimumSize={this.getMinimumSize}
                            getMaximumSize={this.getMaximumSize}
                            isVisible={this.isVisible} />;
                    case "BorderLayout":
                        return <BorderLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.data.minimumSize}
                            maximumSize={this.props.data.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            getMinimumSize={this.getMinimumSize}
                            getMaximumSize={this.getMaximumSize}
                            isVisible={this.isVisible} />;
                    case "FlowLayout":
                        let orientation = new Orientation(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(6, 7));
                        alignments = new Alignments(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(7, 10), 'flow');
                        return <FlowLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            orientation={orientation.orientation}
                            alignments={alignments}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.data.minimumSize}
                            maximumSize={this.props.data.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            isVisible={this.isVisible} />;
                    case "GridLayout":
                        let gridSize = new GridSize(this.props.data.layout.substring(this.props.data.layout.indexOf(',') + 1, this.props.data.layout.length).split(',').slice(6, 8));
                        return <GridLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            gridSize={gridSize}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.data.minimumSize}
                            maximumSize={this.props.data.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            isVisible={this.isVisible} />;
                    default: return <NullLayout
                        component={this}
                        subjects={this.state.content}
                        getPreferredSize={this.getPreferredSize}
                        isVisible={this.isVisible} />;
                }
            }
            else {
                return <NullLayout
                    component={this}
                    subjects={this.state.content}
                    getPreferredSize={this.getPreferredSize}
                    isVisible={this.isVisible} />;
            }
        }
    }
}
Base.contextType = RefContext
export default Base;