import fetch from "node-fetch";
import TaskList from "./tasklist.js";
import { idToTileCoord } from "./tile-helper.js";

export default class Downloader {
  /**
   *
   * @param {Object} options
   * @param {String} options.tileMIME
   * @param {String[]} options.tiles
   * @param {String} options.urlTemplate
   * @param {{[index: String]: String}} options.requestHeaders
   * @param {Number} options.maxTaskNumber
   * @param {Number} options.maxRetryCount
   * @param {Number} options.taskTimeout the maximum waiting time in milliseconds for the completion of a task
   * @param {import('./tileworkspace').default} options.workspace
   * @param {(unavailableTiles: import("./tile-helper.js").TileCoordinate[]) => void} options.onDownloadCompeleted
   */
  constructor(options) {
    this.tilesTotal = options.tiles.length;
    this.tileMIME = options.tileMIME.toLowerCase();
    this.tiles = options.tiles;
    this.urlTemplate = options.urlTemplate;
    this.requestHeaders = options.requestHeaders;
    this.workspace = options.workspace;
    this.onDownloadCompeleted = options.onDownloadCompeleted;
    this.maxRetryCount = options.maxRetryCount;

    this.onTileTaskCancel = this.onTileTaskCancel.bind(this);
    this.onTileTaskCompelete = this.onTileTaskCompelete.bind(this);
    this.watchDownloadStatus = this.watchDownloadStatus.bind(this);
    this.watchDownloadStatusTimer = setInterval(
      this.watchDownloadStatus,
      10000
    );

    this.taskList = new TaskList({
      maxTaskNumber: options.maxTaskNumber,
      taskTimeout: options.taskTimeout,
      onTaskCancelListener: this.onTileTaskCancel,
      onTaskCompeleteListener: this.onTileTaskCompelete,
    });

    this.tileContentTypeMap = {};
    this.tileTaskRetryCount = {};
    this.unavailableTiles = [];
  }

  start() {
    while (this.nextTileTask()) {}
  }

  /**
   *
   * @returns If the task was added successfully
   */
  nextTileTask() {
    if (!this.taskList.taskIsFull) {
      for (const tile of this.tiles) {
        if (!this.taskList.hasTask(tile)) {
          return this.taskList.addTask(tile, this.fetchTile(tile));
        }
      }
    }

    return false;
  }

  fetchTile(tile) {
    const url = this.fillUrlTemplate(tile);
    return fetch(url, { headers: this.requestHeaders }).then((val) => {
      let contentType = val.headers.get("content-type");
      if (!contentType) {
        throw Error("Content-Type is required for response headers");
      }
      contentType = contentType.toLowerCase();
      if (!contentType.includes(this.tileMIME)) {
        throw Error(
          `Content Error! expected=${this.tileMIME}, actual=${contentType}`
        );
      }
      this.tileContentTypeMap[tile] = contentType;

      return val.arrayBuffer();
    });
  }

  removeTile(tile) {
    if (this.tiles.includes(tile)) {
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }
  }

  getTileTaskRetryCount(tile) {
    if (!(tile in this.tileTaskRetryCount)) {
      return 0;
    }
    return this.tileTaskRetryCount[tile];
  }

  increaseTileTaskRetryCount(tile) {
    if (!(tile in this.tileTaskRetryCount)) {
      this.tileTaskRetryCount[tile] = 1;
    } else {
      ++this.tileTaskRetryCount[tile];
    }
  }

  onTileTaskCompelete(tile, content) {
    // save tile
    const success = this.workspace.saveTile(
      tile,
      content,
      this.tileContentTypeMap[tile]
    );
    // new tile task
    if (success) {
      this.removeTile(tile);
    } else {
      this.decreaseTilePriority(tile);
    }

    this.nextTileTask();

    delete this.tileContentTypeMap[tile];
  }

  onTileTaskCancel(tile) {
    this.increaseTileTaskRetryCount(tile);
    const tileRetryCount = this.getTileTaskRetryCount(tile);

    if (tileRetryCount > this.maxRetryCount) {
      this.removeTile(tile);
      this.unavailableTiles.push(tile);
      delete this.tileTaskRetryCount[tile];
      delete this.tileContentTypeMap[tile];
    } else {
      this.decreaseTilePriority(tile);
      delete this.tileContentTypeMap[tile];
    }

    this.nextTileTask();
  }

  decreaseTilePriority(tile) {
    // if failed to download the tile,
    // we will reduce the priority of this tile,
    // that is making this tile to be download at the end

    const tileIndex = this.tiles.indexOf(tile);
    const randTileIndex = Math.floor(
      [Math.random() / 2 + 0.5] * this.tiles.length
    );

    this.tiles[tileIndex] = this.tiles[randTileIndex];
    this.tiles[randTileIndex] = tile;
  }

  fillUrlTemplate(tile) {
    const tileCoord = idToTileCoord(tile);
    return this.urlTemplate
      .replace("{x}", tileCoord[0])
      .replace("{y}", tileCoord[1])
      .replace("{z}", tileCoord[2]);
  }

  watchDownloadStatus() {
    const tilesInfo = `progress: ${(
      (1 - this.tiles.length / this.tilesTotal) *
      100
    ).toFixed(2)}%, total tiles: ${this.tilesTotal}, compeleted tiles: ${
      this.tilesTotal - this.tiles.length - this.unavailableTiles.length
    }, rest tiles: ${this.tiles.length}, unavailable tiles: ${
      this.unavailableTiles.length
    }`;
    console.log(tilesInfo);

    if (this.tiles.length === 0 && this.taskList.taskIsEmpty) {
      clearInterval(this.watchDownloadStatusTimer);
      this.taskList.stopWorking();
      this.onDownloadCompeleted(this.unavailableTiles);
    }
  }
}
