import React from "react";
import {getUrl} from "../file.service.js";
import {Panel, PanelMain, PanelMainBody, TreeView} from "@patternfly/react-core";
import {DataLoadingErrorElement, Loading} from "../FileView.jsx";
import FolderIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon";
import FolderOpenIcon from "@patternfly/react-icons/dist/esm/icons/folder-open-icon";
import FileIcon from "@patternfly/react-icons/dist/esm/icons/file-icon";

export default class ZipView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            content: null,
            isError: false,
        }
    }

    componentDidMount() {
        fetch(getUrl('/api/file/zip?path=' + this.props.path))
            .then(res => res.json())
            .catch(error => {
                this.setState({content: null, isError: true});
                console.error('Error:', error);
            })
            .then(data => {
                this.setState({content: data.nodes});
            });
    }

    buildTree(treeNodes, dataNodes) {
        dataNodes.forEach(dataNode => {
            const isBranch = dataNode.children !== undefined;
            let treeChild = {
                name: dataNode.name,
                icon: <FileIcon />,
            }
            treeNodes.push(treeChild);
            if (isBranch) {
                treeChild.children = [];
                treeChild.icon = <FolderIcon />;
                treeChild.expandedIcon = <FolderOpenIcon />;
                this.buildTree(treeChild.children, dataNode.children);
            }
        })

    }

    render() {
        if (this.state.content === null) {
            return this.state.isError ? <DataLoadingErrorElement /> : <Loading/>;
        }
        if (this.state.content.length === 0) {
            return <span style={{color: 'gray'}}>Empty</span>
        }
        let treeData = [];
        this.buildTree(treeData, this.state.content);
        return <Panel isScrollable>
            <PanelMain>
                <PanelMainBody>
                    <TreeView data={treeData} hasGuides />
                </PanelMainBody>
            </PanelMain>
        </Panel>;
    }
}