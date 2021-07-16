const { exec } = require("child_process");

function createTextFile() {
    const command = `(for %i in (DownloadedStreams/*.mp4) do @echo file 'DownloadedStreams/%i') > mylist.txt`
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

function joinFileAndGiveOutput () {
    const command = `ffmpeg -f concat -i mylist.txt -c copy DownloadedStreams/output.mp4`

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

module.exports = {
    createTextFile,
    joinFileAndGiveOutput
}


