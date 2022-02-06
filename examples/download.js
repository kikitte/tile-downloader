import path from "path";
import { downloadTilesAtLevel } from "../src/download-helper.js";
import TileWorkspaceZXY from "../src/tileworkspace-zxy.js";

const workspace = new TileWorkspaceZXY("./tiles");

(async function () {
  for (let l = 0; l < 6; ++l) {
    console.log(`download tiles at level ${l}`);
    await downloadTilesAtLevel({
      workspace,
      areaOptions: {
        // 瓦片层级
        level: l,
        // TileCover用于计算指定层级下与特定区域相交的瓦片的X、Y坐标
        // 可选"MercatorTileCover" 或 "GeodeticTileCover" 或 "SlippyTileCover" 或者 实现TileCover接口的对象，具体可查看TileCover依赖包
        tileCover: "MercatorTileCover",
        // 需要下载的区域的多边形文件路径
        areaPolygonPath: path.resolve("examples", "area.geojson"),
      },
      resourceOptions: {
        // 瓦片的URL地址模板。其中的{x}, {y}, {z}将会被替换成对应瓦片坐标的x、y、z
        urlTemplate: "https://khms1.google.com/kh/v=917?x={x}&y={y}&z={z}",
        // 网络瓦片请求时额外的的请求头
        requestHeaders: {},
        // 正常情况下访问瓦片URL Response Header的MIME类型，如'image/png'指示瓦片为png格式的图片
        contentType: "image/jpeg",
      },
      downloadOptions: {
        // 瓦片下载失败（如由超时导致）后再次重试的次数
        maxRetryCount: 3,
        // 任务列表最大容许数量
        maxTaskNumber: 10,
        // 从互联网下载瓦片最长等待时间(单位：毫米)，超过该时间后取消该任务，优先下载其他瓦片，后续在重新下载该瓦片
        taskTimeout: 5000,
      },
    });
  }
})();
