# JSON Tools

# 部署

## UTools 部署
修改 dist/index.html 文件，添加如下代码
```javascript
    var currentUrl = window.location.href;
    var baseDir = currentUrl.substring(0, currentUrl .length - 'index.html'.length)
```
修改Worker路径为
```javascript
"editorWorkerService": baseDir+"/monacoeditorwork/editor.worker.bundle.js",
"json": baseDir+"/monacoeditorwork/json.worker.bundle.js"
```
![3bb4yk585q-20241024173215.png](https://minio.kl.do/default/files/3bb4yk585q-20241024173215.png)
