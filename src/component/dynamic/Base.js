import React, { Component } from 'react';
import { RefContext } from '../helper/Context';

import FormLayout from '../layouts/FormLayout'
import BorderLayout from '../layouts/BorderLayout'
import FlowLayout from '../layouts/FlowLayout';
import GridLayout from "../layouts/GridLayout";
import NullLayout from '../layouts/NullLayout';
import { Gaps } from '../layouts/layoutObj/Gaps';
import { Margins } from '../layouts/layoutObj/Margins';
import { Orientation } from '../layouts/layoutObj/Orientation';
import { GridSize } from '../layouts/layoutObj/GridSize';
import { checkFlowAlignments, checkFormAlignments, mapFlex} from '../helper/CheckAlignments';
import { getMinimumSize, getMaximumSize } from '../helper/GetSizes';

class Base extends Component {

    state = { 
        
    }

    startUp(){
        let content = [];
        content.length = 0
        if (this.props.subjects) {
            this.props.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.componentHandler(subject);
                if(temp) content.push(temp)
            });
            this.setState({content: content});
        }
    }

    componentDidMount() {
        this.startUp();
    }

    insertLayout() {
        if (this.state.content !== undefined) {
            if (this.props.layout !== null) {
                let margins = new Margins(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(0, 4))
                let gaps = new Gaps(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(4, 6))
                switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
                    case "FormLayout":
                        var alignments = checkFormAlignments(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 8))
                        return <FormLayout
                            component={this}
                            id={this.props.id}
                            parent={this.props.parent}
                            constraints={this.props.constraints}
                            className={this.props.className}
                            layout={this.props.layout}
                            layoutData={this.props.layoutData}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            alignments={alignments}
                            preferredSize={this.props.preferredSize}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            getMinimumSize={getMinimumSize}
                            getMaximumSize={getMaximumSize}
                            />;
                    case "BorderLayout":
                        return <BorderLayout
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            preferredSize={this.props.preferredSize}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            />;
                    case "FlowLayout":
                        let orientation = new Orientation(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 7));
                        alignments = mapFlex(checkFlowAlignments(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(7, 10)));
                        return <FlowLayout
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            orientation={orientation.orientation}
                            alignments={alignments}
                            autoWrap={true}
                            preferredSize={this.props.preferredSize}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            />;
                    case "GridLayout":
                        let gridSize = new GridSize(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 8));
                        return <GridLayout
                            component={this}
                            id={this.props.id}
                            constraints={this.props.constraints}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            gridSize={gridSize}
                            preferredSize={this.props.preferredSize}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            />;
                    default: return <NullLayout
                        id={this.props.id}
                        constraints={this.props.constraints}
                        subjects={this.state.content}
                        />;
                }
            }
            else {
                return <NullLayout
                    id={this.props.id}
                    constraints={this.props.constraints}
                    subjects={this.state.content}
                    />;
            }
        }
    }
}
Base.contextType = RefContext
export default Base;