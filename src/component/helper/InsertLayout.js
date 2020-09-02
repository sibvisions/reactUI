import { Margins } from "../layouts/layoutObj/Margins";
import { Gaps } from "../layouts/layoutObj/Gaps";
import { checkFormAlignments } from "./CheckAlignments";
import FormLayout from "../layouts/FormLayout";
import { getMinimumSize, getMaximumSize } from "./GetSizes";
import BorderLayout from "../layouts/BorderLayout";
import FlowLayout from "../layouts/FlowLayout";

export function insertLayout(content, props) {
    if (content !== null) {
        let margins = new Margins(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(0, 4));
        let gaps = new Gaps(this.props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6));
        switch (props.layout.substring(0, props.layout.indexOf(','))) {
            case "FormLayout":
                var alignments = checkFormAlignments(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 8));
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
                    subjects={content}
                    margins={margins}
                    gaps={gaps}
                    orientation={orientation.orientation}
                    alignments={alignments}
                    autoWrap={true}
                />;
            case "GridLayout":
                let gridSize = new GridSize(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(6, 8));
                return <GridLayout
                    component={this}
                    subjects={this.state.content}
                    margins={margins}
                    gaps={gaps}
                    gridSize={gridSize}
                    preferredSize={this.props.preferredSize}
                    minimumSize={this.props.minimumSize}
                    maximumSize={this.props.maximumSize}
                />;
        }
    }
}