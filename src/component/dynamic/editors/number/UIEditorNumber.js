import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';

class UIEditorNumber extends Base {


    componentDidMount() {
        console.log(this.props)
        if (this.number.element !== null) {
            console.log(this.number)
            let alignments = checkCellEditorAlignments(this.props)
            for (let child of this.number.element.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', this.props["cellEditor.background"])
                    child.style.setProperty('text-align', alignments.ha)
                }
            }
        }
        this.sub = this.context.contentStore.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.columnName]){
            this.setState({selection: content[this.props.columnName]});
        } else {
            this.setState({selection: undefined})
        }
    }


    render(){
        return(
            <InputNumber
                useGrouping={false}
                id={this.props.id}
                ref={r => this.number = r}
                value={this.state.selection}
                style={this.props.layoutStyle}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}/>
        )
    }
}
UIEditorNumber.contextType = RefContext
export default UIEditorNumber