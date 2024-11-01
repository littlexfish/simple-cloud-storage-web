
function getUrl(pathWithQuery) {
    let baseUrl = 'http://localhost:9000';
    let afterBase = pathWithQuery;
    if (!pathWithQuery.startsWith('/')) {
        afterBase = '/' + pathWithQuery;
    }
  return `${baseUrl}${afterBase}`;
}

function bytesToHumanReadable(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

export { getUrl, bytesToHumanReadable };