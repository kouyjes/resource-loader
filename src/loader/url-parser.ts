const urlDom = document.createElement('a');
class ResourceUrl{
    static parseUrl = function(baseURI,url){
        if(!baseURI){
            baseURI = '';
        }
        if(!url){
            url = '';
        }
        urlDom.href = url;
        if(urlDom.href === url || urlDom === url + '/'){
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl = prefixUrl.replace(/\/+$/,'');
        url = url.replace(/^ \/+/,'');
        return prefixUrl + '/' + url;
    };
}

export { ResourceUrl }