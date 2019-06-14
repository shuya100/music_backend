/*
 * author: Shuya Fuchigami, 554092
 *
 *
 */


// update contents once at page load
window.addEventListener('load', function () {
    displaySongList();
});


//prevent drag and drop on document
document.ondrop = (event) => {
    event.stopPropagation();
    event.preventDefault();
};
document.ondragover = (event) => {
    event.stopPropagation();
    event.preventDefault();
};


//set event listener for drop zone
let dropZone = document.querySelector("#drop_zone");
Object.entries({
    "dragover": handleDragOver,
    "drop": handleFileDropped,
    "dragleave": handleDragLeave
}).map(([key, value]) => {
    dropZone.addEventListener(key, value, false); //key: event name, value: function name(attention! without parenthesis )
});


function handleDragOver(evt) {
    evt.stopPropagation();  //stops the bubbling of an event to parent elements, preventing any parent event handlers from being executed.
    evt.preventDefault(); //prevent page transition
    evt.dataTransfer.dropEffect = "copy"; // explicity show this is a copy.

    //change style
    dropZone.classList.add("is-dragover");
    //console.log("dragover");
}

//initialize style
function handleDragLeave(evt) {
    dropZone.classList.remove("is-dragover")
}


async function handleFileDropped(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let dropZoneMessage = document.querySelector("#drop_zone_message");
    //dropZoneMessage.innerHTML = "abc";

    //dropped file list
    let files = evt.dataTransfer.files;

    //check number of files
    const maxFileNum = 1;
    if (files.length > maxFileNum) {
        dropZoneMessage.innerHTML = "currently accepts only one file at time";
        handleDragLeave();
        return;
    }

    //reading file
    //let reader = new FileReader();

    //process only the first file
    //reader.readAsArrayBuffer(files[0]);


    //assign file from form
    //process only the first file
    const file = files[0];

    console.log(file.type);

    //TODO: implement here type check (audio/mpeg)!!
    if (!file.type.match("audio/mp3")) {
        dropZoneMessage.innerHTML = "only accepts mp3 audio!";
        return false;
    }

    //if file is empty, return false
    if (file.size = 0) {
        dropZoneMessage.innerHTML = "file is empty";
        return false;
    }

    //prepare data to upload
    const formData = new FormData();
    formData.append("input_file", file); //at siver side it should also be "input_file"

    //uploading message
    dropZoneMessage.innerHTML = "now uploading: " + file.name;

    try {
        const response = await postSong(formData);
        console.log(response);
    } catch (error) {
        console.log(error);
    }

    //upload finish message
    dropZoneMessage.innerHTML = "upload finished: " + file.name;

    //reset
    //file = null;
    //formData = new FormData();

    //initialaize style
    handleDragLeave();

    //reload song list
    displaySongList();
}


//edit table contents
let inTableEditMode = false
let originalRows;
let editStartBtn = document.querySelector("#editStartButton");
editStartBtn.onclick = () => editTable();


Object.defineProperty(this, 'editTable', {
    enumerable: false,
    configurable: false,
    value: async function () {  //TODO: have to be async??

        //get table
        let songSelector = document.querySelector("#songSelectorTable");
        let rows = songSelector.children[0].rows; //<tr> in <table>

        // if in table edit mode, finish the mode and send changes to server.
        if (inTableEditMode) {

            //set cells not editable
            setTableContentsNonEditable(rows);

            // convert to Json
            const json = convertToJson(rows);

            //TODO: we need here try and catch
            //send to server
            postTableContents(json);


            //reset button value
            editStartBtn.value = "🖋";

            //reset visibility
            editCancelBtn.style.visibility = "hidden";

            //set mode
            inTableEditMode = false;


        } else { // if not in edit mode, change to edit mode

            //set mode
            inTableEditMode = true;

            //change visibility
            editCancelBtn.style.visibility = "visible";

            //change button value
            editStartBtn.value = "edit finish";


            //save current table contents
            saveCurrentTableRows(rows);

            // make cells editable
            setTableContentsEditable(rows);

        }
    }
});


/*
    accept song map in array and convert to json.
    TODO: this method can be refactored.
 */
Object.defineProperty(this, 'convertToJson', {
    enumerable: false,
    configurable: false,
    value: function (rows) {

        const keyOrder = ["id", "title", "artist", "album", "year", "genre"];

        // preparation
        let songs = [];
        Array.prototype.slice.call(rows).forEach((value, index) => {
            if (!(index === 0)) { // 0. row is for title and it doesn't have to be processed.

                let song = new Map();
                Array.prototype.slice.call(value.cells).forEach((value, index) => {
                    if (!(index === 6)) {
                        song.set(keyOrder[index], value.innerText);
                    }
                });
                songs.push(song);
            }
        });
        console.log(songs);


        // convert to json
        let jsonsInArray = songs.map((value) => {
            //map to object and to json
            let j = JSON.stringify(Array.from(value).reduce((sum, [v, k]) => (sum[v] = k, sum), {}));
            console.log(j);
            return j;
        });

        let json = "[" + jsonsInArray.join(",") + "]";
        console.log(json);

        return json;
    }
});


/*
    convert from json to object (dictionary)
 */
Object.defineProperty(this, 'convertFromJson', {
    enumerable: false,
    configurable: false,
    value: function (json) {

        //json to object
        const songList = JSON.parse(json);
        //console.log(songList);

        // this is for the "cancel button" -> not any more
        // keys for guaranteed extraction of elements orders in object
        const keyOrder = ["id", "title", "artist", "album", "year", "genre"];

        //oh forEach works!?
        songList.forEach((item) => {
            //console.log(item);
            for (const key of keyOrder) {
                //console.log(key);
                console.log(item[key]);
            }
        });
        return songList;
    }
});


Object.defineProperty(this, 'saveCurrentTableRows', {
    enumerable: false,
    configurable: false,
    value: function (tableRows) {

        // get contents in table
        originalRows = Array.prototype.slice.call(tableRows).map((row) => {
            return Array.prototype.slice.call(row.cells).map((cell) => {
                return cell.innerText;
            });
        });
        console.log(originalRows);
    }
});


Object.defineProperty(this, 'setTableContentsNonEditable', {
    enumerable: false,
    configurable: false,
    value: function (rows) {
        //iteration to set Non-editable
        Array.prototype.slice.call(rows).forEach((value, index) => {
            if (!(index === 0)) { // 0. row is for title and it doesn't have to be processed.
                Array.prototype.slice.call(value.cells).forEach((item) => {
                    item.setAttribute("contenteditable", "false");
                });
            }

        });
    }
});


Object.defineProperty(this, 'setTableContentsEditable', {
    enumerable: false,
    configurable: false,
    value: function (rows) {
        //iteration to set editable

        Array.prototype.slice.call(rows).forEach((row, index) => {
            if (!(index === 0)) { // 0. row is for title and it doesn't have to be editable
                row.classList.remove('greenYellow'); //remove style sheet

                Array.prototype.slice.call(row.cells).forEach((cell) => {
                    if (!(cell.cellIndex === 0 || cell.cellIndex === 6)) { //make cells editable except first and last one in the row.
                        cell.setAttribute("contenteditable", "true");
                    }
                });
            }
        });

    }
});


Object.defineProperty(this, 'removeColorFromTable', {
    enumerable: false,
    configurable: false,
    value: function (rows) {
        //iteration to set editable
        Array.prototype.slice.call(rows).forEach((row, index) => {
            if (!(index === 0)) { // 0. row is for title and it doesn't have to be editable
                row.classList.remove('greenYellow'); //remove style sheet
            }
        });
    }
});


//cancel delete songs
let deleteCancelBtn = document.querySelector("#deleteCancelButton");
deleteCancelBtn.onclick = () => cancelDeleteSongs();
Object.defineProperty(this, 'cancelDeleteSongs', {
    enumerable: false,
    configurable: false,
    value: function () {

        //remove color
        let songSelector = document.querySelector("#songSelectorTable");
        let rows = songSelector.children[0].rows; //<tr> in <table>
        removeColorFromTable(rows);

        //reset visibility
        deleteCancelBtn.style.visibility = "hidden";

        //reset button text
        deleteBtn.value = "✂";

        // set mode
        inDeleteSongMode = false;
    }
});


let editCancelBtn = document.querySelector("#editCancelButton");
editCancelBtn.onclick = () => cancelEditTable();
Object.defineProperty(this, 'cancelEditTable', {
    enumerable: false,
    configurable: false,
    value: function () {
        //get table
        let songSelector = document.querySelector("#songSelectorTable");

        //<tr> in <table>
        let rows = songSelector.children[0].rows;


        //recovery previous contents. (override current table with previous contents )
        Array.prototype.slice.call(rows).forEach((row, rindex) => {
            Array.prototype.slice.call(row.cells).forEach((cell, cindex) => {
                cell.innerText = originalRows[rindex][cindex];
            });
        });


        //set to non editable
        setTableContentsNonEditable(rows);

        //reset button value
        editStartBtn.value = "🖋";

        //reset visibility
        editCancelBtn.style.visibility = "hidden";

        //set mode
        inTableEditMode = false;
    }
});


//get element in table
document.addEventListener('click', function (e) {

    if (inTableEditMode | inDeleteSongMode) return; // if in table edit mode return;

    let t = e.target;
    if (t.nodeName == "TD") {
        Array.prototype.map.call(t.parentNode.parentNode.children, function (x) {
            x.classList.remove('greenYellow');

            // avoid 0 row to be colored
            if (x.rowIndex === 0) return;

            if (x == t.parentNode) {
                x.classList.add('greenYellow');
                let ch = x.children;
                clickedID = ch[0].textContent; //the first children for id
                document.querySelector("#songIDInput").value = clickedID;

                // for debug table
                let tableDebug = document.querySelector('#tableDebug');
                //clear previous data
                while (tableDebug.lastChild) {
                    tableDebug.removeChild(tableDebug.lastChild);
                }

                //convert HTMLCollection to array
                let ch2 = Array.from(ch);
                let ul = document.createElement("ul");

                ch2.forEach((value, index) => {
                    //console.log({index, value});
                    const li = document.createElement("li");
                    li.innerHTML = index + ": " + value.textContent;
                    ul.appendChild(li);
                });

                // show debug table
                document.querySelector('#tableDebug').appendChild(ul);

                // show in console
                console.log(ch2);
            }
        });
    }
});


// get element in table for delete mode (multiple choice)
document.addEventListener('click', function (event) {

    // only for delete mode
    if (!inDeleteSongMode) return;

    let target = event.target;
    if (target.nodeName == "TD") {

        Array.prototype.map.call(target.parentNode.parentNode.children, function (tr) {

            // avoid 0 row to be selected
            if (tr.rowIndex === 0) return;

            if (tr == target.parentNode) {

                // give color for selected
                if (tr.classList.contains("greenYellow")) {
                    tr.classList.remove('greenYellow');
                } else {
                    tr.classList.add('greenYellow');
                }
            }
        });
    }
});


var audioCtx;
var startBtn = document.querySelector('#startAudioContext');
var susresBtn = document.querySelector('#suspendAudioContext');
var stopBtn = document.querySelector('#stopAudioContext');
var timeDisplay = document.querySelector('#counter');
var clickedID;

susresBtn.setAttribute('disabled', 'disabled');
stopBtn.setAttribute('disabled', 'disabled');
startBtn.onclick = () => start();


async function start() {
    startBtn.setAttribute('disabled', 'disabled');
    susresBtn.removeAttribute('disabled');
    stopBtn.removeAttribute('disabled');

    //let songID = document.querySelector("#songIDInput").value;
    songID = clickedID;
    //document.querySelector("#songIDInput").value = clickedID;
    console.log(songID);

    try {
        // create web audio api context
        AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        let gainNode = audioCtx.createGain();
        let audioSource = audioCtx.createBufferSource();


        //https://sbfl.net/blog/2016/07/13/simplifying-async-code-with-promise-and-async-await/
        //await Promise to be solved
        let buffer = await getSong(songID);
        console.log(buffer.byteLength);

        //because buffer is a Promise Object, you have to wait till it's set to settled.
        //https://developer.mozilla.org/ja/docs/Web/API/AudioContext/decodeAudioData
        audioCtx.decodeAudioData(buffer).then((decodedAudio) => { //(decodedAudio)=>{} means function(decodedAudio){}
            audioSource.buffer = decodedAudio;
            console.log(decodedAudio);
        }).catch((error) => console.log(error));

        //preparation
        audioSource.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        //play
        audioSource.start(0);

    } catch (error) {
        console.log(error);
    }

    // report the state of the audio context to the
    // console, when it changes
    audioCtx.onstatechange = function () {
        console.log(audioCtx.state);
    }
}


// suspend/resume the audiocontext
susresBtn.onclick = function () {
    if (audioCtx.state === 'running') {
        audioCtx.suspend().then(function () {
            susresBtn.textContent = 'Resume context';
        });
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(function () {
            susresBtn.textContent = 'Suspend context';
        });
    }
}

// close the audiocontext
stopBtn.onclick = function () {
    audioCtx.close().then(function () {
        startBtn.removeAttribute('disabled');
        susresBtn.setAttribute('disabled', 'disabled');
        stopBtn.setAttribute('disabled', 'disabled');
    });
}


//TODO: 一時停止中の処理などはここを参考にして実装する必要があると思う。
//have to implement process during pause
//https://www.tcmobile.jp/dev_blog/programming/web-audio-api%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%A6%E7%B0%A1%E5%8D%98%E3%81%AA%E3%83%97%E3%83%AC%E3%82%A4%E3%83%A4%E3%83%BC%E3%82%92%E4%BD%9C%E3%81%A3%E3%81%A6%E3%81%BF%E3%82%8B%EF%BC%883%EF%BC%89/

function displayTime() {
    if (audioCtx && audioCtx.state !== 'closed') {
        timeDisplay.textContent = 'time: ' + audioCtx.currentTime.toFixed(3);
    } else {
        timeDisplay.textContent = 'time: not playing. select song'
    }
    requestAnimationFrame(displayTime);
}
displayTime();


//display song list on in table
Object.defineProperty(this, 'displaySongList', {
    enumerable: false,
    configurable: false,
    value: async function () {
        let songList = await getSongList();
        console.log(songList);

        //get div
        let songSelector = document.querySelector("#songSelectorTable");

        // clear previous data
        while (songSelector.lastChild) {
            songSelector.removeChild(songSelector.lastChild);
        }

        //create table
        let table = document.createElement("table");
        table.border = 1;
        table.style = "border: 1px solid #ccc; border-collapse: collapse;";
        table.style = "padding: 10px";
        songSelector.appendChild(table);

        //insert table head ( the first row )
        const songTitle = songList[0]; // use any one for the title. songList looks like 0: {id: 25, title: "title25", artist: "ketsumeishi", album: "album25", year: 2019, …} and then 1: {id: 45, title: "title here", artist: "artist here", album: "album here", year: "year here", …}
        let tr = table.insertRow(-1);

        for (const key of Object.keys(songTitle)) {  // with Object.keys() to get iterable keys. https://www.sejuku.net/blog/27965
            if (key==="created_at") continue; //continue: stop executing code below and continue to next loop;  break: stop executing rest of the loop
            tr.insertCell(-1).innerHTML = key;
        }

        //cell for each song
        for (const song of songList) {
            let tr = table.insertRow(-1);
            for (const [key,value] of Object.entries(song)) {
                if (key==="created_at") continue;
                tr.insertCell(-1).innerHTML = value;
            }
        }
    }
});


Object.defineProperty(this, 'getSongList', {
    enumerable: false,
    configurable: false,
    value: async function () {
        const resource = "/songs";

        let response = await fetch(resource, {
            method: 'GET',
            credentials: "include", //https://chaika.hatenablog.com/entry/2019/01/08/123000
            headers: {Accept: "application/json"}
        });
        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
        let result = await response.json();
        return result;
    }
});


//retrieve song from server
Object.defineProperty(this, 'getSong', {
    enumerable: false,
    configurable: false,
    value: async function (songID) {
        const resource = "/songs/" + songID;
        let response = await fetch(resource, {
            method: "GET",
            credentials: "include",　//https://chaika.hatenablog.com/entry/2019/01/08/123000
            headers: {
                "Accept": "audio/*"
            }
        });

        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);

        let arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    }
});


//post song to server
Object.defineProperty(this, 'postSong', {
    enumerable: false,
    configurable: false,
    value: async function (formData) {

        const resource = "/songs";
        let response = await fetch(resource, {
            method: "POST",
            credentials: "include",　//https://chaika.hatenablog.com/entry/2019/01/08/123000
            body: formData,
        });

        //TODO: this works?? shoulb be after (!response.ok) and with await?
        //show response json
        /*
        const result = (response.json()).then(j => {
            return j
        });
         */

        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);

        const result = await response.json();
        console.log(result);

        return result;
    }
});


//post table contents to server
Object.defineProperty(this, 'postTableContents', {
    enumerable: false,
    configurable: false,
    value: async function (json) {

        const resource = "/songs";
        let response = await fetch(resource, {
            method: "POST",
            credentials: "include",　//https://chaika.hatenablog.com/entry/2019/01/08/123000
            headers: {
                'Accept': 'application/json',
                "Content-Type": "application/json"
            },
            body: json,
        });

        //show response json
        /*
        const result = (response.json()).then(j => {
            return j
        });
        */

        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);

        const result = await response.json();
        console.log(result);

        return result;
    }
});


//delete song
let deleteBtn = document.querySelector("#deleteButton");
deleteBtn.onclick = () => deleteSongs();
let inDeleteSongMode = false;
let areYouSure = false;
Object.defineProperty(this, 'deleteSongs', {
    enumerable: false,
    configurable: false,
    value: async function () {

        //get button
        let deleteBtn = document.querySelector("#deleteButton");

        //get table
        let songSelector = document.querySelector("#songSelectorTable");
        let rows = songSelector.children[0].rows; //<tr> in <table>


        //if it's not in delete song mode, change mode to it.
        if (!inDeleteSongMode) {

            //set mode and button text
            inDeleteSongMode = true;
            deleteBtn.value = "finish and submit deletion";

            //change visibility
            deleteCancelBtn.style.visibility = "visible";

            //remove color
            removeColorFromTable(rows);

        } else { //send request to server

            //get table
            //let songSelector = document.querySelector("#songSelectorTable");
            //let rows = songSelector.children[0].rows; //<tr> in <table>

            //get checked item
            let selectedSongs = getSelectedItemsInTable(rows);
            console.log(selectedSongs);

            highlightSelectedItemsInTable02(rows);

            // if any songs are selected
            if (!(selectedSongs.length === 0)) {

                //create confirmation message
                let confirmationMessage = "The following songs will be deleted.\n";
                selectedSongs.forEach((song) => {
                    const id = song[0];
                    const title = song[1];
                    confirmationMessage += id + ": " + title + "\n";
                });

                //confirmation message
                if (window.confirm(confirmationMessage)) {
                    //communicate with server
                    for (const song of selectedSongs){
                        const id = song[0];
                        await deleteSong(id);
                    }
                    // reload song list
                    displaySongList();
                } else { //if cancel clicked
                    return;
                }
            }

            //change visibility
            deleteCancelBtn.style.visibility = "hidden";

            //reset button text
            deleteBtn.value = "✂";

            // set mode
            inDeleteSongMode = false;
        }
    }
});


// get selected items
Object.defineProperty(this, 'getSelectedItemsInTable', {
    enumerable: false,
    configurable: false,
    value: function (rows) {

        //iteration through song table
        return Array.prototype.slice.call(rows).map((row) => {

            // 0. row is for title and it doesn't have to be processed.
            // 7. cell is for checkbox
            if (!(row.rowIndex === 0) && (row.classList.contains("greenYellow"))) {
                return Array.prototype.slice.call(row.cells).map((cell) => {
                    return cell.innerText;
                });
            }
        }).filter(e => !(e === undefined)); //return only "not" undefined
    }
});


Object.defineProperty(this, 'highlightSelectedItemsInTable', {
    enumerable: false,
    configurable: false,
    value: function (rows) {
        //iteration to highlight
        Array.prototype.slice.call(rows).forEach((row, index) => {
            if (!(index === 0)) { // 0. row is for title and it doesn't have to be editable
                row.classList.remove('greenYellow'); //remove style sheet
            }
        });
    }
});


// get selected items
Object.defineProperty(this, 'highlightSelectedItemsInTable02', {
    enumerable: false,
    configurable: false,
    value: function (rows) {
        //iteration through song table
        Array.prototype.slice.call(rows).map((row) => {
            // 0. row is for title and it doesn't have to be processed.
            // 7. cell is for checkbox
            if (!(row.rowIndex === 0) && (row.classList.contains("greenYellow"))) {
                    row.classList.add("red");
            }
        });
    }
});



//send delete request to server
Object.defineProperty(this, 'deleteSong', {
    enumerable: false,
    configurable: false,
    value: async function (id) {

        const resource = "/songs" + "/" + id;
        let response = await fetch(resource, {
            method: "DELETE",
            credentials: "include",　//https://chaika.hatenablog.com/entry/2019/01/08/123000
        });

        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);

        const result = await response.json();
        console.log(result);

        return result;
    }
});


const selectFileBtn = document.querySelector("#selectFileButton");
const selectFileLabel = document.querySelector("#selectFileLabel");
//selectFileBtn.onchange = () => uploadSongButton(); // not possible to carry parameters??
selectFileBtn.addEventListener('change', uploadSongButton, false); //doesn't work with define property ??

// upload file with button
//TODO: partly overlapped with which for drag and drop
async function uploadSongButton(evt) {

    console.log("hello unloadSong02()");
    console.log(selectFileLabel);


    //assign file from dialog
    //only first file
    let file = evt.target.files[0];

    //get dom
    let dropZoneMessage = document.querySelector("#drop_zone_message");


    if (file.size === 0) { //if file is empty, return false
        dropZoneMessage.innerHTML = "file is empty";
        return false;
    }

    console.log(file);


    //prepare data to upload
    let formData = new FormData();
    formData.append("input_file", file); //data will be sent with this property name

    //disable button while uploading to prevent from multiple click
    selectFileBtn.disable = true;
    selectFileLabel.innerText = "wait";

    //uploading message
    dropZoneMessage.innerHTML = "now uploading: " + file.name;

    try {
        const response = await postSong(formData);
        console.log(response);
    } catch (error) {
        console.log(error);
    }

    //upload finish message
    dropZoneMessage.innerHTML = "upload finished: " + file.name;

    //enable button again
    selectFileBtn.disabled = false;
    selectFileLabel.innerText = "or click here";

    //free memory....
    file = null;
    formData = new FormData();

    //renew song list
    displaySongList();
}

