import Base from "../../Base";
import React from 'react';

class UIEditorImage extends Base {

    placeHolder = process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg";

    constructor(props) {
        super(props);
        this.onload = this.onload.bind(this)
    }

    componentDidMount() {
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.data.columnName]){
                this.setState({img: "data:image/png;base64," + selection[this.props.data.columnName]});
            } else {
                this.setState({img: process.env.PUBLIC_URL + "/assets/" + this.props.data.columnName + ".svg"})
            }
        })
    }

    onload({target:img}) {
        console.log(img.offsetHeight);
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
                onLoad={this.onload}
                disabled={!this.props.data["cellEditor.editable"]}
            />
        );
    }
}
export default UIEditorImage;