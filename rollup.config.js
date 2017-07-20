import typescript from 'rollup-plugin-typescript';
export default {
	banner:'/* Resource loader */',
	entry: 'src/index.ts',
	dest: 'dest/resource-loader.js',
	moduleName: 'HERE',
	format: 'umd',
	plugins:[
		typescript()
	]
};
