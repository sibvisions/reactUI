import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';


class UIEditorText extends Base {

    state= {
        selection: ""
    }

    componentDidMount() {
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.data.columnName]){
            this.setState({selection: content[this.props.data.columnName]});
        }
    }

    render() { 
        return ( 
            <InputText
                id={this.props.data.id}
                value={this.state.selection}
                onChange={x => this.setState({selection: x.target.value})}
            /> 
        );
    }
}
UIEditorText.contextType = RefContext
export default UIEditorText;