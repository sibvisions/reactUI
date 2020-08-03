import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';

class UIEditorNumber extends Base {


    componentDidMount() {
        this.startUp()
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
                id={this.props.data.id}
                value={this.state.selection}
                style={this.state.style}
                onChange={x => this.setState({selection: x.target.value})}/>
        )
    }
}
UIEditorNumber.contextType = RefContext
export default UIEditorNumber