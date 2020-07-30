import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';

class UIEditorNumber extends Base{


    componentDidMount() {
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        console.log(this)
        if(content[this.props.data.columnName]){
            this.setState({selection: content[this.props.data.columnName]});
        }
    }


    render(){
        return(
            <InputNumber 
                value={this.state.selection}
                onChange={x => this.setState({selection: x.target.value})}/>
        )
    }
}
UIEditorNumber.contextType = RefContext
export default UIEditorNumber