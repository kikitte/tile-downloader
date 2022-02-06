import fs from "fs";
import { idToTileCoord } from "./tile-helper.js";

export default class TileWrokspace {
  /**
   *
   * @param {String} workspace
   */
  constructor(workspace) {
    this.workspace = workspace;
    this.dirExistingMap = {};
  }

  /**
   *
   * @param {import("./tile-helper").TileCoordinate} tile
   */
  resolvePath(tile, contentType) {
    if (!this.checkDirectoryExisting(tile)) {
      this.createDirectory(tile);
    }
    return this.getTilePath(tile, contentType);
  }

  checkDirectoryExisting(tile) {
    const subdir = this.getRelativeDirectory(tile);
    if (!(subdir in this.dirExistingMap)) {
      this.dirExistingMap[subdir] = fs.existsSync(
        this.getAbsoluteDirectory(tile)
      );
    }
    return this.dirExistingMap[subdir];
  }

  /**
   *
   * @param {String} tile
   * @param {ArrayBuffer} content
   */
  saveTile(tile, content, contentType) {
    if (content) {
      const tileCoord = idToTileCoord(tile);
      const filePath = this.resolvePath(tileCoord, contentType);
      fs.writeFile(filePath, new Uint8Array(content), {}, emptyCallback);

      return true;
    }
    return false;
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  getTilePath(tile) {
    throw Error("This is a virtual function!");
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  createDirectory(tile) {
    throw Error("This is a virtual function!");
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  getAbsoluteDirectory(tile) {
    throw Error("This is a virtual function!");
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  getRelativeDirectory(tile) {
    throw Error("This is a virtual function!");
  }
}

function emptyCallback() {}