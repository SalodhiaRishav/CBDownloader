const mongodb = require('mongodb');
var fetch = require('fetch');
var fs = require('fs');
var path = require('path');
const fetchs = require("node-fetch");

const mongoClient = mongodb.MongoClient
const binary = mongodb.Binary

const uri = "mongodb+srv://TashDbUser1:4321@cluster0.grl4g.mongodb.net/Tdb?retryWrites=true&w=majority";
const client = mongoClient(uri);
client.connect();

const storedfileNames = [];
let saveFileTimer;

function insertFileWithNames (name, res) {
    const url = "https://chaturbate.com/get_edge_hls_url_ajax/";

    const headers = {
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundary",
        "x-requested-with": "XMLHttpRequest",
    };

    const body = "------WebKitFormBoundary\r\nContent-Disposition: form-data; name=\"room_slug\"\r\n\r\n" + name + "\r\n------WebKitFormBoundary\r\nContent-Disposition: form-data; name=\"bandwidth\"\r\n\r\nhigh\r\n";

    const method = "POST";

    const options = {
        headers: headers,
        body: body,
        method: method
    };

    fetchs(url, options)
    .catch(error => {
        res.send(error.toString());
        console.log(error.toString());
    })
    .then(res => res.json())
    .then(json => {
        if (json.url === '')
        {
            console.log('offline user');
            res.send('offline user');
        }
        else
        {
            getStreamResolutions(name, json.url, res)
        }
    })
}

function getStreamResolutions (name, playListUrl, res) {
    fetch.fetchUrl(playListUrl, function (err, meta, body) {
        if (err)
        {
            console.log('Error fetching url:' + playListUrl);
            res.send('Error fetching url: ' + playListUrl)
        }
        else
        {
            if (!body)
            {
                res.send('some error in getStreamResolutions body')
                console.log('some error try some error in getStreamResolutions body')
            }
            else
            {
                const bodyString = body.toString();
    
                if (!bodyString)
                {
                    res.send('error in getStreamResolutions body.toString(), maybe user offline or private')
                    console.log('error in getStreamResolutions body.toString(), maybe user offline or private');
                }
                else
                {
                    let re = /chunklist.*/g;
                    var result = [...bodyString.matchAll(re)];
                    const fileUrl = playListUrl.replace('playlist.m3u8', result[1][0]);
                    const regX = /(.*)chunklist(.*).m3u8/;
                    const match = fileUrl.match(regX);
                    const baseAddress = match[1];
                    const mediaAddress = baseAddress + 'media' + match[2];

                    saveFileTimer = setInterval(() => {
                        loopInsertFileWithNames(name, fileUrl, mediaAddress)
                    }, 2000);

                    res.redirect('/')
                }
            }
        }
    })
}

async function stopFetchingFiles (res) {
    closeTimer();
    res.redirect('/')
}

function closeTimer () {
    if (saveFileTimer) {
        clearInterval(saveFileTimer);
        console.log('Stopped timer successfully');
    }
}

function loopInsertFileWithNames(name, uri, mediaAddress) {
    fetch.fetchUrl(uri, function (err, meta, body) {
        if (err)
        {
            console.log('Error fetching url:', uri);
            closeTimer();
        }
        else
        {
            if (!body)
            {
                console.log('some error try some error in loopInsertFileWithNames body');
                closeTimer();
            }
            else
            {
                const bodyString = body.toString();

                if (!bodyString)
                {
                    console.log('error in loopInsertFileWithNames body.toString(), maybe user offline or private');
                    closeTimer();
                }
                else
                {
                    var re = /_(\d*).ts/g;
                    var result = [...bodyString.matchAll(re)];
                   
                    for(let i=0;i < result.length; ++i) {
                        storeFileStream(name, mediaAddress, result[i][0]);
                    }
                } 
            }
        }
    })
}

function storeFileStream (name, mediaAddress, fileName) {
    const fileNameToStore = name + fileName.replace('.ts', '');

    if (storedfileNames.indexOf(fileNameToStore) === -1)
    {
        storedfileNames.push(fileNameToStore);

        const url = mediaAddress + fileName;

        fetch.fetchUrl(url, function (err, meta, body)
        {
            if (err)
            {
                console.log('Error fetching ts file url:', uri);
            }

            if (!body)
            {
                console.log('ssome error in storeFileStream body');
                closeTimer();
            }
            else
            {
                try
                {
                    var b64 = Buffer.from(body).toString('base64');
                    let collection = client.db('Tdb').collection('videoes');
                    collection.insertOne({name: fileNameToStore, data: b64})
                    console.log(fileNameToStore + ' file inserted successfully')
                }
                catch (e)
                {
                    console.log(e);
                    closeTimer();
                }
            }
        })
    }
}

async function downloadAllVideos(res) {
    try
    {
        let collection = client.db('Tdb').collection('videoes');

        let resultCursor = collection.find();

        let pathToSave = path.resolve(__dirname, 'DownloadedStreams','s_');

        resultCursor.forEach(x => {
            if (x && x.name && x.data)
            {
                let abs = pathToSave + x.name + '.mp4';
                
                fs.writeFile(abs, x.data, 'base64', function (err) {
                    if (err)
                    {
                        console.log("File video write error", err);
                    }
                    else
                    {
                        console.log(abs + ' saved successfully');
                    }
                });
            }
            else
            {
                console.log('error while fetching files from db')
            }
        });
        
        res.redirect('/');
    }
    catch (e)
    {
        console.log(e);
    }
}

async function getFileNames(res) {
    try
    {
        let collection = client.db('Tdb').collection('videoes');
        const estimate = await collection.estimatedDocumentCount();
        if (estimate) {
            res.send(estimate.toString())
        } else {
            res.send('no found')
        }
    }
    catch (e)
    {
        console.log(e);
    }
}

async function deleteAll(res) {
    try
    {
        let collection = client.db('Tdb').collection('videoes');
        collection.remove()

        console.log('data removed successfully')
        
        res.redirect('/');
    }
    catch (e)
    {
        console.log(e);
    }
}


module.exports = {
    binary,
    insertFileWithNames,
    stopFetchingFiles,
    downloadAllVideos,
    deleteAll,
    getFileNames
}