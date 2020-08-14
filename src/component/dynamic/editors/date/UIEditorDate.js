import React from 'react';

import { Calendar } from 'primereact/calendar';
import Base from '../../Base';

import "./UIEditorDate.scss"
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';

class UIEditorDate extends Base {

    constructor(props){
        super(props);

        this.test = {}
        if(props.appendToBody){
            this.test= {
                appendTo: document.body
            }
        }
        
    }

    componentDidMount() {
        if (this.calender.container !== null) {
            let alignments = checkCellEditorAlignments(this.props)
            for (let child of this.calender.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', this.props["cellEditor.background"])
                    child.style.setProperty('text-align', alignments.ha)
                }
            }
        }
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.columnName]){
                const date = new Date(selection[this.props.columnName]);
                this.setState({date: date});
            } else {
                this.setState({date : undefined})
            }
        });        
    }

    componentWillUnmount() {
        this.selectionSub.unsubscribe();
    }

    render() {
        return ( 
            <Calendar
                {...this.test}
                ref = {r => this.calender = r}
                showIcon={true}
                id={this.props.id}
                style={{width:"100%", textAlign: 'start',  ...this.props.layoutStyle}}
                dateFormat="dd/mm/yy"
                value={this.state.date ? this.state.date : 0}
                onChange= {value => this.setState({date: value.value})}
                disabled={!this.props["cellEditor.editable"]}
            />
        );
    }
}
 
export default UIEditorDate;