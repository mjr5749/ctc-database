const process = require('node:process');

const {google} = require('googleapis');
const {_} = require('lodash');
const sqlite3 = require('sqlite3').verbose();

const CTC_CHANNEL_ID = 'UCC-UOdK8-mIjxBQm_ot1T-Q';
var example = 'https://www.youtube.com/watch?v=_Fmp3dQYIss';
var example2 = 'https://www.youtube.com/watch?v=AaC7ehqB3MI&t=30m55s';

/* Spreadsheet column schema w/ example values
0: Count,5
    The number of puzzles in the video (each puzzle is a separate row)
1: Video Title,Two years of GAS [extra puzzle]
2: Link YT,https://www.youtube.com/watch?v=AaC7ehqB3MI&t=13m23s
3: Link,YT
4: Date,3-Jul-2023
5: Year,2023
6: Month,Jul
7: Month (num),7
8: Datenum,45110
9: Length,0:35:57
10: Video length,35m57s
11: inc,x
12: Time (s),
13: Time (m),
14: Host/Solver,Mark
15: Host 1,Mark
16: Host 2,
17: Host 3,
18: Video Type,Sudoku
19: Supercat,Sudoku
20: Puzzle Sub-Type / Constraints,Difference
21: Constraint 1,Difference
22: 2,
23: 3,
24: 4,
25: 5,
26: 6,
27: 7,
28: 8,
29: 9,
30: 10,
31: 11,
32: 12,
33: Count,1
    ** DUPLICATE column name **
    ** Rename to: Constraint Count
    This is the number of constraints (counts the columns populated above)
34: Puzzle Title,Difference
35: Setter,Clover
36: Setter 1,Clover
37: Setter 2,
38: Setter 3,
39: Setter 4,
40: Setter 5,
41: AKA,
42: AKA 1,
43: AKA 2,
44: AKA 3,
45: AKA 4,
46: AKA 5,
47: Source,
48: Collection,CTC Discord: Daily Sudoku
49: GAS #,727
50: GAS/GAPP Date,3-Jun-2023
51: Sr. No.,4817
*/

const schemaVideoTable =
`CREATE TABLE video (
    id              TEXT NOT NULL,
    title           TEXT NOT NULL,
    PRIMARY KEY(id)
) STRICT`;

const sheets = google.sheets({
    version: 'v4',
    auth: 'AIzaSyDv2qVtyomQ5KKnwgtyEPU7S4wVw0VObSA'
});

sheets.spreadsheets.values.get({
    spreadsheetId: '1rVqAjm-l_Urjd3TNmIc3SmTmz_OlgSoBuhY7RPgiuRg',
    range: 'Catalogue!1:50',
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
            db.run('DROP TABLE IF EXISTS video');
            db.run(schemaVideoTable);

            _.slice(value.data.values, 2).forEach( row => {

            });
        });
        db.close();
        
    },
    function onRejected(reason) {
        console.log(reason);
    }
);

console.log('You are here');

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