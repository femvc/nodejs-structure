# NodeJS项目结构示例

> NodeJS项目结构示例，包含 模板使用，Request参数查看，文件上传，API请求转发

### 索引
*   [项目结构](#product-tables)
*   [路由](#routes)
*   [启动说明](#how-start)

### Product Tables
### 项目结构
- bin           启动项目目录
- controller    控制器
- log           日志记录
- node_modules  依赖包
- public        静态文件目录
- routes        页面路由
- test          单元测试
- util          工具类
- views         视图

- api.js        启动在3100端口的api
- app.js        应用主体
- config.js     配置文件
- gulpfile.js   gulp配置文件
- package.json  包依赖及描述
- README.md     说明文档

### Routes
### 路由
- [模板使用] /list
- [查看请求参数] /test/:id
- [文件上传] /upload
- [API请求转发] /api/**/*
- [查看上传的文件] /build

### How Start
### 启动说明
- 先运行 node api.js 启动API接收服务器
- 再运行 node bin/www 启动APP应用
- 打开 http://localhost:3005/list 

