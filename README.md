# rollbackRevisionsGoogleDrive
This script rolls back the revision of all the files in Google Drive

First get a credentials file from Google by following the steps here: https://developers.google.com/drive/api/v3/quickstart/nodejs

Once you have saved the credentials.json in the root folder, run "node app.js"



# Description
I was attacked by ransomware that encrypted all the files on my PC, including the files in my Google Drive which was synced to the cloud
because I had Google Sync & Backup installed.

To rescue the files in my Google Drive I needed a way to rollback the files to previous versions.

The ransomware changed the extension of the files (.09j21711) so the script uses that to find all the damaged files.

It then checks that the date of the last revision was on the date of the attack, and if it is, deletes the revision.

Once the revision has been deleted, it renames the file to remove the extension.