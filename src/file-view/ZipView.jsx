import {useState} from "react";
import {getUrl} from "../file.service.js";
import {Panel, PanelMain, PanelMainBody, TreeView} from "@patternfly/react-core";
import {DataLoadingErrorElement, Loading} from "../FileView.jsx";
import FolderIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon";
import FolderOpenIcon from "@patternfly/react-icons/dist/esm/icons/folder-open-icon";
import FileIcon from "@patternfly/react-icons/dist/esm/icons/file-icon";
import {useComponentDidMount} from "../helper.jsx";

export default function ZipView(props) {
    /* hooks */
    const [content, setContent] = useState(null);
    const [isError, setIsError] = useState(false);
    useComponentDidMount(() => {
        fetch(getUrl('/api/file/zip?path=' + props.path))
            .then(async res => {
                if (!res.ok) {
                    throw new Error(JSON.stringify(await res.json()));
                }
                return res.json()
            })
            .then(data => {
                setContent(data.nodes);
            })
            .catch(error => {
                setContent(null);
                setIsError(true);
                console.error('Error:', error);
            });
    });

    /* inner functions */
    function buildTree(treeNodes, dataNodes) {
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
                buildTree(treeChild.children, dataNode.children);
            }
        });
    }

    /* render */
    if (content === null || content === undefined) {
        return isError ? <DataLoadingErrorElement /> : <Loading/>;
    }
    if (content.length === 0) {
        return <span className="hint-text">Empty</span>
    }
    let treeData = [];
    buildTree(treeData, content);
    return <Panel isScrollable>
        <PanelMain>
            <PanelMainBody>
                <TreeView data={treeData} hasGuides />
            </PanelMainBody>
        </PanelMain>
    </Panel>;
}