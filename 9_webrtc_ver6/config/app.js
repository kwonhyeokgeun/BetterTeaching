// pm2 설정파일
module.exports = {
    apps:[{
        name:'server',
        script:'./server.js',
        instance:0,
        exec_mode:'cluster'
    }]
}