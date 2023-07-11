const process = require('node:process');

const {google} = require('googleapis');
const {_} = require('lodash');
const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require("luxon");

const CTC_CHANNEL_ID = 'UCC-UOdK8-mIjxBQm_ot1T-Q';
var example = 'https://www.youtube.com/watch?v=_Fmp3dQYIss';
var example2 = 'https://www.youtube.com/watch?v=AaC7ehqB3MI&t=30m55s';

// Spreadsheet column schema w/ example values
// 0: Count,5
//     The number of puzzles in the video (each puzzle is a separate row)
// 1: Video Title,Two years of GAS [extra puzzle]
const COL_VIDEO_TITLE = 'Video Title';
// 2: Link YT,https://www.youtube.com/watch?v=AaC7ehqB3MI&t=13m23s
const COL_LINK_YT = 'Link YT';
// 3: Link,YT
// 4: Date,3-Jul-2023
const COL_DATE = 'Date';
// 5: Year,2023
// 6: Month,Jul
// 7: Month (num),7
// 8: Datenum,45110
// 9: Length,0:35:57
// 10: Video length,35m57s
// 11: inc,x
// 12: Time (s),
const COL_VIDEO_LENGTH_SEC = 'Time (s)';
// 13: Time (m),
// 14: Host/Solver,Mark
// 15: Host 1,Mark
// 16: Host 2,
// 17: Host 3,
const COLS_HOST = ['Host 1', 'Host 2', 'Host 3'];
// 18: Video Type,Sudoku
const COL_VIDEO_TYPE = 'Video Type';
// 19: Supercat,Sudoku
const COL_SUPER_CATEGORY = 'Supercat';
// 20: Puzzle Sub-Type / Constraints,Difference
// 21: Constraint 1,Difference
// 22: 2,
// 23: 3,
// 24: 4,
// 25: 5,
// 26: 6,
// 27: 7,
// 28: 8,
// 29: 9,
// 30: 10,
// 31: 11,
// 32: 12,
const COLS_SUB_TYPE = ['Constraint 1', '2','3','4','5','6','7','8','9','10','11','12'];
// 33: Count,1
//     ** DUPLICATE column name **
//     ** Rename to: Constraint Count
//     This is the number of constraints (counts the columns populated above)
// 34: Puzzle Title,Difference
const COL_PUZZLE_TITLE = 'Puzzle Title';
// 35: Setter,Clover
// 36: Setter 1,Clover
// 37: Setter 2,
// 38: Setter 3,
// 39: Setter 4,
// 40: Setter 5,
// 41: AKA,
// 42: AKA 1,
// 43: AKA 2,
// 44: AKA 3,
// 45: AKA 4,
// 46: AKA 5,
const COLS_SETTER_AKA = [ 
    {setter: 'Setter 1', aka: 'AKA 1'},
    {setter: 'Setter 2', aka: 'AKA 2'},
    {setter: 'Setter 3', aka: 'AKA 3'},
    {setter: 'Setter 4', aka: 'AKA 4'},
    {setter: 'Setter 5', aka: 'AKA 5'},
];
// 47: Source,
const COL_SOURCE = 'Source';
// 48: Collection,CTC Discord: Daily Sudoku
const COL_COLLECTION = 'Collection';
// 49: GAS #,727
// 50: GAS/GAPP Date,3-Jun-2023
const COL_GAS_DATE = 'GAS/GAPP Date';
// 51: Sr. No.,4817
const COL_SERIES_NUM = 'Sr. No.';

const schemaVideoTable =
`CREATE TABLE video (
    id              TEXT NOT NULL,
    title           TEXT NOT NULL,
    video_type      TEXT NOT NULL,
    super_category  TEXT NOT NULL,
    date            TEXT NOT NULL,
    length_seconds  INTEGER NOT NULL,
    PRIMARY KEY(id)
)`; // Note: STRICT schema is not supported by Datasette

const schemaVideo = [
    'DROP TABLE IF EXISTS video',
    schemaVideoTable,
    'CREATE INDEX video_video_type_idx1 ON video(video_type)',
    'CREATE INDEX video_super_category_idx1 ON video(super_category)',
    'CREATE INDEX video_date_idx1 ON video(date)'
];

const schemaVideoHostTable =
`CREATE TABLE video_host(
    video_id        TEXT NOT NULL,
    host            TEXT NOT NULL,
    PRIMARY KEY(video_id, host),
    FOREIGN KEY(video_id) REFERENCES video(id)
)`;

const schemaVideoHost = [
    'DROP TABLE IF EXISTS video_host',
    schemaVideoHostTable,
    'CREATE INDEX video_host_host_idx1 ON video_host(host)',
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
    PRIMARY KEY(id),
    FOREIGN KEY(video_id) REFERENCES video(id)
)`; // Note: STRICT schema is not supported by Datasette

const schemaPuzzle = [
    'DROP TABLE IF EXISTS puzzle',
    schemaPuzzleTable,
    'CREATE INDEX puzzle_type_idx1 ON puzzle(type)',
    'CREATE INDEX puzzle_super_category_idx1 ON puzzle(super_category)',
    'CREATE INDEX puzzle_source_idx1 ON puzzle(source)',
    'CREATE INDEX puzzle_collection_idx1 ON puzzle(collection)'
];

const schemaPuzzleSubtypeTable =
`CREATE TABLE puzzle_subtype(
    puzzle_id       INTEGER NOT NULL,
    subtype         TEXT NOT NULL,
    PRIMARY KEY(puzzle_id, subtype),
    FOREIGN KEY(puzzle_id) REFERENCES puzzle(id)
)`;

const schemaPuzzleSubtype = [
    'DROP TABLE IF EXISTS puzzle_subtype',
    schemaPuzzleSubtypeTable,
    'CREATE INDEX puzzle_subtype_idx1 ON puzzle_subtype(subtype)'
];

const schemaPuzzleSetterTable =
`CREATE TABLE puzzle_setter(
    puzzle_id       INTEGER NOT NULL,
    setter          TEXT NOT NULL,
    aka             TEXT,
    PRIMARY KEY(puzzle_id, setter),
    FOREIGN KEY(puzzle_id) REFERENCES puzzle(id)
)`;

const schemaPuzzleSetter = [
    'DROP TABLE IF EXISTS puzzle_setter',
    schemaPuzzleSetterTable,
    'CREATE INDEX puzzle_setter_setter_idx1 ON puzzle_setter(setter)'
];

const sheets = google.sheets({
    version: 'v4',
    auth: 'AIzaSyDv2qVtyomQ5KKnwgtyEPU7S4wVw0VObSA'
});

sheets.spreadsheets.values.get({
    spreadsheetId: '1rVqAjm-l_Urjd3TNmIc3SmTmz_OlgSoBuhY7RPgiuRg',
    range: 'Catalogue',
}).then(
    function onFulfilled(value) {
        var headerRow = value.data.values[1];

        // Column at index 33 is a duplicate name 'Count'
        if(headerRow[33] === 'Count') {
            headerRow[33] = 'Constraint Count';
        } else {
            console.error('FATAL: Unexpected column at index 33 (expected "Count"): ' + headerRow[33]);
            process.exit(1);
        }

        // Assert that there are no duplicate columns in the spreadsheet
        if (!_.isEqual(headerRow, _.uniq(headerRow))) {
            console.error('FATAL: Duplicate header detected in spreadsheet source.');
            process.exit(1);
        }

        // Print schema
        // var row = _.zip(headerRow, value.data.values[4]);
        // _.forEach(row, (val, i) => console.log(i + ': ' + val));

        const db = new sqlite3.Database('db/ctc-catalogue.db');

        db.serialize( () => {
            _.forEach(schemaVideo, stmt => db.run(stmt));
            _.forEach(schemaVideoHost, stmt => db.run(stmt));
            _.forEach(schemaPuzzle, stmt => db.run(stmt));
            _.forEach(schemaPuzzleSubtype, stmt => db.run(stmt));
            _.forEach(schemaPuzzleSetter, stmt => db.run(stmt));

            const insertVideoStmt = db.prepare("INSERT INTO video VALUES (?,?,?,?,?,?)");
            const insertVideoHostStmt = db.prepare("INSERT INTO video_host VALUES(?,?)");
            const insertPuzzleStmt = db.prepare("INSERT INTO puzzle VALUES(?,?,?,?,?,?,?,?,?)");
            const insertPuzzleSubtypeStmt = db.prepare("INSERT INTO puzzle_subtype VALUES(?,?)");
            const insertPuzzleSetterStmt = db.prepare("INSERT INTO puzzle_setter VALUES(?,?,?)");
            try {
                // Map each spreadsheet row into an object, and determine if the record
                // represents an "extra" puzzle or not.
                var records = _.slice(value.data.values, 2).map( (row) => {
                    var record = _.zipObject(headerRow, row);
                    record.isExtraPuzzle = record[COL_VIDEO_TITLE].includes('[extra puzzle]');
                    return record;
                });

                // Sort the records so that all "extra" puzzles are at the end. This will
                // ensure that the video entries they reference are created first.
                records.sort( (a,b) => {
                    if(a.isExtraPuzzle === b.isExtraPuzzle) return 0;
                    return a.isExtraPuzzle ? 1 : -1;
                });

                // Create database entries for all videos and puzzles
                records.forEach( record => {
                    const videoIdRegex = /v=(?<id>[^&]*)/gm;
                    var match = videoIdRegex.exec(record[COL_LINK_YT]);
                    
                    if(match) {
                        var videoId = match.groups.id;

                        // Only populate the video table for records that are not
                        // extra puzzles.
                        if(!record.isExtraPuzzle){
                            insertVideoStmt.run(
                                videoId,
                                record[COL_VIDEO_TITLE],
                                record[COL_VIDEO_TYPE],
                                record[COL_SUPER_CATEGORY],
                                DateTime.fromFormat(record[COL_DATE], 'd-MMM-yyyy').toSQLDate(),
                                record[COL_VIDEO_LENGTH_SEC]
                            );

                            _.forEach(COLS_HOST, col => {
                                var host = record[col];
                                if(host) {
                                    insertVideoHostStmt.run(videoId, host);
                                }
                            });
                        }

                        // Populate puzzle tables for all records -- for both "extra" puzzles
                        // and the first puzzle in each video.
                        var puzzleId = record[COL_SERIES_NUM];

                        // Only extra puzzles are expected to have a video offset
                        // in the YouTube link.
                        const videoOffsetRegex = /t=(?<offset>[^&]*)/gm;
                        var offsetMatch = videoOffsetRegex.exec(record[COL_LINK_YT]);

                        insertPuzzleStmt.run(
                            puzzleId,
                            record[COL_PUZZLE_TITLE],
                            record[COL_VIDEO_TYPE],
                            record[COL_SUPER_CATEGORY],
                            videoId,
                            (record.isExtraPuzzle && offsetMatch ?
                                offsetMatch.groups.offset :
                                null // No video offset for first puzzle in video,
                            ),
                            record[COL_SOURCE],
                            record[COL_COLLECTION],
                            DateTime.fromFormat(record[COL_GAS_DATE], 'd-MMM-yyyy').toSQLDate()
                        );

                        _.forEach(COLS_SUB_TYPE, col => {
                            var subtype = record[col];
                            if(subtype) {
                                insertPuzzleSubtypeStmt.run(puzzleId, subtype);
                            }
                        });

                        _.forEach(COLS_SETTER_AKA, col => {
                            var setter = record[col.setter];
                            if(setter) {
                                insertPuzzleSetterStmt.run(
                                    puzzleId, 
                                    setter,
                                    record[col.aka]);
                            }
                        });
                    } else {
                        console.log("WARN: Unable to determine video id for " + record[COL_LINK_YT]);
                    }  
                });
            } finally {
                insertVideoStmt.finalize();
                insertVideoHostStmt.finalize();
                insertPuzzleStmt.finalize();
                insertPuzzleSubtypeStmt.finalize();
                insertPuzzleSetterStmt.finalize();
            }
        });
        db.close();
        
    },
    function onRejected(reason) {
        console.log(reason);
    }
);

// Each API may support multiple versions. With this sample, we're getting
// v3 of the blogger API, and using an API key to authenticate.
/*
const youtube = google.youtube({
    version: 'v3',
    auth: 'AIzaSyBk54CrEfJONewTd2ORrj-mSP93wWN7RJk'
});

youtube.videos.list({
    part: 'statistics',
    id: '_Fmp3dQYIss'
}, function (err, response) {
    if (err) {
        console.log('The API returned an error: ' + err);
        return;
    }
    console.log(response.data.items[0]);
});
*/

/*
youtube.search.list({
    part: 'snippet',
    type: 'channel',
    q: 'Cracking The Cryptic'
}, function (err, response) {
    if (err) {
        console.log('The API returned an error: ' + err);
        return;
    }
    console.log(response.data.items[0]);
});
*/

/*
youtube.channels.list({
    part: 'id', //'snippet,contentDetails,statistics',
    forUsername: 'CrackingTheCryptic'
}, function (err, response) {
    if (err) {
        console.log('The API returned an error: ' + err);
        return;
    }
    console.log(response);
    var channels = response.data.items;
    if (channels.length == 0) {
        console.log('No channel found.');
    } else {
        console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
            'it has %s views.',
            channels[0].id,
            channels[0].snippet.title,
            channels[0].statistics.viewCount);
    }
});
*/