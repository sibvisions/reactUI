import React from 'react';

import { Calendar } from 'primereact/calendar';
import Base from '../../Base';

import "./UIEditorDate.scss"

class UIEditorDate extends Base {

    componentDidMount() {
        let childList = document.getElementById(this.props.id).children
        for (let child of childList) {
            if (child.tagName === 'INPUT') {
                child.style.setProperty('background-color', this.props["cellEditor.background"])
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
                ref = {r => this.calender = r}
                showIcon={true}
                id={this.props.id}
                style={{textAlign: "start",  ...this.props.style}}
                dateFormat="dd/mm/yy"
                value={this.state.date ? this.state.date : 0}
                onChange= {value => this.setState({date: value.value})}
                disabled={!this.props["cellEditor.editable"]}
            />
        );
    }
}
 
export default UIEditorDate;