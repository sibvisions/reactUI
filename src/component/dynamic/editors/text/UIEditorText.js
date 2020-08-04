import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';


class UIEditorText extends Base {



    componentDidMount() {
        this.startUp()
        this.sub = this.context.contentStore.selectedDataRowChange.subscribe(this.setContent.bind(this))
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
                style={this.props.style}
                onChange={x => this.setState({selection: x.target.value})}
            /> 
        );
    }
}
UIEditorText.contextType = RefContext
export default UIEditorText;