# promise
## api ##
<pre>
1.var deferred = $Promise.deferred();
async-callback(function(data){
  deferred.resolve(data);
});
return deferred.promise;
2.new $Promise(function(resolve,reject){
  async-callback(function(data){
    resolve(data);
  });
});
</pre>
