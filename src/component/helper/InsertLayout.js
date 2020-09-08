import React from 'react';
import { Margins } from "../layouts/layoutObj/Margins";
import { Gaps } from "../layouts/layoutObj/Gaps";
import { checkFormAlignments, checkFlowAlignments, mapFlex } from "./CheckAlignments";
import FormLayout from "../layouts/FormLayout";
import { getMinimumSize, getMaximumSize } from "./GetSizes";
import BorderLayout from "../layouts/BorderLayout";
import FlowLayout from "../layouts/FlowLayout";
import NullLayout from "../layouts/NullLayout";
import { Orientation } from '../layouts/layoutObj/Orientation';
import { GridSize } from '../layouts/layoutObj/GridSize';
import GridLayout from '../layouts/GridLayout';

export function insertLayout(content, props) {
    if (content) {
        if (props.layout) {
            let margins = new Margins(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(0, 4));
            let gaps = new Gaps(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6));
            switch (props.layout.substring(0, props.layout.indexOf(','))) {
                case "FormLayout":
                    var alignments = checkFormAlignments(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(6, 8));
                    return <FormLayout
                        id={props.id}
                        parent={props.parent}
                        constraints={props.constraints}
                        className={props.className}
                        layout={props.layout}
                        layoutData={props.layoutData}
                        subjects={content}
                        margins={margins}
                        gaps={gaps}
                        alignments={alignments}
                        preferredSize={props.preferredSize}
                        minimumSize={props.minimumSize}
                        maximumSize={props.maximumSize}
                        getMinimumSize={getMinimumSize}
                        getMaximumSize={getMaximumSize}
                    />;
                case "BorderLayout":
                    return <BorderLayout 
                        subjects={content}
                        margins={margins}
                        gaps={gaps}
                    />;
                case "FlowLayout":
                    let orientation = new Orientation(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(6, 7));
                    alignments = mapFlex(checkFlowAlignments(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(7, 10)));
                    return <FlowLayout
                        id={props.id}
                        parent={props.parent}
                        subjects={content}
                        margins={margins}
                        constraints={props.constraints}
                        gaps={gaps}
                        orientation={orientation.orientation}
                        alignments={alignments}
                        autoWrap={true}
                    />;
                case "GridLayout":
                    let gridSize = new GridSize(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(6, 8));
                    return <GridLayout
                        id={props.id}
                        constraints={props.constraints}
                        subjects={content}
                        margins={margins}
                        gaps={gaps}
                        gridSize={gridSize}
                    />;
                default: return <NullLayout
                        id={props.id}
                        constraints={props.constraints}
                        subjects={content}
                    />;
            }
        }
        else {
            return <NullLayout
                id={props.id}
                constraints={props.constraints}
                subjects={content}
            />;
        }
    }
}