import fs from "fs";
import TileCover from "tile-cover";
import Downloader from "./downloader.js";
import { tileCoordToId } from "./tile-helper.js";

/**
 *
 * @param {Object}  param0
 * @param {import('./tileworkspace').default} param0.workspace 瓦片存放的工作区
 * @param {Object} param0.areaOptions 定义下载区域
 * @param {Number} param0.areaOptions.level 需要下载的瓦片层级
 * @param {String | Object} param0.areaOptions.tileCover TileCover对象或者类型字符串，当使用类型字符串时将会从tile-cover库寻找相应对象
 * @param {String} param0.areaOptions.areaPolygonPath 下载区域的多边形的文件路径，GeoJSON格式，其坐标系应当对应TileCover类型，如GeodeticTileCover应当使用WGS84坐标系的多边形
 * @param {Object} param0.resourceOptions 定义为了从网上下载瓦片所需要的信息
 * @param {String} param0.resourceOptions.urlTemplate 瓦片的URL地址模板。其中的{x}, {y}, {z}将会被替换成对应瓦片坐标的x、y、z
 * @param {String} param0.resourceOptions.requestHeaders 网络瓦片请求配置的请求头
 * @param {String} param0.resourceOptions.contentType 瓦片的MIME类型，如'image/png'指示瓦片为png格式的图片
 * @param {Object} param0.downloadOptions 下载配置项
 * @param {Number} param0.downloadOptions.maxTaskNumber 任务列表最大容许数量
 * @param {Number} param0.downloadOptions.taskTimeout 从互联网下载瓦片最长等待时间(单位：毫米)，超过该时间后取消该任务，优先下载其他瓦片，后续在重新下载该瓦片
 * @param {Number} param0.downloadOptions.maxRetryCount 瓦片下载失败（如由超时导致）后再次重试的次数
 *
 * @returns
 */
export function downloadTilesAtLevel({
  workspace,
  areaOptions,
  resourceOptions,
  downloadOptions,
  saveTileGeoJSON = false,
}) {
  let { areaPolygonPath, level, tileCover } = areaOptions;
  let areaPolygon = JSON.parse(fs.readFileSync(areaPolygonPath).toString());
  tileCover = typeof tileCover === "string" ? TileCover[tileCover] : tileCover;
  if (!tileCover) {
    throw "无效tileCover";
  }

  const tiles = tileCover.tiles(areaPolygon, {
    min_zoom: level,
    max_zoom: level,
  });
  if (saveTileGeoJSON) {
    const tilesGeojson = tileCover.geojson(areaPolygon, {
      min_zoom: level,
      max_zoom: level,
    });
    fs.writeFileSync(
      `${workspace.workspace}/${level}.geojson`,
      JSON.stringify(tilesGeojson)
    );
  }

  return new Promise((resolve) => {
    const downloadCompeleteCallback = (unavailableTiles) => {
      fs.writeFileSync(
        `${workspace.workspace}/unavailable-tiles-${level}.geojson`,
        unavailableTiles.join("\n")
      );
      resolve();
    };

    const downloader = new Downloader({
      workspace,
      tiles: tiles.map(tileCoordToId),
      urlTemplate: resourceOptions.urlTemplate,
      requestHeaders: resourceOptions.requestHeaders,
      tileMIME: resourceOptions.contentType,
      maxTaskNumber: downloadOptions.maxTaskNumber,
      taskTimeout: downloadOptions.taskTimeout,
      maxRetryCount: downloadOptions.maxRetryCount,
      onDownloadCompeleted: downloadCompeleteCallback,
    });

    downloader.start();
  });
}
