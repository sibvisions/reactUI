import React, { Component } from 'react';
import { InputText } from 'primereact/inputtext';

class TextCellEditor extends Component {
    constructor(props){
        super(props);

        this.state = {
            selection: props.selection
        }
    }


    render(){

        return(
            <InputText
                style={{width: "100%"}}
                value={this.state.selection}
                onChange={x => this.setState({selection: x.target.value})}
            />
        )
    }
}

export default TextCellEditor