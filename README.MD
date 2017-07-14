## Getting Started
### Define Resource
1.Resource declaration
```javascript
    interface Resource {
        type:String;
        urls:String[]; // js || css
        serial?:Boolean;
        dependence?:Resource;
    }
```
2.parallel load resource urls 
```javascript
    var resource = {
        type:'js',
        urls:['test/a.js']
    };
```
3.serial load resource urls
```javascript
    var resource = {
        type:'js',
        serial:true,
        urls:['test/a.js']
    };
```
4.with dependence
```javascript
    var resource = {
        type:'js',
        urls:['test/a.js'],
        dependence:{
            type:'js',
            urls:['test/b.js']
        }
    };
    // load: b.js --> a.js
```
5.css resource
```javascript
    var resource = {
        type:'css',
        urls:['test/a.css']
    };
```
### start load resource
1.Define ResourceLoader
```javascript
    interface ResourceLoaderOption {
        baseURI?:String; // Define load baseURI
        useCache?:Boolean; // if use Cache
        loaderTimeout?:number; // timeout of ervery item
        timeout?:number; //timeout of all loaders
    }
    var loader = new HERE.ResourceLoader({
        baseURI:'../',
        timeout:8000
        loaderTimeout:2000
   });
```
2.Start load Resource
```javascript
    var promise = loader.load(resource);
    promise.then(function(){
        console.log('load finished !');
    },function(){
        console.log('load error or timeout !');
    });
```
3.Extend loader for ResourceLoader
```javascript
    ResourceLoader.registerLoader(type:String,loader:Loader);
```