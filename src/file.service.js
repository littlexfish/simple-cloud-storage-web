
function getUrl(pathWithQuery) {
    let baseUrl = 'http://localhost:9000';
    let afterBase = pathWithQuery;
    if (!pathWithQuery.startsWith('/')) {
        afterBase = '/' + pathWithQuery;
    }
  return `${baseUrl}${afterBase}`;
}

export { getUrl };