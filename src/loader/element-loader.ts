import {LoaderOption} from "./loader";
import {Loader} from "./loader";
function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
/**
 * base abstract class loader
 */
abstract class ElementLoader extends Loader{
    protected el:HTMLElement = null;
    constructor(option?:LoaderOption) {
        super(option);
    }
    protected abstract appendToDom(el:HTMLElement);
    protected isExistEl(){
        return false;
    };
    protected abstract createDom();
    protected createLoadEvent(state:String = 'success'){
        return {
            state:state,
            url:this.finalURL(),
            target:this.el
        };
    }
    protected appendAttributes(el){
        if(!el){
            return;
        }
        var attributes = this.option.attributes || {};
        Object.keys(attributes).forEach(function(key){
            if(typeof key !== 'string'){
                return;
            }
            var value = attributes[key];
            if(['number','boolean','string'].indexOf(typeof value) >= 0){
                el.setAttribute(key,String(value));
            }
        });
    }
    load():Promise{
        return this._load();
    }
    /**
     * start load
     * @returns {Promise<T>}
     */
    _load():Promise {

        this.createDom();
        var el = this.el;

        this.appendAttributes(el);

        var onLoadFn, onErrorFn;
        var promise = new Promise((resolve, reject) => {
            onLoadFn = wrapperFn(resolve);
            onErrorFn = wrapperFn(reject);
        });

        el.onload = el['onreadystatechange'] = () => {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText)) return;
            onLoadFn(this.createLoadEvent('success'));
            el.onload = el['onreadystatechange'] = null;
        };
        el.onerror = () => {
            var comment = document.createComment('Loader load error, Url: ' + this.option.url + ' ,loadTime:' + (new Date()));
            if(el.parentNode){
                el.parentNode.replaceChild(comment,el);
            }
            onErrorFn(this.createLoadEvent('error'));
        };

        this.appendToDom(el);

        return promise;
    }
}

export { ElementLoader }