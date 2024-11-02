import React from "react";
import {bytesToHumanReadable, getUrl} from "../file.service.js";
import {Panel, PanelMain, PanelMainBody, Stack, StackItem} from "@patternfly/react-core";
import {DataLoadingErrorElement, Loading} from "../FileView.jsx";


export default class TextView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            content: null,
            isError: false,
        }
    }

    componentDidMount() {
        fetch(getUrl('/api/file/text?path=' + this.props.path))
            .then(res => res.json())
            .catch(error => {
                this.setState({content: null, isError: true});
                console.error('Error:', error);
            })
            .then(data => {
                this.setState({content: data});
            });
    }

    render() {
        if (this.state.content === null) {
            return this.state.isError ? <DataLoadingErrorElement /> : <Loading/>;
        }
        if (this.state.content.content.length === 0) {
            return <span className="hint-text">Empty</span>
        }
        return <Stack>
            <StackItem>
                <Panel isScrollable>
                    <PanelMain>
                        <PanelMainBody><pre>{this.state.content.content}</pre></PanelMainBody>
                    </PanelMain>
                </Panel>
            </StackItem>
            {
                this.state.content.truncate ?
                    <StackItem>
                        <span className="hint-text">Truncated (Total: {bytesToHumanReadable(this.state.content.size)})</span>
                    </StackItem> :
                    ''
            }
        </Stack>
    }
}