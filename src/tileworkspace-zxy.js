import fs from "fs";
import MIME from "mime";
import TileWrokspace from "./tileworkspace.js";

export default class TileWorkspaceZXY extends TileWrokspace {
  constructor(workspace) {
    super(workspace);
  }
  /**
   *
   * @param {TileCoordinate} tile
   */
  getTilePath(tile, contentType) {
    return `${this.getAbsoluteDirectory(tile)}/${tile[1]}.${MIME.getExtension(
      contentType
    )}`;
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  getAbsoluteDirectory(tile) {
    return `${this.workspace}${this.getRelativeDirectory(tile)}`;
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  getRelativeDirectory(tile) {
    return `/${tile[2]}/${tile[0]}`;
  }

  /**
   *
   * @param {TileCoordinate} tile
   */
  createDirectory(tile) {
    fs.mkdirSync(this.getAbsoluteDirectory(tile), { recursive: true });
  }
}
