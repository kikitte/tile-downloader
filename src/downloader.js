import fs from "fs";
import fetch from "node-fetch";
import TaskList from "./tasklist.js";
import * as TileHelpers from "./tile-helper.js";

export default class Downloader {
  /**
   *
   * @param {Object} options
   * @param {String} options.tileMIME
   * @param {String[]} options.tiles
   * @param {String} options.urlTemplate
   * @param {Number} options.maxTaskNumber
   * @param {Number} options.taskTimeout the maximum waiting time in milliseconds for the completion of a task
   * @param {(t: import('./tile-helper').TileCoordinate, contentType: String) => String} options.resolveTilePath
   * @param {Number} options.onDownloadCompeleted
   */
  constructor(options) {
    this.tilesTotal = options.tiles.length;
    this.tileMIME = options.tileMIME;
    this.tiles = options.tiles;
    this.urlTemplate = options.urlTemplate;
    this.resolveTilePath = options.resolveTilePath;
    this.onDownloadCompeleted = options.onDownloadCompeleted;

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
    return fetch(url).then((val) => {
      const contentType = val.headers.get("content-type");
      if (this.tileMIME != contentType) {
        // DEBUG
        console.log(`content error: ${tile}`);

        throw Error("Content Error!");
      }
      // header name is case insensitive
      this.tileContentTypeMap[tile] = contentType;

      return val.arrayBuffer();
    });
  }

  /**
   *
   * @param {String} tile
   * @param {ArrayBuffer} content
   */
  saveTile(tile, content) {
    if (content) {
      const tileCoord = TileHelpers.idToTileCoord(tile);
      const filePath = this.resolveTilePath(
        tileCoord,
        this.tileContentTypeMap[tile]
      );
      fs.writeFileSync(filePath, new Uint8Array(content));

      return true;
    }
    return false;
  }

  removeTile(tile) {
    if (this.tiles.includes(tile)) {
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }
  }

  onTileTaskCompelete(tile, content) {
    // save tile
    const success = this.saveTile(tile, content);
    // new tile task
    if (success) {
      this.removeTile(tile);
    }
    this.nextTileTask();

    delete this.tileContentTypeMap[tile];
  }

  onTileTaskCancel(tile) {
    // DEBUG
    console.log(`onTileTaskCancel: ${tile}`);

    // if failed to download the tile, we will reduce the priority of this tile
    const tileIndex = this.tiles.indexOf(tile);
    this.tiles[tileIndex] = this.tiles[this.tiles.length - 1];
    this.tiles[this.tiles.length - 1] = tile;

    this.nextTileTask();
    delete this.tileContentTypeMap[tile];
  }

  fillUrlTemplate(tile) {
    const tileCoord = TileHelpers.idToTileCoord(tile);
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
      this.tilesTotal - this.tiles.length
    }, rest tiles: ${this.tiles.length}`;
    console.log(tilesInfo);

    if (this.tiles.length === 0 && this.taskList.taskIsEmpty) {
      clearInterval(this.watchDownloadStatusTimer);
      this.taskList.stopWorking();
      this.onDownloadCompeleted();
    }
  }
}
