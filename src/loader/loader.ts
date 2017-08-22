
function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
/**
 * loader config option
 * url: resource url
 * params: url query params eg:{code:123}
 * timeout: load timeout in ms
 */
interface LoaderOption{
    url:String;
    params?:Object;
    timeout?:number;
}

var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    }
})();
/**
 * base abstract class loader
 */
const RequestCache = {};
class Loader {
    protected option:LoaderOption = {
        url:''
    };
    protected timestamp:number = nextId();
    protected el:HTMLElement = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
    }
    protected appendToDom() {
        document.head.appendChild(this.el);
    }
    protected isExistEl();
    protected createDom(){}
    protected finalURL(){
        var url = this.option.url;
        var params = this.option.params;
        if(!params){
            return url;
        }
        var queryArray= Array<String>();
        Object.keys(params).forEach(function (name) {
            var value = params[name];
            if(value){
                queryArray.push(name + '=' + value);
            }
        });
        if(queryArray.length === 0){
            return url;
        }
        var queryString = queryArray.join('&');
        if(this.option.url.indexOf('?') === -1){
            queryString = '?' + queryString;
        }
        url = url + queryString;
        return url;
    }
    protected createLoadEvent(state:String = 'success'){
        return {
            state:state,
            url:this.finalURL(),
            target:this.el
        };
    }

    load(force = false):Promise{

        if(force){
            return this._load();
        }
        var url = this.finalURL();
        var request = RequestCache[url];

        var resolve,reject;
        var p = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });

        var call = {
            resolve:resolve,
            reject:reject
        };
        if(!request){
            if(this.isExistEl()){
                resolve(this.createLoadEvent('success'));
                return p;
            }
            request = RequestCache[url] = {
                status:1,
                calls:[p]
            };
        }else{
            if(request.status === 1){
                resolve(request.data);
            }else if(request.status === 2){
                reject(request.data);
            }else{
                request.calls.push(call);
            }

            return p;
        }

        this._load().then(function (result) {
            var req = RequestCache[url];
            req.data = result;
            req.status = 1;
            req.calls.forEach(function (req) {
                var resolve = req.resolve;
                try{
                    resolve(result)
                }catch(e){
                    console.error(e);
                }
            });
            req.calls.length = 0;
        }, function (e) {
            var req = RequestCache[url];
            req.data = e;
            req.status = 2;
            req.calls.forEach(function (req) {
                var reject = req.resolve;
                try{
                    console.error(e);
                    reject(e);
                }catch(err){
                    console.error(err);
                }
            });
            req.calls.length = 0;
        });

        if(typeof this.option.timeout === 'number'){
            setTimeout(() => {
                var req = RequestCache[url];
                var index = req.calls.indexOf(call);
                if(index >= 0){
                    req.calls.splice(index,1);
                    call.reject(this.createLoadEvent('timeout'));
                }

            },this.option.timeout);
        }

        return p;
    }
    /**
     * start load
     * @returns {Promise<T>}
     */
    _load():Promise {

        this.createDom();
        var el = this.el;

        var onLoadFn, onErrorFn;
        var promise = new Promise((resolve, reject) => {
            onLoadFn = wrapperFn(resolve);
            onErrorFn = wrapperFn(reject);
        });

        el.onload = el['onreadystatechange'] = () => {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText)) return;
            onLoadFn(this.createLoadEvent('success'));
        };
        el.onerror = () => {
            var comment = document.createComment('Loader load error, Url: ' + this.option.url + ' ,loadTime:' + (new Date()));
            if(el.parentNode){
                el.parentNode.replaceChild(comment,el);
            }else{
                document.head.appendChild(comment);
            }
            onErrorFn(this.createLoadEvent('error'));
        };

        this.appendToDom();

        return promise;
    }
}

export { Loader,LoaderOption,LoaderState }