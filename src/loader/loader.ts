import {RequestQueueManager} from "./request-queue";
enum LoaderEnvModel{
    PRODUCT = 'product',
    DEVELOP = 'develop'
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
abstract class Loader {
    static ENV_MODE:LoaderEnvModel = LoaderEnvModel.PRODUCT;
    static GlobalParam = {};
    protected option:LoaderOption = {
        url:''
    };
    protected timestamp:number = nextId();
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
    }
    finalURL(){
        var url = this.option.url;
        var params = Object.assign({},Loader.GlobalParam);
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
        if(!url.endsWith('&')){
            url = url + '&';
        }
        url = url + queryString;
        return url;
    }
    abstract load():Promise;
    protected createLoadEvent(state:String = 'success'){
        return {
            state:state,
            url:this.finalURL()
        };
    }
    timeout(queueManager:RequestQueueManager,call){
        if(typeof this.option.timeout === 'number'){
            setTimeout(() => {
                var req = queueManager.getQueue(this.finalURL());
                if(!req){
                    return;
                }
                var index = req.calls.indexOf(call);
                if(index >= 0){
                    req.calls.splice(index,1);
                    call.reject(this.createLoadEvent('timeout'));
                }

            },this.option.timeout);
        }
    }
}

export { Loader,LoaderOption,LoaderEnvModel }