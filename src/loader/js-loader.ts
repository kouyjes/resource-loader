import { Loader,LoaderOption } from './loader';
class JsLoader extends Loader {
    static fileRule:RegExp = /\.(js|ts)$/;
    static urlMatch = function (url) {
        return JsLoader.fileRule.test(url);
    };
    option:LoaderOption = {
        url:''
    };
    createDom(){
        this.el = document.createElement('script');
    }
    appendToDom() {
        document.head.appendChild(this.el);
    }
}
Loader.loaders.push(JsLoader);
export { JsLoader }