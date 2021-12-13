/**
 * @typedef {[x: number, y: number, z: number]} TileCoordinate
 */

/**
 *
 * @param {TileCoordinate} tileCoord
 * @returns
 */
export function tileCoordToId(tileCoord) {
  return `${tileCoord[2]}/${tileCoord[0]}/${tileCoord[1]}`;
}

/**
 *
 * @param {String} id
 */
export function idToTileCoord(id) {
  const zxy = id.split("/").map((v) => parseInt(v));
  return [zxy[1], zxy[2], zxy[0]];
}
