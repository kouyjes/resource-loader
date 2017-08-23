
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
abstract class Loader {
    static GlobalParam = {};
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
    protected isExistEl(){};
    protected createDom(){}
    finalURL(){
        var url = this.option.url;
        var params = Loader.GlobalParam || {};
        var userParams = this.option.params;
        if(userParams){
            Object.assign(params,userParams);
        }
        var queryArray= Array<String>();
        var keys = Object.keys(params);
        keys.sort(function (v1,v2) {
            if(v1 > v2){
                return 1;
            }else if(v1 < v2){
                return -1;
            }
            return 0;
        });
        keys.forEach(function (name) {
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
    static executeCalls(loader:Loader,type:String,data){
        var req = RequestCache[loader.finalURL()];
        if(!req){
            return;
        }
        req.data = data;
        if(type === 'resolve'){
            req.status = 1;
        }else if(type === 'reject'){
            req.status = 2;
            console.error(data);
        }
        req.calls.forEach(function (call) {
            var fn = call[type];
            try{
                fn(data)
            }catch(e){
                console.error(e);
            }
        });
        req.calls.length = 0;

    }
    load(force = false):Promise{

        if(force){
            return this._load();
        }
        var url = this.finalURL();
        var request = RequestCache[url];

        var resolve = null,reject = null;
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
            RequestCache[url] = {
                status:0,
                calls:[call]
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
        this._load().then((result) => {
            Loader.executeCalls(this,'resolve',result);
        }, function (e) {
            Loader.executeCalls(this,'reject',e);
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

export { Loader,LoaderOption }