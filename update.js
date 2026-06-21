const fs = require('fs');

const CACHE_FILE = '.sync-cache.json';

function getJsonFiles(folder) {
    return fs.readdirSync(folder)
        .filter(file => file.endsWith('.json'))
        .sort();
}

function replaceArrayInFile(filePath, variableName, files) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        const arrayString =
`${variableName} = [
${files.map(f => `    '${f}'`).join(',\n')}
];`;

        const regex = new RegExp(
            `${variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*\\[[\\s\\S]*?\\];`
        );

        if (!regex.test(content)) {
            throw new Error(`${variableName} not found`);
        }

        content = content.replace(regex, arrayString);

        fs.writeFileSync(filePath, content, 'utf8');

        return {
            file: filePath,
            success: true
        };
    } catch (err) {
        return {
            file: filePath,
            success: false,
            error: err.message
        };
    }
}

function loadCache() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {
        return {
            events: [],
            hadith: []
        };
    }
}

function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function difference(current, previous) {
    return current.filter(x => !previous.includes(x));
}

function printSection(title, folder, files, newFiles, results) {

    console.log('\n====================================================');
    console.log(` ${title}`);
    console.log('====================================================');

    console.log(`Source Folder : ${folder}`);
    console.log(`Files Found   : ${files.length}`);
    console.log(`New Files     : ${newFiles.length}`);

    console.log('\nAdded Files');

    if (newFiles.length === 0) {
        console.log('  None');
    } else {
        newFiles.forEach(file => {
            console.log(`  + ${file}`);
        });
    }

    console.log('\nUpdated Files');

    results.forEach(r => {
        if (r.success)
            console.log(`  ✓ ${r.file}`);
        else
            console.log(`  ✗ ${r.file}`);
    });
}

console.log('\n====================================================');
console.log('             SAFEENAH CONTENT SYNC');
console.log('====================================================');

const cache = loadCache();


//
// EVENTS
//
const eventFiles = getJsonFiles('data/events');
const newEventFiles = difference(eventFiles, cache.events);

const eventResults = [];

eventResults.push(
    replaceArrayInFile(
        'timeline.html',
        'const EVENT_FILES',
        eventFiles
    )
);

eventResults.push(
    replaceArrayInFile(
        'event/index.html',
        'const EVENT_FILES',
        eventFiles
    )
);

eventResults.push(
    replaceArrayInFile(
        'home.html',
        'const EVENT_FILES',
        eventFiles.map(f => `data/events/${f}`)
    )
);

printSection(
    'EVENTS',
    'data/events',
    eventFiles,
    newEventFiles,
    eventResults
);


//
// HADITH
//
const hadithFiles = getJsonFiles('data/hadith');
const newHadithFiles = difference(hadithFiles, cache.hadith);

const hadithResults = [];

hadithResults.push(
    replaceArrayInFile(
        'hadith.html',
        'const HADITH_FILES',
        hadithFiles
    )
);

hadithResults.push(
    replaceArrayInFile(
        'hadith/index.html',
        'const HADITH_FILES',
        hadithFiles
    )
);

hadithResults.push(
    replaceArrayInFile(
        'home.html',
        'const HADITH_FILES',
        hadithFiles.map(f => `data/hadith/${f}`)
    )
);

printSection(
    'HADITH',
    'data/hadith',
    hadithFiles,
    newHadithFiles,
    hadithResults
);

//
// SAVE CACHE
//
cache.events = eventFiles;
cache.hadith = hadithFiles;

saveCache(cache);

//
// SUMMARY
//
const allResults = [...eventResults, ...hadithResults];

const successCount = allResults.filter(x => x.success).length;
const failedCount = allResults.filter(x => !x.success);

console.log('\n====================================================');
console.log(' SUMMARY');
console.log('====================================================');

console.log(`Event Files  : ${eventFiles.length}`);
console.log(`Hadith Files : ${hadithFiles.length}`);
console.log(`Files Updated: ${successCount}`);

if (failedCount.length === 0) {
    console.log('\n✓ Synchronization completed successfully.');
}
else {

    console.log('\nERRORS');

    failedCount.forEach(err => {
        console.log('\n------------------------------------');
        console.log(`File   : ${err.file}`);
        console.log(`Reason : ${err.error}`);
    });

}