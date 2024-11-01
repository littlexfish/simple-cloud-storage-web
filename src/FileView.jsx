import React, {memo} from "react";
import {
    Alert, AlertActionLink,
    Breadcrumb, BreadcrumbItem, Button, MenuToggle,
    Modal, ModalBody, ModalFooter, ModalHeader, Select, SelectList, SelectOption, SimpleList, SimpleListItem,
    Spinner,
    Split, SplitItem,
    Stack, StackItem,
    TreeView
} from "@patternfly/react-core";
import FolderIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon";
import FolderOpenIcon from "@patternfly/react-icons/dist/esm/icons/folder-open-icon";
import FileIcon from "@patternfly/react-icons/dist/esm/icons/file-icon";
import {bytesToHumanReadable, getUrl} from "./file.service.js";
import ImageView from "./file-view/ImageView.jsx";
import TextView from "./file-view/TextView.jsx";
import ZipView from "./file-view/ZipView.jsx";
import PdfView from "./file-view/PdfView.jsx";

class FileView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedDirectory: '',
        }
    }

    onDirectorySelect(directory) {
        this.setState({selectedDirectory: directory});
    }

    render() {
        return (
            <Split style={{height: '100vh'}} hasGutter>
                <SplitItem><FileTree onDirectorySelect={this.onDirectorySelect.bind(this)}/></SplitItem>
                <SplitItem isFilled><DirectoryView onDirectorySelect={this.onDirectorySelect.bind(this)}
                                                   selectedDirectory={this.state.selectedDirectory}/></SplitItem>
            </Split>
        );
    }
}

const DataLoadingErrorElement = memo((props) => <Alert {...props} style={{textWrap: 'nowrap'}} variant="danger" title="Error on loading data"></Alert>)
const Loading = memo((props) => <span><Spinner isInline={true} {...props} /> Loading...</span>)

class FileTree extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [{
                id: '<root>',
                name: <Loading />,
            }],
            selected: [],
        };
    }

    componentDidMount() {
        // get root directories
        fetch(getUrl('/api/directory'))
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
            })
            .then(data => {
                if(data) {
                    this.setState({data: this.apiDataToTreeData(data)});
                }
                else {
                    this.setState({data: [
                        {
                            id: '<root>',
                            name: <DataLoadingErrorElement />
                        }
                    ]});
                }
        });
    }

    apiDataToTreeData(apiData) {
        const idPrefix = apiData.path === '' ? '' : apiData.path + '/';
        return apiData.files.map((item) => {
            return {
                id: idPrefix + item.name,
                name: this.getNameFromApiDataItem(item),
                icon: item.isDirectory ? <FolderIcon /> : <FileIcon />,
                expandedIcon: item.isDirectory ? <FolderOpenIcon /> : <FileIcon />,
                children: item.isDirectory ? [] : null
            };
        });
    }

    getNameFromApiDataItem(apiDataItem) {
        return <span className={apiDataItem.isHidden ? 'hidden' : ''}>{apiDataItem.name}</span>;
    }

    onTreeExpend(evt, item, parent) {
        const hasAnyChild = item.children.length > 0;
        if (!hasAnyChild) {
            item.children = [
                {
                    id: `${item.id}/<loading>`,
                    name: <span><Spinner isInline={true}/> Loading...</span>
                }
            ];
            this.forceUpdate();
        }
        fetch(getUrl('/api/directory?path=' + item.id))
            .catch(error => {
                console.error('Error:', error);
            })
            .then(response => response.json()).then(data => {
                const treeData = this.apiDataToTreeData(data);
                const idExists = item.children
                    .map(it => it.id)
                    .filter(it => !it.endsWith('<loading>'));
                if (idExists.length === 0) {
                    item.children = treeData;
                }
                else {
                    const newId = treeData.map(it => it.id);
                    const needAdd = treeData.filter(it => !idExists.includes(it.id));
                    let children = item.children.filter(it => newId.includes(it.id));
                    children.push(...needAdd);
                    item.children = children;
                }
                this.forceUpdate(() => {
                    const vScrollToItem = item.children.length > 0 ? item.children[0] : item;
                    const hScrollToItem = item.children.length > 0 ? item.children.reduce((p, c) => p.id.length > c.id.length ? p : c, {id: ''}) : item;
                    this.scrollToItem(vScrollToItem, hScrollToItem);
                });
        });
    }

    onNodeSelect(evt, item, parent) {
        this.setState({selected: [item]}, () => {
            this.scrollToItem(item, item);
        });
        const selectId = Array.isArray(item.children) ? item.id : parent ? parent.id : '';
        this.props.onDirectorySelect && this.props.onDirectorySelect(selectId);
    }

    scrollToItem(vItem, hItem) {
        const scrollView = document.getElementById('file-tree-view');
        const vUlElement = document.getElementById(vItem.id);
        const hUlElement = document.getElementById(hItem.id);
        const vTextElement = vUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);
        const hTextElement = hUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);

        const scrollRect = scrollView.getBoundingClientRect();
        const scrollContainerRect = scrollView.firstElementChild.getBoundingClientRect();
        const vUlRect = vUlElement.getBoundingClientRect();
        const hTextRect = hTextElement?.getBoundingClientRect() || {y: 0, x: 0, width: 0, height: 0};

        if (vTextElement && hTextElement) {
            const vPos = vUlRect.y - scrollContainerRect.y + vUlRect.height / 2 - scrollRect.height / 2;
            const hPos = hTextRect.x - scrollContainerRect.x - 46 /* button padding */ - 22 /* icon width */;
            scrollView.scrollTo({
                top: vPos,
                left: hPos,
                behavior: 'smooth'
            })
        }
    }

    render() {
        return (
            <div id="file-tree-view" style={{width: '200px', height: '100%', overflow: 'auto'}}>
                <div style={{width: 'fit-content', minWidth: '200px'}}>
                    <TreeView data={this.state.data}
                              hasGuides={true}
                              useMemo={true}
                              activeItems={this.state.selected}
                              onExpand={this.onTreeExpend.bind(this)}
                              onSelect={this.onNodeSelect.bind(this)}/>
                </div>
            </div>
        );
    }
}

class DirectoryView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            openedFile: null,
            files: [],
            isLoading: true,
            isError: false,
        }
    }

    getFiles() {
        fetch(getUrl('/api/directory?path=' + (this.props.selectedDirectory || '')))
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
                this.setState({isError: true, isLoading: false});
            })
            .then(data => {
                const files = this.apiDataToFiles(data);
                this.setState({isLoading: false, files: files});
            });
    }

    componentDidMount() {
        this.getFiles();
    }

    apiDataToFiles(apiData) {
        const pathPrefix = apiData.path === '' ? '' : apiData.path + '/';
        return apiData.files.map((item) => {
            return {
                name: this.getNameFromApiDataItem(item),
                isDirectory: item.isDirectory,
                isHidden: item.isHidden,
                size: item.size,
                path: pathPrefix + item.name,
                isActive: false,
            }
        });
    }

    getNameFromApiDataItem(apiDataItem) {
        return <span className={apiDataItem.isHidden ? 'hidden' : ''}>{apiDataItem.name}</span>;
    }

    breakPath(path) {
        return path.split('/');
    }

    onNewPath(path) {
        this.props.onDirectorySelect && this.props.onDirectorySelect(path);
    }

    onOpenFile(path) {
        this.setState({openedFile: path});
    }

    breadcrumbItem(name, path, isActive) {
        if (!isActive) {
            return <BreadcrumbItem key={path}>
                <Button variant="plain" isDisabled={true}>{name}</Button>
            </BreadcrumbItem>
        }
        return <BreadcrumbItem key={path}>
            <Button variant="link" onClick={this.onNewPath.bind(this, path)}>{name}</Button>
        </BreadcrumbItem>
    }

    buildSimpleListItem(item) {
        return <SimpleListItem key={item.path}
                               onClick={!item.isDirectory ? this.onOpenFile.bind(this, item.path) : this.onNewPath.bind(this, item.path)}>
            <Split hasGutter>
                <SplitItem>
                    {item.isDirectory ? <FolderIcon /> : <FileIcon />}
                </SplitItem>
                <SplitItem isFilled>
                    {item.name}
                </SplitItem>
                <SplitItem>
                    {item.isDirectory ? '' : bytesToHumanReadable(item.size)}
                </SplitItem>
            </Split>
        </SimpleListItem>
    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedDirectory !== this.props.selectedDirectory) {
            this.setState({isLoading: true});
            this.getFiles();
        }
    }

    getOpenedFileName() {
        const dir = this.props.selectedDirectory || '';
        const filePath = this.state.openedFile || '';
        if (dir.length === 0) {
            return filePath;
        }
        return filePath.slice(dir.length + 1);
    }

    download() {
        fetch(getUrl('/api/file/download?path=' + this.state.openedFile))
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // a.target = '_blank';
                a.download = this.getOpenedFileName();
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            });
    }

    render() {
        const pathList = this.props.selectedDirectory ? this.breakPath(this.props.selectedDirectory) : [];
        return (
            <Stack style={{height: '100%'}}>
                <StackItem>
                    <Breadcrumb style={{padding: '8px'}}>
                        {this.breadcrumbItem('/', '', pathList.length !== 0)}
                        {pathList.map((item, index) => {
                            return this.breadcrumbItem(item, pathList.slice(0, index + 1).join('/'), index !== pathList.length - 1);
                        })}
                    </Breadcrumb>
                </StackItem>
                <StackItem isFilled>
                    {
                        this.state.isLoading ? <Loading /> :
                            this.state.isError ? <DataLoadingErrorElement /> :
                                this.state.files.length > 0 ?
                                    <SimpleList>{this.state.files.map(this.buildSimpleListItem.bind(this))}</SimpleList> :
                                    ''
                    }
                </StackItem>
                <Modal variant="medium"
                       disableFocusTrap
                       isOpen={this.state.openedFile !== null}
                       onEscapePress={this.onOpenFile.bind(this, null)}
                       onClose={this.onOpenFile.bind(this, null)}>
                    <ModalHeader title={this.getOpenedFileName()} />
                    <ModalBody>
                        <FileContentView path={this.state.openedFile} />
                    </ModalBody>
                    <ModalFooter style={{justifyContent: 'end'}}>
                        <Button variant="link" onClick={this.download.bind(this)}>Download</Button>
                    </ModalFooter>
                </Modal>
            </Stack>
        );
    }
}

class FileContentView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            type: null,
            viewable: true,
            forceViewType: 'text',
            forceViewDropdownOpen: false,
        }
        this.allViewType = [
            {
                value: 'text',
                label: 'Text'
            },
            {
                value: 'image',
                label: 'Image'
            },
            {
                value: 'zip',
                label: 'Zip'
            },
            {
                value: 'pdf',
                label: 'PDF'
            }
        ];
    }

    updateContent() {
        fetch(getUrl('/api/file/type?path=' + this.props.path))
            .then(res => res.json())
            .catch(error => {
                this.setState({type: 'error', viewable: true});
                console.error('Error:', error);
            })
            .then(data => {
                this.setState({type: data.type.toLowerCase(), viewable: data.viewable});
            });
    }

    componentDidMount() {
        this.updateContent();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.path !== this.props.path) {
            this.updateContent();
        }
    }

    getComponent() {
        if (!this.state.viewable) {
            return <Alert variant="warning" title="The preview for this file is not available.">
                <Button variant="link" isInline onClick={() => this.setState({viewable: true, type: this.state.forceViewType})}>
                    Force preview as
                </Button>
                {' '}
                <Select isOpen={this.state.forceViewDropdownOpen} selected={this.state.forceViewType}
                        onSelect={(evt , v) => {this.setState({forceViewType: v, forceViewDropdownOpen: false})}}
                        onOpenChange={(isOpen) => this.setState({forceViewDropdownOpen: isOpen})}
                        toggle={(t) => <MenuToggle ref={t} onClick={() => this.setState({forceViewDropdownOpen: !this.state.forceViewDropdownOpen})}
                                                   isExpanded={this.state.forceViewDropdownOpen}>
                            {this.allViewType.find(it => it.value === this.state.forceViewType)?.label}
                        </MenuToggle>} shouldFocusToggleOnSelect>
                    <SelectList>
                        {this.allViewType.map(it => {
                            return <SelectOption key={it.value} value={it.value}>{it.label}</SelectOption>
                        })}
                    </SelectList>
                </Select>
            </Alert>;
        }
        switch (this.state.type) {
            case 'text':
            case 'unknown':
                return <TextView path={this.props.path} />;
            case 'image':
                return <ImageView path={this.props.path} />;
            case 'zip':
                return <ZipView path={this.props.path} />;
            case 'pdf':
                return <PdfView path={this.props.path} />;
            case 'error':
                return <DataLoadingErrorElement />;
            default:
                return <Loading />;
        }
    }

    render() {
        return this.getComponent();
    }
}

export default FileView;
export {Loading, DataLoadingErrorElement};
