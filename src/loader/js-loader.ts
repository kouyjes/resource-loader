import { Loader,LoaderOption,LoaderState } from './loader';
import { ResourceUrl } from '../loader/url-parser';
class JsLoader extends Loader {
    private getExistElement(url){
        url = ResourceUrl.parseUrl('',url);
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'),0);
        var script = null;
        scripts.some(function (scr) {
            var src = scr.src;
            if(!src){
                return;
            }
            src = src.replace(/\?.*/,'');
            src = ResourceUrl.parseUrl('',src);
            if(src === url){
                script = scr;
                return true;
            }
        });
        return script;
    }
    protected createDom(){
        this.el = this.getExistElement(this.option.url);
        if(!this.el){
            this.el = document.createElement('script');
            this.el.src = this.tokenUrl();
            this.loadState(LoaderState.Init);
        }
    }
}
export { JsLoader }