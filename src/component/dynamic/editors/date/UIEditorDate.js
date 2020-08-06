import React from 'react';

import { Calendar } from 'primereact/calendar';
import Base from '../../Base';

import "./UIEditorDate.scss"

class UIEditorDate extends Base {

    componentDidMount() {
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.data.columnName]){
                const date = new Date(selection[this.props.data.columnName]);
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
                id={this.props.data.id}
                style={{textAlign: "start",  ...this.props.style}}
                dateFormat="dd/mm/yy"
                value={this.state.date ? this.state.date : 0}
                onChange= {value => this.setState({date: value.value})}
            />
        );
    }
}
 
export default UIEditorDate;