import {Loader} from "./loader";
import {RequestQueueManager,RequestQueue} from "./request-queue";
const textQueueManager = new RequestQueueManager();
class TextLoader extends Loader{
    load():Promise{
        var resolve = null,reject = null;
        var call = {
            resolve:null,
            reject:null
        };
        var promise = new Promise(function (_resolve,_reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        var url = this.finalURL();
        var request = textQueueManager.getQueue(url);
        if(!request){
            request = new RequestQueue({
                calls:[call]
            });
            textQueueManager.putQueue(url,request);
        }else{
            if(request.status === 0){
                request.calls.push(call);
                return promise;
            }
        }
        this._load().then((result) => {
            textQueueManager.executeQueue(url,'resolve',result);
            textQueueManager.removeQueue(url);
        }, (e) => {
            textQueueManager.executeQueue(url,'reject',e);
            textQueueManager.removeQueue(url);
        });

        this.timeout(textQueueManager,call);

        return promise;
    }
    _load():Promise{
        var url = this.finalURL();
        var resolve,reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        try{
            xhr.open('GET',url,true);
            xhr['onreadystatechange'] = () => {
                if(xhr.readyState !== 4){
                    return;
                }
                var status = xhr.status;
                var isSuccess = status >= 200 && status < 300 || status === 304;
                if(isSuccess){
                    resolve(xhr.responseText);
                }else{
                    reject(this.createLoadEvent('error'));
                }
            }
            xhr.send();
        }catch(e){
            console.error(e);
            reject && reject(this.createLoadEvent('error'));
        }

        return promise;
    }
}
export { TextLoader }