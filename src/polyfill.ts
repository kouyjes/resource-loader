function polyfill(){
    if(!Object.assign){
        Object.assign = function (src,target) {
            if(!target){
                return src;
            }
            Object.keys(target).forEach(function (key) {
                src[key] = target[key];
            });
            return src;
        };
    }
}
export { polyfill };