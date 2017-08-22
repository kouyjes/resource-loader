import { Loader,LoaderOption,LoaderState } from './loader';
import { ResourceUrl } from '../loader/url-parser';

class JsLoader extends Loader {
    protected isExistEl(){
        var url = this.finalURL();
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'),0);
        return scripts.some(function (scr) {
            var src = scr.src;
            if(!src){
                return;
            }

            src = ResourceUrl.parseUrl('',src);
            if(src === url){
                return true;
            }
        });
    }
    protected createDom(){
        this.el = document.createElement('script');
        this.el.src = this.finalURL();
    }
}
export { JsLoader }