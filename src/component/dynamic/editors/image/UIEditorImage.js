import Base from "../../Base";
import React from 'react';

class UIEditorImage extends Base {

    placeHolder = process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg";

    componentDidMount() {
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.data.columnName]){
                this.setState({img: "data:image/png;base64," + selection[this.props.data.columnName]});
            } else {
                this.setState({img: process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg"})
            }
        })
    }

    componentWillUnmount() {
        this.selectionSub.unsubscribe();
    }

    render() {
        return (
            <img
                id={this.props.data.id}
                alt={this.placeHolder}
                style={{...this.props.style, backgroundColor: this.props.data["cellEditor.background"]}}
                src={this.state.img ? this.state.img : this.placeHolder}
                disabled={!this.props.data["cellEditor.editable"]}
            />
        );
    }
}
export default UIEditorImage;