/**
 * Created by koujp on 2017/6/27.
 */
var $Promise = (function () {
    function Promise(){
        this.state = {
            code:0, //1:success 2:error
            data:undefined
        };
        this.success = null;
        this.error = null;
        this.deferred = null;
    }
    Promise.prototype.then = function (success,error) {

        if(typeof success === 'function'){
            this.success = success;
        }
        if(typeof error === 'function'){
            this.error = error;
        }
        this.deferred = new Deferred();
        if(this.state.code !== 0){
            this.execute();
        }
        return this.deferred.promise;
    };
    function isPromise(p){
        return typeof p.then === 'function';
    }
    Promise.prototype.execute = function () {

        var executeType = this.state.code === 1 ? 'success' : 'error';
        var result = this.state.data;
        var promise = this;
        var executeResult = null;
        try{
            executeResult = promise[executeType] && promise[executeType](result) || result;
        }catch(e){
            if(promise.deferred && promise.deferred.promise.deferred){
                promise.deferred.promise.deferred.reject(e);
            }
            return;
        }
        if(isPromise(executeResult)){
            executeResult.then(function (r) {
                if(promise.deferred){
                    promise.deferred.resolve(r);
                }
            }, function (e) {
                if(promise.deferred){
                    promise.deferred.reject(e);
                }
            });
            return;
        }

        if(promise.deferred){
            if(this.state.code === 1){
                promise.deferred.resolve(executeResult);
            }else {
                if(promise[executeType]){
                    promise.deferred.resolve(executeResult);
                }else{
                    promise.deferred.reject(executeResult);
                }
            }

        }
    };
    function Deferred(){
        this.promise = new Promise();
    }
    Deferred.prototype.resolve = function (result) {

        var promise = this.promise;
        promise.state.code = 1;
        promise.state.data = result;
        if(!promise.deferred){
            return;
        }
        promise.execute();
    };
    Deferred.prototype.reject = function (result) {

        var promise = this.promise;
        promise.state.code = 2;
        promise.state.data = result;
        if(!promise.deferred){
            return;
        }
        promise.execute();
    };
    function $Promise(func){
        if(typeof func !== 'function'){
           throw new TypeError('need a function argument');
        }
        var deferred = new Deferred();
        func(deferred.resolve.bind(deferred),deferred.reject.bind(deferred));
        return deferred.promise;
    }
    $Promise.deferred = function(){
        return new Deferred();
    };
    $Promise.all = function (promises) {
        var deferred = new Deferred();
        if(promises && !(promises instanceof Array)){
            promises = [].concat(promises);
        }else if(!promises){
            deferred.resolve();
            return deferred.promise;
        }
        var promiseCount = promises.length,
            promiseDatas = [];
        promises.forEach(function (p,index) {
            p.then(function (data) {
                if(promiseCount < 0){
                    return;
                }
                promiseCount--;
                promiseDatas[index] = data;
                if(promiseCount === 0){
                    deferred.resolve(promiseDatas);
                }
            }, function () {
                deferred.reject();
                promiseCount = -1;
            });
        });
        return deferred.promise;
    };
    return $Promise;
})();