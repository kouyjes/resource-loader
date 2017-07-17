import { Loader,LoaderOption } from './loader';
class JsLoader extends Loader {
    createDom(){
        this.el = document.createElement('script');
    }
}
export { JsLoader }