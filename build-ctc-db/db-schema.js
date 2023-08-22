const schemaVideoTable =
`CREATE TABLE video (
    id              TEXT NOT NULL,
    title           TEXT NOT NULL,
    video_type      TEXT NOT NULL,
    super_category  TEXT NOT NULL,
    date            TEXT NOT NULL,
    length_seconds  INTEGER NOT NULL,
    youtube_link    TEXT NOT NULL,
    PRIMARY KEY(id)
)`; // Note: STRICT schema is not supported by Datasette

module.exports.schemaVideo = [
    'DROP TABLE IF EXISTS video',
    schemaVideoTable
];

const schemaVideoHostTable =
`CREATE TABLE video_host(
    video_id        TEXT NOT NULL,
    host            TEXT NOT NULL,
    PRIMARY KEY(video_id, host),
    FOREIGN KEY(video_id) REFERENCES video(id)
)`;

module.exports.schemaVideoHost = [
    'DROP TABLE IF EXISTS video_host',
    schemaVideoHostTable
];

const schemaPuzzleTable =
`CREATE TABLE puzzle(
    id              INTEGER NOT NULL,
    title           TEXT NOT NULL,
    type            TEXT NOT NULL,
    super_category  TEXT NOT NULL,
    video_id        TEXT NOT NULL,
    video_offset    TEXT,
    source          TEXT,
    collection      TEXT,
    gas_date        TEXT,
    gas_num         TEXT,
    PRIMARY KEY(id),
    FOREIGN KEY(video_id) REFERENCES video(id)
)`; // Note: STRICT schema is not supported by Datasette

module.exports.schemaPuzzle = [
    'DROP TABLE IF EXISTS puzzle',
    schemaPuzzleTable
];

const schemaPuzzleSubtypeTable =
`CREATE TABLE puzzle_subtype(
    puzzle_id       INTEGER NOT NULL,
    subtype         TEXT NOT NULL,
    PRIMARY KEY(puzzle_id, subtype),
    FOREIGN KEY(puzzle_id) REFERENCES puzzle(id)
)`;

module.exports.schemaPuzzleSubtype = [
    'DROP TABLE IF EXISTS puzzle_subtype',
    schemaPuzzleSubtypeTable
];

const schemaPuzzleSetterTable =
`CREATE TABLE puzzle_setter(
    puzzle_id       INTEGER NOT NULL,
    setter          TEXT NOT NULL,
    aka             TEXT,
    PRIMARY KEY(puzzle_id, setter),
    FOREIGN KEY(puzzle_id) REFERENCES puzzle(id)
)`;

module.exports.schemaPuzzleSetter = [
    'DROP TABLE IF EXISTS puzzle_setter',
    schemaPuzzleSetterTable
];

module.exports.schemaIndexes = [
    'CREATE INDEX video_video_type_idx1 ON video(video_type)',
    'CREATE INDEX video_super_category_idx1 ON video(super_category)',
    'CREATE INDEX video_date_idx1 ON video(date)',

    'CREATE INDEX video_host_host_idx1 ON video_host(host)',

    'CREATE INDEX puzzle_type_idx1 ON puzzle(type)',
    'CREATE INDEX puzzle_super_category_idx1 ON puzzle(super_category)',
    'CREATE INDEX puzzle_source_idx1 ON puzzle(source)',
    'CREATE INDEX puzzle_collection_idx1 ON puzzle(collection)',

    'CREATE INDEX puzzle_subtype_idx1 ON puzzle_subtype(subtype)',

    'CREATE INDEX puzzle_setter_setter_idx1 ON puzzle_setter(setter)'
];

// YouTube Image Thumbnails: https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
const schemaAllPuzzlesView = 
`CREATE VIEW all_puzzles AS
select
  pz.id "Id",
  pz.type "Type",
  pz.super_category "Super Category",
  vid.date "Date",
  pz.gas_date "GAS Date",
  pz.gas_num "GAS #",
  (select json_group_array(host) from video_host where video_id=vid.id group by video_id) "Solver",
  CASE ifnull(pz.title,'') 
    WHEN '' THEN 
      CASE WHEN length(pz.source) > 0 
      THEN printf('%s #%i (%s)', pz.type, pz.id, pz.source) 
      ELSE printf('%s #%i', pz.type, pz.id) END
    ELSE pz.title
  END "Puzzle Title",
  (select json_group_array(setter) from puzzle_setter where puzzle_id=pz.id group by puzzle_id) "Setter",
  (select json_group_array(subtype) from puzzle_subtype where puzzle_id=pz.id group by puzzle_id) "Constraints",
  json_object(
    'alt',vid.title,
    'caption',vid.title,
    'img_src', 'https://img.youtube.com/vi/' || vid.id|| '/mqdefault.jpg',
    'href',CASE ifnull(pz.video_offset, '') WHEN '' THEN vid.youtube_link ELSE vid.youtube_link || '&t=' || pz.video_offset END
  ) "Video",
  time(vid.length_seconds, 'unixepoch') "Video Length",
  CAST (ceiling(vid.length_seconds / 60.0) AS INTEGER) "Video Length (Minutes)"
from puzzle pz
inner join video vid on vid.id=pz.video_id
where pz.super_category in ('Sudoku', 'Crossword', 'Pencil Puzzles')
order by pz.id desc`;

module.exports.schemaAllPuzzles = [
    'DROP VIEW IF EXISTS all_puzzles',
    schemaAllPuzzlesView
]

// Sudoku Puzzles ///////////////////////////////////

const schemaSudokuPuzzlesTable = 
`CREATE TABLE sudoku_puzzles(
    Id              INTEGER PRIMARY KEY,
    "Puzzle Title"  TEXT,
    Date            TEXT,
    Solver          TEXT,
    Setter          TEXT,
    Constraints     TEXT,
    Video           TEXT,
    "Video Length"  TEXT,
    "Video Length (Minutes)" INTEGER
  );`;

const schemaSudokuPuzzlesMaterializedTable =
  `INSERT INTO sudoku_puzzles
  select
    "Id", "Puzzle Title", "Date", "Solver", "Setter", "Constraints", 
    "Video", "Video Length", "Video Length (Minutes)"
  from all_puzzles
  where "Super Category"='Sudoku'`;

module.exports.schemaSudokuPuzzles = [
    'DROP TABLE IF EXISTS sudoku_puzzles',
    schemaSudokuPuzzlesTable,
    schemaSudokuPuzzlesMaterializedTable
];

// GAS Puzzles ///////////////////////////////////

const schemaGasPuzzlesTable = 
`CREATE TABLE gas_puzzles(
    Id              INTEGER PRIMARY KEY,
    "Puzzle Title"  TEXT,
    Date            TEXT,
    "GAS Date"      TEXT,
    "GAS #"         TEXT,
    Solver          TEXT,
    Setter          TEXT,
    Constraints     TEXT,
    Video           TEXT,
    "Video Length"  TEXT,
    "Video Length (Minutes)" INTEGER
  );`;

const schemaGasPuzzlesMaterializedTable =
`INSERT INTO gas_puzzles
select
  "Id", "Puzzle Title", "Date", "GAS Date", "GAS #", "Solver", "Setter", "Constraints", 
  "Video", "Video Length", "Video Length (Minutes)"
from all_puzzles
where "Super Category"='Sudoku' and "GAS Date" is not null`;

module.exports.schemaGasPuzzles = [
    'DROP TABLE IF EXISTS gas_puzzles',
    schemaGasPuzzlesTable,
    schemaGasPuzzlesMaterializedTable
];

// Not GAS Puzzles ///////////////////////////////////

const schemaNotGasPuzzlesTable = 
`CREATE TABLE not_gas_puzzles(
  Id              INTEGER PRIMARY KEY,
  "Puzzle Title"  TEXT,
  Date            TEXT,
  Solver          TEXT,
  Setter          TEXT,
  Constraints     TEXT,
  Video           TEXT,
  "Video Length"  TEXT,
  "Video Length (Minutes)" INTEGER
);`;

const schemaNotGasPuzzlesMaterializedTable =
`INSERT INTO not_gas_puzzles
select
  "Id", "Puzzle Title", "Date", "Solver", "Setter", "Constraints", 
  "Video", "Video Length", "Video Length (Minutes)"
from all_puzzles
where "Super Category"='Sudoku' and "GAS Date" is null`;

module.exports.schemaNotGasPuzzles = [
    'DROP TABLE IF EXISTS not_gas_puzzles',
    schemaNotGasPuzzlesTable,
    schemaNotGasPuzzlesMaterializedTable
];

// Pencil Puzzles ///////////////////////////////////

const schemaPencilPuzzlesTable = 
`CREATE TABLE pencil_puzzles(
    Id              INTEGER PRIMARY KEY,
    "Puzzle Title"  TEXT,
    Date            TEXT,
    Solver          TEXT,
    Type            TEXT,
    Setter          TEXT,
    Constraints     TEXT,
    Video           TEXT,
    "Video Length"  TEXT,
    "Video Length (Minutes)" INTEGER
  );`;

const schemaPencilPuzzlesMaterializedTable =
`INSERT INTO pencil_puzzles
select
  "Id", "Puzzle Title", "Date", "Solver", "Type", "Setter", "Constraints", 
  "Video", "Video Length", "Video Length (Minutes)"
from all_puzzles
where "Super Category"='Pencil Puzzles'`;

module.exports.schemaPencilPuzzles = [
    'DROP TABLE IF EXISTS pencil_puzzles',
    schemaPencilPuzzlesTable,
    schemaPencilPuzzlesMaterializedTable,
    'CREATE INDEX pencil_puzzles_type_idx1 on pencil_puzzles(Type)'
];

// Crossword Puzzles ///////////////////////////////////

const schemaCrosswordPuzzlesTable = 
`CREATE TABLE crossword_puzzles(
    Id              INTEGER PRIMARY KEY,
    "Puzzle Title"  TEXT,
    Date            TEXT,
    Solver          TEXT,
    Setter          TEXT,
    Constraints     TEXT,
    Video           TEXT,
    "Video Length"  TEXT,
    "Video Length (Minutes)" INTEGER
  );`;

const schemaCrosswordPuzzlesMaterializedTable =
`INSERT INTO crossword_puzzles
select
  "Id", "Puzzle Title", "Date", "Solver", "Setter", "Constraints", 
  "Video", "Video Length", "Video Length (Minutes)"
from all_puzzles
where "Super Category"='Crossword'`;

module.exports.schemaCrosswordPuzzles = [
    'DROP TABLE IF EXISTS crossword_puzzles',
    schemaCrosswordPuzzlesTable,
    schemaCrosswordPuzzlesMaterializedTable
];