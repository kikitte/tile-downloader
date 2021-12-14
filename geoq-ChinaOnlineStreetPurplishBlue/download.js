import fs from "fs";
import TileCover from "tile-cover";
import Downloader from "../src/downloader.js";
import { tileCoordToId } from "../src/tile-helper.js";
import TileWorkspaceZXY from "../src/tileworkspace-zxy.js";
import { area } from "./yunnan_boundary.js";

const areaGeom = area;

const workspace = new TileWorkspaceZXY("/home/kikitte/tmp/geoq-chinamap");

function downloadTilesAtLevel(level, saveTileGeoJSON = false) {
  const tiles = TileCover.MercatorTileCover.tiles(areaGeom, {
    min_zoom: level,
    max_zoom: level,
  });
  if (saveTileGeoJSON) {
    const tilesGeojson = TileCover.MercatorTileCover.geojson(areaGeom, {
      min_zoom: level,
      max_zoom: level,
    });
    fs.writeFileSync(
      `${workspace.workspace}/${level}.geojson`,
      JSON.stringify(tilesGeojson)
    );
  }

  return new Promise((resolve) => {
    const downloader = new Downloader({
      tiles: tiles.map(tileCoordToId),
      urlTemplate:
        "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}",
      maxTaskNumber: 10,
      tileMIME: "image/png",
      resolveTilePath: (tile, contentType) =>
        workspace.resolvePath(tile, contentType),
      taskTimeout: 5000,
      maxRetryCount: 4,
      onDownloadCompeleted: (unavailableTiles) => {
        fs.writeFileSync(
          `${workspace.workspace}/unavailable-tiles-${level}.geojson`,
          unavailableTiles.join("\n")
        );

        resolve();
      },
    });

    downloader.start();
  });
}

(async function () {
  for (let l = 5; l < 6; ++l) {
    console.log(`download tiles at level ${l}`);
    await downloadTilesAtLevel(l, false);
  }
})();
