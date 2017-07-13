import { Loader } from './loader';
function createScriptDom(){
    return document.createElement('script');
}
class JsLoader extends Loader{
    option:Object = {
        fileRule:/\.(js|ts)$/
    };
    ele = null;
    constructor(option){
        Object.assign(this.option,option);
        this.ele = createScriptDom();
    }
    appendToDom(){
        document.head.appendChild(this.ele);
    }
}