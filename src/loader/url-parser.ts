const urlDom = document.createElement('a');
class ResourceUrl{
    static parseUrl = function(baseURI,url){
        if(!url){
            url = '';
        }
        urlDom.href = url;
        if(!baseURI){
            return urlDom.href;
        }
        if(url.match('/^\//')){
            return urlDom.href;
        }
        urlDom.href = url;
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