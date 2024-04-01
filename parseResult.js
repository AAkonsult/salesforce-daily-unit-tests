const fs = require('fs')

let testResults = JSON.parse(fs.readFileSync('result.json'));
let summary = testResults.result.summary;
let tests = testResults.result.tests;

let slackPayload = {
    text: 'Test Runs Finished',
    blocks: []
}

let hostname = summary.hostname;
const firstPart = summary.hostname.match(/\/\/(.*?)\./);


if (firstPart) {
    hostname = firstPart[1];
}

let summaryText = '';

if(summary.outcome == 'Failed'){
    //If any of the failed tests are because of a record lock, ignore it
    var validFailCounter = 0;
    for(const test of tests){
        if(test.Outcome == 'Fail' && !test.Message.includes('UNABLE_TO_LOCK_ROW')){
            validFailCounter++;
        }
    }
    if(validFailCounter > 0) {
        summary.failing = validFailCounter;
        summaryText = `❌   Automated unit testing for ${summary.username} (${hostname}) has *${summary.outcome}* with ${summary.testsRan} test runs and ${summary.failing} failure(s).`
    } else {
        summary.outcome = 'passed';
        summaryText = `✅   Automated unit testing for ${summary.username} (${hostname}) has *${summary.outcome}* 🎉.`
    }
}
else{
    summaryText = `✅   Automated unit testing for ${summary.username} (${hostname}) has *${summary.outcome}* 🎉.`
}


let summaryBlock = {
    type: 'section',
    text: {
        type: 'mrkdwn',
        text: summaryText
    }
}

slackPayload.blocks.push(summaryBlock);

for(const test of tests){

    if(test.Outcome == 'Fail' && !test.Message.includes('UNABLE_TO_LOCK_ROW')){
        
        let testText = `${test.FullName}: ${test.Message}`;

        let block = {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '`'+testText+'`'
            }
        }

        slackPayload.blocks.push(block);
    }
}

// Convert the object to a JSON string
const jsonData = JSON.stringify(slackPayload); 

// Write the JSON string to the file
fs.writeFileSync('slackPayload.json', jsonData, 'utf-8');
