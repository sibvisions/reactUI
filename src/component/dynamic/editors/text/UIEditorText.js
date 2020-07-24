import React from 'react';
import { InputText } from "primereact/inputtext";
import Base from '../../Base';
import { RefContext } from '../../../helper/Context';

class UIEditorText extends Base {

    componentDidMount() {
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.data.columnName]){
            this.setState({text: content[this.props.data.columnName]});
        }
    }

    render() { 
        return ( 
            <InputText 
                value={this.state.text ? this.state.text : ""}
                onBlur={_ => console.log(this.props.data)}
                onChange={x => this.setState({text: x.target.value})}
            /> 
        );
    }
}
UIEditorText.contextType = RefContext
export default UIEditorText;