## Getting Started
### Define Resource
1. Resource declaration
```javascript
    interface Resource {
        type:String; // type name js|css
        urls:String[]; 
        serial?:Boolean; // if serial load urls
        dependence?:Resource; // will be load before load urls
        timeout?:number // timeout of every url item load  | ms
    }
```
2. parallel load resource urls 
```javascript
    var resource = {
        type:'js',
        urls:['test/a.js']
    };
```
3. serial load resource urls
```javascript
    var resource = {
        type:'js',
        serial:true,
        urls:['test/a.js']
    };
```
4. with dependence
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
5. css resource
```javascript
    var resource = {
        type:'css',
        timeout:2000,
        urls:['test/a.css']
    };
```
6. text resource
```javascript
    var resource = {
        type:'text',
        timeout:2000,
        urls:['test/a.html']
    };
```
7. json resource
```javascript
    var resource = {
        type:'json',
        timeout:2000,
        urls:['test/a.json']
    };    
```
8. image resource
```javascript
    var resource = {
        type:'image',
        timeout:2000,
        urls:['test/a.image']
    };       
```
### start load resource
1. Define ResourceLoader
```javascript
    interface ResourceLoaderOption {
        baseURI?:String; // Define load baseURI
        useCache?:Boolean; // if use Cache
        params?:Object // url query params
        timeout?:number; //timeout of all loaders
    }
    var loader = new HERE.ResourceLoader({
        baseURI:'../',
        timeout:8000 // timeout of all request
   });
```
2. Start load Resource
```javascript
    var promise = loader.load(resource);
    promise.then(function(){
        console.log('load finished !');
    },function(){
        console.log('load error or timeout !');
    });
    
    //other resource,will load resourceCss after resourceJs has been loaded
    var resourceJs,resourceCss;
    loader.load(resourceJs,resourceCss);
    // parallel load resource,you can
    loader.load([resourceJs,resourceCss]);
    // mixed serial load and parallel load,
    //load resourceC after resourceJs and resourceCss has been loaded,resourceJs and resourceCss load parallel
    var resourceC;
    loader.load([resourceJs,resourceCss],resourceC);
```
3. Extend loader for ResourceLoader
```javascript
    ResourceLoader.registerLoader(type:String,loader:Loader);
```