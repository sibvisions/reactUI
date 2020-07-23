import React from 'react';
import Base from './Base';
import './UIPanel.scss'
import { Panel } from 'primereact/panel';
import FormLayout from '../../layouts/FormLayout'
import BorderLayout from '../../layouts/BorderLayout'
import FlowLayout from '../../layouts/FlowLayout';
import GridLayout from "../../layouts/GridLayout";
import { Gaps } from '../../layouts/layoutObj/Gaps';
import { Margins } from '../../layouts/layoutObj/Margins';
import { Orientation } from '../../layouts/layoutObj/Orientation';
import { Alignments } from "../../layouts/layoutObj/Alignments";
import { GridSize } from '../../layouts/layoutObj/GridSize';


class UIPanel extends Base {

    insertLayout() {
        if (this.state.content !== undefined) {
            let margins = new Margins(this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(0, 4))
            let gaps = new Gaps(this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(4, 6))
            switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
                case "FormLayout":
                        return <FormLayout layout={this.props.layout} layoutData={this.props.layoutData} subjects={this.state.content} margins={margins} gaps={gaps} getPreferredSize={this.getPreferredSize}/>;      
                case "BorderLayout":
                        return <BorderLayout subjects={this.state.content} margins={margins} gaps={gaps}/>;
                case "FlowLayout":
                        let orientation = new Orientation(this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(6, 7));
                        let alignments = new Alignments(this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(7, 10));
                        return <FlowLayout subjects={this.state.content} margins={margins} gaps={gaps} orientation={orientation} alignments={alignments}/>;
                case "GridLayout":
                        let gridSize = new GridSize(this.props.layout.substring(this.props.layout.indexOf(',')+1, this.props.layout.length).split(',').slice(6, 8));
                        return <GridLayout subjects={this.state.content} margins={margins} gaps={gaps} gridSize={gridSize}/>
                default: return null;
            }
        }
        
    }

    render() {
        return (
        <div ref={ref => this.compRef = ref} className="p-col-12" style={{ height: '100%' }}>
            <Panel id={this.props.id} header={this.props.screenTitle} style={{textAlign: "center", height: '100%'}}>
                    {this.insertLayout()}
            </Panel>
        </div>
        );
    }
}
 
export default UIPanel;