import { Loader,LoaderOption } from './loader';
class CssLoader extends Loader {
    static fileRule:RegExp = /\.(css|less|scss|sass)$/;
    static urlMatch = function (url) {
        return CssLoader.fileRule.test(url);
    };
    option:LoaderOption = {
        url:''
    };
    createDom(){
        var el = document.createElement('link');
        el.type = 'text/css';
        el.rel = 'stylesheet';
        this.el = el;
    }
    initResourceUrl() {
        this.el.href = this.option.url;
    }

    appendToDom() {
        document.head.appendChild(this.el);
    }
}
Loader.loaders.push(CssLoader);
export { CssLoader }