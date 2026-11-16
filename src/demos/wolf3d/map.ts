// Port of src/map/map.c and src/map/form.c from Wolf3D.
// Tiles: '0' floor, '1' wall, '2' corrupted wall, '3' door (the exit).
// The generator carves rooms and corridors from the top-left corner towards the
// bottom of the grid, then retries until every row has been reached.

export type Grid = string[][]

interface Point {
  x: number
  y: number
}

const rand = (n: number) => Math.floor(Math.random() * n)

function initMap(sizeX: number, sizeY: number): Grid {
  return Array.from({ length: sizeY }, () => Array<string>(sizeX).fill('1'))
}

function fillMap(map: Grid) {
  for (const row of map) row.fill('1')
}

function squareRight(map: Grid, coord: Point, size: Point) {
  let count = 0
  if (size.x <= 1 || size.y <= 1) return
  for (let i = 0; coord.y + 1 < map.length && i < size.y; i++) {
    for (let j = 0; coord.x + j + 1 < map[0].length && j < size.x; j++) {
      map[coord.y][coord.x + j] = '0'
      count = j
    }
    coord.y += 1
  }
  coord.y -= 1
  coord.x += count
}

function squareLeft(map: Grid, coord: Point, size: Point) {
  let count = 0
  if (size.x <= 1 || size.y <= 1) return
  for (let i = 0; coord.y + 1 < map.length && i < size.y; i++) {
    for (let j = 0; coord.x - j > 1 && j < size.x; j++) {
      map[coord.y][coord.x - j] = '0'
      count = j
    }
    coord.y += 1
  }
  coord.y -= 1
  coord.x -= count
}

function corridorRight(map: Grid, coord: Point, size: number) {
  for (let i = 0; coord.x + 2 < map[0].length && i < size - 2; i++) {
    map[coord.y][coord.x] = '0'
    coord.x += 1
  }
  for (let j = 0; coord.y + 1 < map.length && j < size - 2; j++) {
    map[coord.y][coord.x] = '0'
    coord.y += 1
  }
}

function corridorLeft(map: Grid, coord: Point, size: number) {
  if (rand(2)) while (map[coord.y][coord.x] === '0' && coord.x > 1) coord.x -= 1
  for (let i = 0; coord.x > 1 && i < size - 1; i++) {
    map[coord.y][coord.x] = '0'
    coord.x -= 1
  }
  for (let j = 0; coord.y + 1 < map.length && j < size - 2; j++) {
    map[coord.y][coord.x] = '0'
    coord.y += 1
  }
}

function isValid(map: Grid): boolean {
  if (map[1][1] !== '0') {
    fillMap(map)
    return false
  }
  for (let i = 1; i + 1 < map.length; i++) {
    let onlyWalls = true
    for (let j = 1; j + 1 < map[i].length && onlyWalls; j++) onlyWalls = map[i][j] === '1'
    if (onlyWalls) {
      fillMap(map)
      return false
    }
  }
  return true
}

function generateCorrupt(map: Grid, rooms: number) {
  let corrupt = rooms * 3
  for (let i = 0; i < map.length && corrupt > 0; i++) {
    const row = map[i]
    let j = 0
    while (j < row.length && row[j] === '1') j++
    if (j >= row.length) continue
    row[j - 1] = rand(corrupt) < 2 ? '2' : '1'
    if (row[j - 1] === '2') {
      corrupt--
      continue
    }
    while (row[j] === '0') j++
    row[j] = rand(corrupt) < 2 ? '2' : '1'
    if (row[j] === '2') corrupt--
  }
}

function generateRoom(map: Grid) {
  const coord: Point = { x: 1, y: 1 }
  let rooms = 0
  for (; coord.y < map.length - 2 && coord.x < map[0].length - 2; rooms++) {
    const random = rand(4)
    if (random > 0) squareRight(map, coord, { x: 2 + rand(5), y: 2 + rand(5) })
    if (random === 0) squareLeft(map, coord, { x: 2 + rand(5), y: 2 + rand(5) })
    if (random > 1) corridorRight(map, coord, random + 3)
    if (random <= 1) corridorLeft(map, coord, random + 3)
  }
  generateCorrupt(map, rooms)
  map[coord.y][coord.x] = '3'
}

export function generateMap(sizeX: number, sizeY: number): Grid {
  const map = initMap(sizeX, sizeY)
  while (!isValid(map)) generateRoom(map)
  return map
}

/** Same sizing as change_map() in the game: a square between 10 and 29 tiles. */
export function randomMap(): Grid {
  const size = 10 + rand(20)
  return generateMap(size, size)
}
