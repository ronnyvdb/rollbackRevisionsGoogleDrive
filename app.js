const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const _SEARCH_QUERY = "name contains '09j21711'";

var requestCounter = 0;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('./credentials.json', (err, content) => {
  let requestCounter = 1;
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listFiles);

  // Google returns ~100 files on each request so we call this every 7 minutes to
  // get the next 100 files
  // TODO: Implement the pageToken/nextPageToken functionality 
  setInterval(function(){ authorize(JSON.parse(content), listFiles); }, 420000);
  
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the files retrieved from google drive
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {

  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    q: _SEARCH_QUERY,
    fields: '*',
  }, async (err, res) => {
    console.log(`RECEIVED ${res.data.files.length} FILES`);
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
     
      for(let file of files)
        await listRevisions(drive, file);

    } else {
      console.log('No files found.');
    }
  });
}

/**
 * Gets the revisions of the file.
 * @param {google.drive} drive The authorized drive object.
 * @param {google.drive.file} file A file retrieved from Google Drive.
 */
function listRevisions(drive, file) {
  return new Promise(resolve => {
    console.log(`Doing request #${requestCounter++}`);
    drive.revisions.list({
      'fileId': file.id
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      
      const revisions = res.data.revisions;
      if (revisions.length >= 2) {
        console.log('We have 2 or more revisions:');
        
        console.log("");
        console.log(file.name);
        //console.log(revisions);
        console.log("");
  
        if(revisions[revisions.length - 1].modifiedTime.startsWith('2019-05-13') ){
          drive.revisions.delete({
            'fileId': file.id,
            'revisionId': revisions[revisions.length - 1].id
          }, (err, res) => {
            if (err) return console.log('The API returned an error when trying to delete revision: ' + err);
    
            console.log('FIXED FILED: ', file.name);
    
            renameFile(drive, file);
          })
        }
        //getReivision(drive,file, revisions[1]);
        /*
        
        */
        
      } else if(revisions.length === 1) {
        console.log('Only one revision avialble for ', file.name);
        renameFile(drive, file);
  
      } else {
        console.log('No revisions were found.');
      }
    });

    setTimeout(resolve, 3000);
  });
}



/**
 * Lists the names and IDs of up to 10 files.
 */
function renameFile(drive, file) {
  var body = {'name': file.name.replace('.09j21711', '')};
  drive.files.update({
    'fileId': file.id,
    'resource': body
  }, (err, res) => {
    if (err) return console.log('The API returned an error when RENAMING the file: ' + err);
  
      console.log('FILE RENAMED');

  });
}