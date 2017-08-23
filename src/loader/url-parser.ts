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
        if(url.match('/^\//')){
            return urlDom.href;
        }
        if(urlDom.href === url || urlDom.href === url + '/'){
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl = prefixUrl.replace(/\/+$/,'');
        url = url.replace(/^\/+/,'');
        return prefixUrl + '/' + url;
    };
}

export { ResourceUrl }