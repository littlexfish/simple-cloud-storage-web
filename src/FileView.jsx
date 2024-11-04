import React, {memo} from "react";
import {
    Alert,
    Breadcrumb,
    BreadcrumbItem,
    Button, Checkbox,
    Divider,
    Drawer, DrawerCloseButton,
    DrawerContent,
    DrawerContentBody,
    DrawerHead,
    DrawerPanelContent,
    Dropdown,
    DropdownItem,
    DropdownList, Flex, FlexItem, HelperText, HelperTextItem,
    List,
    ListItem,
    ListVariant,
    MenuToggle,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    MultipleFileUpload,
    MultipleFileUploadMain,
    MultipleFileUploadStatus,
    MultipleFileUploadStatusItem,
    Select,
    SelectList,
    SelectOption,
    SimpleList,
    SimpleListItem,
    Spinner,
    Split,
    SplitItem,
    Stack,
    StackItem, TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarGroup,
    ToolbarItem, Tooltip,
    TreeView
} from "@patternfly/react-core";
import {bytesToHumanReadable, getUrl, isFilenameValid} from "./file.service.js";
import ImageView from "./file-view/ImageView.jsx";
import TextView from "./file-view/TextView.jsx";
import ZipView from "./file-view/ZipView.jsx";
import PdfView from "./file-view/PdfView.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

class FileView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedDirectory: '',
            view: {
                onlyDirectory: false,
                showHidden: false,
            },
            drawerExpanded: false,
            windowWidth: window.innerWidth,
        }
    }

    componentDidMount() {
        window.addEventListener('resize', () => {
            this.setState({windowWidth: window.innerWidth});
        });
        setTimeout(() => {
            this.setState({drawerExpanded: this.state.windowWidth > 768});
        }, 100);
    }

    onDirectorySelect(directory) {
        this.setState({selectedDirectory: directory});
    }

    breakPath(path) {
        return path.split('/');
    }

    breadcrumbItem(name, path, isActive) {
        if (!isActive) {
            return <BreadcrumbItem key={path}>
                <Button variant="plain" isDisabled={true}>{name}</Button>
            </BreadcrumbItem>
        }
        return <BreadcrumbItem key={path}>
            <Button variant="link" onClick={this.onDirectorySelect.bind(this, path)}>{name}</Button>
        </BreadcrumbItem>
    }

    render() {
        const pathList = this.state.selectedDirectory ? this.breakPath(this.state.selectedDirectory) : [];
        return (
            <Drawer className="file-view" style={{height: '100vh'}} isExpanded={this.state.drawerExpanded}
                    isInline position="start">
                <DrawerContent panelContent={
                    <DrawerPanelContent isResizable defaultSize="250px" minSize="100px" maxSize="50vw">
                        <DrawerHead>
                            {this.state.windowWidth < 768 && <DrawerCloseButton style={{display: 'flex', justifyContent: 'end'}} onClose={() => this.setState({drawerExpanded: !this.state.drawerExpanded})} />}
                            <FileTree showHidden={this.state.view.showHidden} onlyDirectory={this.state.view.onlyDirectory} onDirectorySelect={this.onDirectorySelect.bind(this)} />
                        </DrawerHead>
                    </DrawerPanelContent>}>
                    <DrawerContentBody>
                        <Stack>
                            <StackItem>
                                <Flex>
                                    <FlexItem>
                                        <Button variant="plain" onClick={() => this.setState({drawerExpanded: !this.state.drawerExpanded})}>
                                            <FontAwesomeIcon icon="fas fa-bars" />
                                        </Button>
                                    </FlexItem>
                                    <Divider
                                        orientation={{
                                            default: 'vertical'
                                        }}
                                    />
                                    <FlexItem>
                                        <Breadcrumb style={{padding: '8px'}}>
                                            {this.breadcrumbItem('/', '', pathList.length !== 0)}
                                            {pathList.map((item, index) => {
                                                return this.breadcrumbItem(item, pathList.slice(0, index + 1).join('/'), index !== pathList.length - 1);
                                            })}
                                        </Breadcrumb>
                                    </FlexItem>
                                </Flex>
                            </StackItem>
                            <StackItem isFilled>
                                <DirectoryView showHidden={this.state.view.showHidden} onlyDirectory={this.state.view.onlyDirectory}
                                               onShowHiddenChange={(showHidden) => this.setState({view: {...this.state.view, showHidden: showHidden}})}
                                               onDirectorySelect={this.onDirectorySelect.bind(this)}
                                               selectedDirectory={this.state.selectedDirectory}/>
                            </StackItem>
                        </Stack>
                    </DrawerContentBody>
                </DrawerContent>
            </Drawer>
        );
    }
}

const DataLoadingErrorElement = memo((props) => <Alert {...props} className="nowrap" variant="danger" title="Error on loading data"></Alert>)
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
                icon: item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />,
                expandedIcon: item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder-open" /> : <FontAwesomeIcon icon="fas fa-file" />,
                children: item.isDirectory ? [] : null,
                // additional data
                isDirectory: item.isDirectory,
                isHidden: item.isHidden,
            };
        });
    }

    getNameFromApiDataItem(apiDataItem) {
        return <span className={apiDataItem.isHidden ? 'hidden' : ''} style={{textWrap: 'nowrap'}}>{apiDataItem.name}</span>;
    }

    filterTreeData(treeData) {
        let ret = treeData
        if (this.props.onlyDirectory || false) {
            ret = ret.filter(it => it.id === '<root>' || it.isDirectory);
        }
        if (!(this.props.showHidden || false)) {
            ret = ret.filter(it => it.id === '<root>' || !it.isHidden);
        }
        return ret;
    }

    injectRefItemAndCopy(item) {
        return {...item, ref: item};
    }

    filterTree(data) {
        if (data.id === '<root>' || !data.isDirectory || !Array.isArray(data.children)) return;
        data.children = data.children.map(it => this.injectRefItemAndCopy(it));
        data.children = this.filterTreeData(data.children);
        data.children.forEach(it => {
            this.filterTree(it);
        });
    }

    onTreeExpend(evt, item, parent) {
        const ref = item.ref !== undefined ? item.ref : item;
        const hasAnyChild = ref.children.length > 0;
        if (!hasAnyChild) {
            ref.children = [
                {
                    id: `${ref.id}/<loading>`,
                    name: <span><Spinner isInline={true}/> Loading...</span>
                }
            ];
            this.forceUpdate();
        }
        fetch(getUrl('/api/directory?path=' + ref.id))
            .catch(error => {
                console.error('Error:', error);
            })
            .then(response => response.json()).then(data => {
                const treeData = this.apiDataToTreeData(data);
                const idExists = ref.children
                    .map(it => it.id)
                    .filter(it => !it.endsWith('<loading>'));
                if (idExists.length === 0) {
                    ref.children = treeData;
                }
                else {
                    const newId = treeData.map(it => it.id);
                    const needAdd = treeData.filter(it => !idExists.includes(it.id));
                    let children = ref.children.filter(it => newId.includes(it.id));
                    children.push(...needAdd);
                    ref.children = children;
                }
                this.forceUpdate(() => {
                    const vScrollToItem = ref.children.length > 0 ? ref.children[0] : ref;
                    const hScrollToItem = ref.children.length > 0 ? ref.children.reduce((p, c) => p.id.length > c.id.length ? p : c, {id: ''}) : ref;
                    this.scrollToItem(vScrollToItem, hScrollToItem);
                });
        });
    }

    onNodeSelect(evt, item, parent) {
        const ref = item.ref !== undefined ? item.ref : item;
        this.setState({selected: [ref]}, () => {
            this.scrollToItem(ref, ref);
        });
        const selectId = Array.isArray(ref.children) ? ref.id : parent ? parent.id : '';
        this.props.onDirectorySelect && this.props.onDirectorySelect(selectId);
    }

    scrollToItem(vItem, hItem) {
        if (!vItem || !hItem) return;

        const scrollView = document.getElementsByClassName('pf-v6-c-drawer__panel-main')[0];
        const vUlElement = document.getElementById(vItem.id);
        const hUlElement = document.getElementById(hItem.id);
        if (!vUlElement || !hUlElement) return;

        const vTextElement = vUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);
        const hTextElement = hUlElement
            ?.querySelector(`.pf-v6-c-tree-view__node-container > :last-child`);
        if (!vTextElement || !hTextElement) return;

        const scrollRect = scrollView.getBoundingClientRect();
        const scrollContainerRect = scrollView.firstElementChild.getBoundingClientRect();
        const vUlRect = vUlElement.getBoundingClientRect();
        const hTextRect = hTextElement?.getBoundingClientRect() || {y: 0, x: 0, width: 0, height: 0};

        const vPos = vUlRect.y - scrollContainerRect.y + vUlRect.height / 2 - scrollRect.height / 2;
        const hPos = hTextRect.x - scrollContainerRect.x - 46 /* button padding */ - 22 /* icon width */;
        scrollView.scrollTo({
            top: vPos,
            left: hPos,
            behavior: 'smooth',
        });
    }

    render() {
        const renderTree = {
            id: '',
            children: this.state.data,
            // additional data
            isDirectory: true,
            isHidden: false,
        }
        this.filterTree(renderTree);
        return (
            <TreeView data={renderTree.children}
                      hasGuides={true}
                      useMemo={true}
                      activeItems={this.state.selected}
                      onExpand={this.onTreeExpend.bind(this)}
                      onSelect={this.onNodeSelect.bind(this)} />
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
            menu: {
                popup: false,
                x: 0,
                y: 0,
            },
            uploadModalOpen: false,
            deleteModalOpen: false,
            nameModal: {
                open: false,
                title: '',
                placeholder: '',
                content: '',
                confirmText: '',
                onConfirm: () => {},
            },
            renameModalOpen: false,
            renameModalContent: '',
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
                this.setState({isLoading: false, isError: false, files: files});
            });
    }

    reload() {
        this.setState({isLoading: true, isError: false});
        this.getFiles()
    }

    componentDidMount() {
        this.getFiles();
    }

    filterFiles(apiData) {
        let ret = apiData
        if (this.props.onlyDirectory || false) {
            ret = ret.filter(it => it.isDirectory);
        }
        if (!(this.props.showHidden || false)) {
            ret = ret.filter(it => !it.isHidden);
        }
        return ret;
    }

    apiDataToFiles(apiData) {
        const pathPrefix = apiData.path === '' ? '' : apiData.path + '/';
        return apiData.files.map((item) => {
            return {
                name: item.name,
                isDirectory: item.isDirectory,
                isHidden: item.isHidden,
                size: item.size,
                path: pathPrefix + item.name,
                isSelected: false,
            }
        });
    }

    buildNameLabel(item) {
        let classList = [];
        if (item.isHidden) {
            classList.push('hidden');
        }
        return <span className={classList.join(' ')}>{item.name}</span>;
    }

    onNewPath(path) {
        this.props.onDirectorySelect && this.props.onDirectorySelect(path);
    }

    onOpenFile(path) {
        this.unSelectAll();
        this.setState({openedFile: path});
    }

    tryOpenItem(item) {
        if (item.isDirectory) {
            this.onNewPath(item.path);
        }
        else {
            this.onOpenFile(item.path);
        }
    }

    unSelectAll() {
        this.state.files.forEach(it => it.isSelected = false);
        this.forceUpdate();
    }

    selectItem(item, ctrl, shift) {
        if (ctrl || shift) {
            item.isSelected = !item.isSelected;
        }
        else {
            this.unSelectAll();
            item.isSelected = true;
        }
        this.forceUpdate();
    }

    buildSimpleListItem(item) {
        return <SimpleListItem key={item.path}
                               className={item.isSelected ? 'selected' : ''}
                               itemId={item.path}
                               onDoubleClick={this.tryOpenItem.bind(this, item)}
                               isActive={item.isSelected}
                               onContextMenu={(evt) => this.selectItem(item, evt.ctrlKey, evt.shiftKey)}
                               onClick={(evt) => this.selectItem(item, evt.ctrlKey, evt.shiftKey)}>
            <Split hasGutter>
                <SplitItem>
                    {item.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />}
                </SplitItem>
                <SplitItem isFilled>
                    {this.buildNameLabel(item)}
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

    getFilename(path) {
        const idx = path.lastIndexOf('/')
        return idx === -1 ? path : path.slice(idx + 1)
    }

    download(files) {
        files.forEach(file => {
            fetch(getUrl('/api/file/download?path=' + file))
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // a.target = '_blank';
                    a.download = this.getFilename(file);
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                });
        })
    }

    getSelectedFiles() {
        return this.state.files.filter(it => it.isSelected);
    }

    setContextOpen(isOpen) {
        this.setState({menu: {...this.state.menu, popup: isOpen}});
    }

    contextToggle(ref) {
        return <div ref={ref} style={{position: 'absolute', top: this.state.menu.y, left: this.state.menu.x}}></div>
    }

    onContextMenu(evt) {
        evt.preventDefault();
        this.setContextOpen(false); // force close dropdown
        setTimeout(() => {
            this.setState({menu: {x: evt.clientX, y: evt.clientY, popup: true}});
        }, 10); // reopen dropdown
    }

    closeNameModal() {
        this.setState({nameModal: {...this.state.nameModal, open: false}});
    }

    rename(name, newName) {
        const selected = this.getSelectedFiles()[0].path;
        fetch(getUrl('/api/file/rename?path=' + selected), {
            method: 'PUT',
            body: newName
        })
            .then(res => res.json())
            .then(data => this.reload())
            .catch(err => {
                console.error(err);
            });
    }

    delete(rec) {
        const selected = this.getSelectedFiles();
        Promise.all(selected.map(it => {
            return fetch(getUrl('/api/file/delete?path=' + it.path + '&recursive=' + rec), {
                method: 'DELETE'
            })
        }))
            .then(res => Promise.all(res.map(it => it.json())))
            .then(data => this.reload())
            .catch(err => {
                console.error(err);
            });
        this.setState({deleteModalOpen: false});
    }

    openRenameModal() {
        const oldName = this.getSelectedFiles()[0].name;
        this.setState({nameModal: {open: true, title: 'Rename',
                confirmText: 'Rename', placeholder: oldName,
                content: oldName, onConfirm: () => {
                    this.rename(oldName, this.state.nameModal.content);
                    this.closeNameModal();
                }}});
    }

    createDir(name) {
        fetch(getUrl('/api/directory/create?path=' + this.props.selectedDirectory + '/' + name), {
            method: 'POST'
        })
            .then(res => res.json())
            .then(data => this.reload())
            .catch(err => {
                console.error(err);
            });
    }

    openCreateDirModal() {
        this.setState({nameModal: {open: true, title: 'Create Directory',
                confirmText: 'Create', placeholder: '<new>',
                content: 'New Directory', onConfirm: () => {
                    this.createDir(this.state.nameModal.content);
                    this.closeNameModal();
                }}})
    }

    getDropdownItems(selectedFiles) {
        const hasSelectedFiles = selectedFiles.length > 0;
        const hasMultiSelectedFiles = selectedFiles.length > 1;
        const onlyOneSelectedFile = selectedFiles.length === 1;
        return <>
            <DropdownItem icon={<FontAwesomeIcon icon="fas fa-upload" />} onClick={() => this.setState({uploadModalOpen: true})}>Upload</DropdownItem>
            <DropdownItem icon={<FontAwesomeIcon icon="fas fa-folder-plus" />} onClick={() => this.openCreateDirModal()}>New Directory</DropdownItem>
            {onlyOneSelectedFile && <>
                <Divider component="li" key="separator" />
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-pen-to-square" />} onClick={() => this.openRenameModal()}>Rename</DropdownItem>
            </>}
            {hasSelectedFiles && <>
                <Divider component="li" key="separator" />
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-arrow-up-right-from-square" />}
                              onClick={this.tryOpenItem.bind(this, selectedFiles[0])}>Open{hasMultiSelectedFiles && ' First File/Directory'}</DropdownItem>
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-download" />}
                              onClick={() => this.download(selectedFiles.filter(it => !it.isDirectory).map(it => it.path))}>Download</DropdownItem>
                <DropdownItem icon={<FontAwesomeIcon icon="fas fa-trash" />} isDanger
                              onClick={() => this.setState({deleteModalOpen: true})}>Delete</DropdownItem>
            </>}
        </>
    }

    getToolbarItems(selectedFiles) {
        const hasSelectedFiles = selectedFiles.length > 0;
        const hasMultiSelectedFiles = selectedFiles.length > 1;
        const onlyOneSelectedFile = selectedFiles.length === 1;
        return <>
            <ToolbarGroup alignSelf="center">
                <ToolbarItem variant="label" alignItems="center">
                    <Tooltip content={<>{this.props.showHidden ? 'Hide' : 'Show'} Hidden Files</>}>
                        <Button variant="link" onClick={() => (this.props.onShowHiddenChange || (() => {}))(!this.props.showHidden)}>
                            {this.props.showHidden ? <FontAwesomeIcon icon="fas fa-eye-slash" /> : <FontAwesomeIcon icon="fas fa-eye" />}
                        </Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup alignSelf="center"
                          visibility={{default: hasMultiSelectedFiles ? "visible" : "hidden"}}>
                <ToolbarItem variant="label" alignItems="center">
                    Select {selectedFiles.length} files
                </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup variant="label-group"></ToolbarGroup>
            <ToolbarGroup visibility={{default: hasSelectedFiles ? "visible" : "hidden"}}>
                <ToolbarItem>
                    <Tooltip content={<>Open{hasMultiSelectedFiles && ' First File/Directory'}</>}>
                        <Button variant="link" onClick={this.tryOpenItem.bind(this, selectedFiles[0])}>
                            <FontAwesomeIcon icon="fas fa-arrow-up-right-from-square" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: hasSelectedFiles ? "visible" : "hidden"}}>
                    <Tooltip content="Download">
                        <Button variant="link" onClick={() => this.download(selectedFiles.filter(it => !it.isDirectory).map(it => it.path))}>
                            <FontAwesomeIcon icon="fas fa-download" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem>
                    <Tooltip content="Delete">
                        <Button variant="link" isDanger onClick={() => this.setState({deleteModalOpen: true})}>
                            <FontAwesomeIcon icon="fas fa-trash" />
                        </Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: onlyOneSelectedFile ? "visible" : "hidden"}}>
                    <Tooltip content="Rename">
                        <Button variant="link" onClick={() => this.openRenameModal()}><FontAwesomeIcon icon="fas fa-pen-to-square" /></Button>
                    </Tooltip>
                </ToolbarItem>
                <ToolbarItem visibility={{default: hasMultiSelectedFiles ? "visible" : "hidden"}}>
                    <Tooltip content="Unselect All">
                        <Button variant="link" onClick={this.unSelectAll.bind(this)}><FontAwesomeIcon icon="fas fa-ban" /></Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
            {hasSelectedFiles && <ToolbarItem variant="separator" />}
            <ToolbarGroup>
                <ToolbarItem>
                    <Tooltip content="New Directory">
                        <Button variant="link" onClick={() => this.openCreateDirModal()}><FontAwesomeIcon icon="fas fa-folder-plus" /></Button>
                    </Tooltip>
                    <Tooltip content="Upload">
                        <Button variant="link" onClick={() => this.setState({uploadModalOpen: true})}><FontAwesomeIcon icon="fas fa-upload" /></Button>
                    </Tooltip>
                </ToolbarItem>
            </ToolbarGroup>
        </>
    }

    render() {
        const selectedFiles = this.getSelectedFiles();
        const closeUploadModal = () => this.setState({uploadModalOpen: false});
        const closeDeleteModal = () => this.setState({deleteModalOpen: false});
        const showContent = this.filterFiles(this.state.files)
        return (
            <Stack className="directory-view">
                <StackItem>
                    <Toolbar inset={{default: 'insetMd'}} colorVariant="primary" isSticky={true}>
                        <ToolbarContent alignItems="center">{this.getToolbarItems(selectedFiles)}</ToolbarContent>
                    </Toolbar>
                </StackItem>
                <StackItem isFilled onContextMenu={this.onContextMenu.bind(this)} style={{overflow: 'auto'}}>
                    {
                        this.state.isLoading ? <Loading /> :
                            this.state.isError ? <DataLoadingErrorElement /> :
                                showContent.length > 0 ?
                                    <SimpleList isControlled={false}>
                                        {showContent.map(this.buildSimpleListItem.bind(this))}
                                    </SimpleList> :
                                    ''
                    }
                </StackItem>
                <Dropdown isOpen={this.state.menu.popup}
                          onSelect={this.setContextOpen.bind(this, false)}
                          onOpenChange={this.setContextOpen.bind(this)}
                          toggle={this.contextToggle.bind(this)}
                          popperProps={{preventOverflow: true}}>
                    <DropdownList>
                        {this.getDropdownItems(selectedFiles)}
                    </DropdownList>
                </Dropdown>
                <Modal variant="medium"
                       disableFocusTrap
                       isOpen={this.state.openedFile !== null}
                       onEscapePress={this.onOpenFile.bind(this, null)}
                       onClose={this.onOpenFile.bind(this, null)}>
                    <ModalHeader title={this.getFilename(this.state.openedFile || '')} />
                    <ModalBody>
                        <FileContentView path={this.state.openedFile} />
                    </ModalBody>
                    <ModalFooter style={{justifyContent: 'end'}}>
                        <Button variant="link" onClick={() => this.download([this.state.openedFile])}>Download</Button>
                    </ModalFooter>
                </Modal>
                <FileUploadModal path={this.props.selectedDirectory} onUploadReload={() => this.reload()}
                                 isOpen={this.state.uploadModalOpen} onClose={closeUploadModal} />
                <Modal variant="medium"
                       disableFocusTrap
                       isOpen={this.state.deleteModalOpen}
                       onEscapePress={closeDeleteModal}>
                    <ModalHeader titleIconVariant="danger" title="Are you sure you want to delete the followings files?"/>
                    <ModalBody>
                        <List variant={ListVariant.inline} style={{padding: '0 8px'}}>
                            {selectedFiles.map(it => {
                                return <ListItem key={it.name}
                                                 icon={it.isDirectory ? <FontAwesomeIcon icon="fas fa-folder" /> : <FontAwesomeIcon icon="fas fa-file" />}>
                                    {this.buildNameLabel(it)}
                                </ListItem>
                            })}
                        </List>
                    </ModalBody>
                    <ModalFooter style={{justifyContent: 'end'}}>
                        <Button variant="link" onClick={closeDeleteModal}>Cancel</Button>
                        <Button variant="link" isDanger onDoubleClick={() => this.delete(true)}>Delete Recursively(Double Click)</Button>
                        <Button variant="link" isDanger onDoubleClick={() => this.delete(false)}>Delete(Double Click)</Button>
                    </ModalFooter>
                </Modal>
                <NameModal isOpen={this.state.nameModal.open} title={this.state.nameModal.title} placeholder={this.state.nameModal.placeholder}
                           content={this.state.nameModal.content} confirmText={this.state.nameModal.confirmText}
                           onCancel={this.closeNameModal.bind(this)} onConfirm={this.state.nameModal.onConfirm}
                           onChangeContent={(content) => this.setState({nameModal: {...this.state.nameModal, content: content}})} />
            </Stack>
        );
    }
}

class NameModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const onCancel = this.props.onCancel || (() => {})
        const valid = isFilenameValid(this.props.content)
        return <Modal variant="small"
                      disableFocusTrap
                      isOpen={this.props.isOpen || false}
                      onEscapePress={onCancel}
                      onClose={onCancel}>
            <ModalHeader title={this.props.title || ""} />
            <ModalBody>
                <TextInput placeholder={this.props.placeholder} value={this.props.content} type="text"
                           validated={valid ? 'success' : 'error'}
                           onChange={(evt, value) => (this.props.onChangeContent || (() => {}))(value)}/>
                <HelperText>
                    {!valid && <HelperTextItem variant="error">
                        Filename is invalid<br />
                        <List>
                            <ListItem>Must not be empty</ListItem>
                            <ListItem>Must not be . or ..</ListItem>
                            <ListItem>Must not contain / \ * : &lt; &gt; ? &#34; |</ListItem>
                            <ListItem>Must not have a space at the beginning or end</ListItem>
                        </List>
                    </HelperTextItem>}
                </HelperText>
            </ModalBody>
            <ModalFooter style={{justifyContent: 'end'}}>
                <Button variant="link" isDisabled={!valid} onClick={this.props.onConfirm || (() => {})}>
                    {this.props.confirmText || "Confirm"}
                </Button>
            </ModalFooter>
        </Modal>
    }
}

class FileUploadModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            uploadFiles: [],
            existsNames: [],
            processFiles: [],
            finishFiles: [],
        }
        this.reloadTimer = null;
        this.reloadInterval = 1000;
    }

    reloadFiles() {
        clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(this.props.onUploadReload || (() => {}), this.reloadInterval);
    }

    /**
     * @param files {File[]}
     */
    onFilesUpload(files) {
        this.setState({uploadFiles: files}, () => {
            fetch(getUrl('/api/file/exists?path=' + this.props.path), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(files.map(it => it.name))
            })
                .then(res => res.json())
                .then(data => {
                    const existsNames = data.filter(it => it.isDirectory !== null);
                    if (existsNames.length > 0) {
                        this.setState({existsNames: existsNames.map(it => it.name)});
                    }
                    else {
                        this.setState({processFiles: files}, () => this.uploadFiles());
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        });
    }

    setProcessingFileStatus(file, state) {
        const files = this.state.finishFiles;
        const index = files.findIndex(it => it.file === file);
        if (index !== -1) {
            files[index].state = state;
        }
        else {
            files.push({file: file, state: state, reloaded: false});
        }
        this.forceUpdate();
    }

    uploadFile(file) {
        this.removeFileFromProcessing(file);
        const formData = new FormData();
        formData.set('file', file);
        const xhr = new XMLHttpRequest();
        xhr.onloadstart = () => {
            this.setProcessingFileStatus(file, '0');
        }
        xhr.onload = () => {
            this.setProcessingFileStatus(file, 'success');
            this.reloadFiles();
        }
        xhr.onerror = () => {
            this.setProcessingFileStatus(file, 'error');
        }
        xhr.onprogress = (evt) => {
            if (evt.lengthComputable) {
                const percentComplete = (evt.loaded / evt.total) * 100;
                this.setProcessingFileStatus(file, '' + percentComplete);
            }
        }
        xhr.open('POST', getUrl('/api/file/upload?path=' + this.props.path), true);
        xhr.send(formData);
    }

    uploadFiles() {
        this.state.processFiles.forEach(it => {
            this.uploadFile(it);
        });
    }

    removeFileFromProcessing(file) {
        const files = this.state.uploadFiles;
        const index = files.findIndex(it => it === file);
        if (index !== -1) {
            files.splice(index, 1);
            this.setState({uploadFiles: files});
        }
    }

    removeFileFromFinish(file) {
        const files = this.state.finishFiles;
        const index = files.findIndex(it => it === file);
        if (index !== -1) {
            files.splice(index, 1);
            this.setState({finishFiles: files});
        }
    }

    onClose() {
        this.setState({uploadFiles: [], processFiles: [], finishFiles: []});
        this.props.onClose();
    }

    render() {
        const finishFiles = this.state.finishFiles;
        const successFiles = finishFiles.filter(it => it.state === 'success');
        const errorFiles = finishFiles.filter(it => it.state === 'error');
        const finishCount = successFiles.length + errorFiles.length;
        const hasErrorFiles = errorFiles.length > 0;
        return <Modal variant="medium"
                      disableFocusTrap
                      isOpen={this.props.isOpen}
                      onEscapePress={this.onClose.bind(this)}
                      onClose={this.onClose.bind(this)}>
            <ModalHeader title={"Upload Files"} />
            <ModalBody>
                <MultipleFileUpload
                    onFileDrop={(evt, files) => this.onFilesUpload(files)}>
                    <MultipleFileUploadMain
                        titleIcon={<FontAwesomeIcon icon="fas fa-upload" size="2x" />}
                        titleText="Drag and drop files here"
                        titleTextSeparator="or"
                    />
                    {this.state.finishFiles.length > 0 && (
                        <MultipleFileUploadStatus
                            statusToggleText={`${finishCount} of ${finishFiles.length} files uploaded`}
                            statusToggleIcon={finishCount < finishFiles.length ? 'inProgress' : hasErrorFiles ? 'danger' : 'success'}>
                            {this.state.finishFiles.map(file => <MultipleFileUploadStatusItem
                                key={file.file.name}
                                file={file.file} onClearClick={this.removeFileFromFinish.bind(this, file)}
                                progressValue={file.state === 'success' ? 100 : isNaN(file.state) ? 0 : +file.state}
                                progressVariant={file.state === 'error' ? 'danger' : 'success'}>
                            </MultipleFileUploadStatusItem>)}
                        </MultipleFileUploadStatus>
                    )}
                </MultipleFileUpload>
            </ModalBody>
            <Modal variant="medium"
                   disableFocusTrap
                   isOpen={this.state.existsNames.length > 0}
                   onEscapePress={() => this.setState({existsNames: []})}
                   onClose={() => this.setState({existsNames: []})}>
                <ModalHeader titleIconVariant="warning" title="Files Exists" />
                <ModalBody>
                    Following files already exists:
                    <List>
                        {this.state.existsNames.map(it => {
                            return <ListItem key={it}>
                                {it}
                            </ListItem>
                        })}
                    </List>
                </ModalBody>
                <ModalFooter style={{justifyContent: 'end'}}>
                    <Button variant="link" onClick={() => this.setState({existsNames: [], uploadFiles: []})}>Cancel</Button>
                    <Button variant="link"
                            onClick={() => this.setState({existsNames: [],
                                processFiles: this.state.uploadFiles.filter(it => !this.state.existsNames.includes(it.name))},
                                () => this.uploadFiles())}>Upload Not Exists</Button>
                    <Button variant="link" isDanger
                            onClick={() => this.setState({existsNames: [], processFiles: [...this.state.uploadFiles]}, () => this.uploadFiles())}>Override</Button>
                </ModalFooter>
            </Modal>
        </Modal>
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

