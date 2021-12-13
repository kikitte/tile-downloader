import fs from "fs";

export default class TileWrokspace {
  /**
   *
   * @param {String} workspace
   */
  constructor(workspace) {
    this.workspace = workspace
    this.dirExistingMap = {};
  }

  checkDirectory;

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
      this.dirExistingMap[subdir] = fs.existsSync(this.getAbsoluteDirectory(tile));
    }
    return this.dirExistingMap[subdir];
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
