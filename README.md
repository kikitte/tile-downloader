## tile-downloader

一个用于下载瓦片数据的简易下载框架。支持下载任何基于瓦片的地理数据，如影像瓦片、矢量瓦片、地形瓦片等。

它是一个下载框架，意味着它没有命令行界面，而是实现好了了完成下载的大部分环节，直接在提供的例子上修改下参数即可上手使用，如果有更高级需求则可依据框架要求完成些许代码进行配置。

#### 功能列表

- 支持使用多边形设定所需要的下载区域（由tile-cover提供支持），避免不必要区域带来的网络、时间和空间上的浪费。

- 当前支持两种最常见的瓦片编号方案（Tile Scheme）：geodetic和mercator，如有需要可通过拓展TileCover来支持更多方案

- 以文件形式保存下载好的瓦片，当前将瓦片按照`根路径/{z}/{x}/{y}.{ext}`的目录结构保存，如有需要可通过继承TileWorkspace并覆写相关路径逻辑来自定义保存的目录结构。

- 任务列表机制

  支持设置最大重试数量、列表最大任务数量与下载超时。

  从网络上获取一个瓦片到内存当中被是为一个下载任务。

  由于执行JavaScript代码的单线程特性，需要多一点发送网络请求使得代码能够更加多得被执行以提高下载效率。比如说”从网络上下载一个瓦片保存后再对其他瓦片顺序重复这个过程“ 这种设计不理想，因为网络请求耗时远比执行保存文件代码耗时多得多，所以较好的解决方法应该是同时向网络请求多个瓦片，哪个网络请求先完成就保存到本地同时添加下一个下载任务，这便是任务列表所做的事情。得益于JavaScript和NodeJS提供的异步编程，这能够很好的实现。

#### 如何使用？

在使用之前你需要对以下概念有些许了解，才能更好的利用这个项目。

1. 瓦片编号方案（tile scheme）

2. GeoJSON Polygon

3. MIME类型

   在框架里，MIME类型用于判断瓦片请求返回是否成功和自动推断需要保存的文件的拓展名，此功能以来MIME包。对于不常见的拓展名需要在代码里定义MIME类型和其对应的拓展名。如下：

   ```javascript
   import MIME from "mime";
   // application/vnd.quantized-mesh为Cesium 地形瓦片(quantized-mesh)的MIME类型，terrain为其文件拓展名
   MIME.define({ "application/vnd.quantized-mesh": ["terrain"] });
   // ...
   ```

   

不妨花点时间了解一下然后再开始。

项目中examples/downlaod.js为一个下载云南省google卫星影像的例子，以下是使用步骤：

```shell
# 克隆项目
git clone https://github.com/kikitte/tile-downloader
# 
cd tile-downloader
# 安装依赖
npm install
# 
node examples/download.js # 通过修改download.js来实现具体下载需求
```





