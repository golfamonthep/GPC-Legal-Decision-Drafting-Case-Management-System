import { defineConfig } from 'vite';
export default defineConfig({css:{postcss:{plugins:[]}},server:{allowedHosts:['127.0.0.1','localhost'],fs:{strict:true},watch:{ignored:['**/.qa/**','**/.private/**','**/.state/**','**/dist/**']}},build:{outDir:'dist'}});
