import { Loader } from './loader';
function createCssLinkDom(){
    var el = document.createElement('link');
    el.type = 'text/css';
    el.rel = 'stylesheet';
    return el;
}
class CssLoader extends Loader{
    option:Object = {
        fileRule:/\.(css|less|scss|sass)$/
    };
    ele = null;
    constructor(option){
        Object.assign(this.option,option);
        this.ele = createCssLinkDom();
    }
    initResourceUrl(){
        this.ele.href = this.option.src;
    }
    appendToDom(){
        document.head.appendChild(this.ele);
    }
}