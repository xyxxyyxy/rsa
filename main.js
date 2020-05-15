let url_to_fetch = ""
let outputs = {}
let username = ""
let n = 0
let e = 0
let d = 0
let logged_in = false
let current = "main"
let users = new Set()
let userKeys = new Set()
let messages = []
outputs["main"] = ""

function pad(num, width, z) {
  z = z || '0';
  num = num + '';
  return num.length >= width ? num : new Array(width - num.length + 1).join(z) + num;
}

function stringToInt(input) {
    let numbers = ""
    let temp = ""
    for (let i = 0; i < input.length; i++) {
        numbers += "" + pad(input.charCodeAt(i), 3)
    }
    if (numbers.charAt(0) == 0) {
        temp += "2"
        for (let i = 1; i < numbers.length; i++) {
            temp += "" + numbers.charAt(i)
        }
    }
    else{
        temp = numbers
    }
    //console.log(temp)
    return temp
}

function intToString(input) {
    input = input + ""
    let temp = ""
    let text = ""
    if (input.charAt(0) == 2) {
        temp += "0"
        for (let i = 1; i < input.length; i++) {
            temp += "" + input.charAt(i)
        }
    }
    else{
        temp = input
    }
    for (let i = 0; i < temp.length; i+=3) {
        let num = "" + temp.charAt(i) +"" + temp.charAt(i+1) + "" + temp.charAt(i+2)
        //console.log(num)
        text += String.fromCharCode( Number(num))
    }
    //console.log(text)
    return text
}

function encrypt(string) {
    let sub = ""
    let ciphertext = ""
    for (let i = 0; i < string.length; i+= 5) {
        sub = "" + string.charAt(i) + "" + string.charAt(i+1) + "" + string.charAt(i+2) +  string.charAt(i+3) + string.charAt(i+4)
        ciphertext+= "" + bigInt(stringToInt(sub)).modPow(d, n).value + ":"
    }
    return ciphertext
    //return stringToInt(string)
    //console.log(intToString(stringToInt(string)))
    //console.log((stringToInt(string) ** e) % n)
    //return (stringToInt(string) ** e) % n
}

function decrypt(num, e0, n0) {
    let plaintext = ""
    if (num.charAt(num.length-1) == ':')
        num = num.slice(0, -1);
    let ciphertext = num.split(":")
    for(let i = 0; i<ciphertext.length; i++){
        plaintext+= intToString(bigInt(ciphertext[i]).modPow(e0, n0).value)
    }
    return plaintext
    //return intToString(num)
    //console.log(binaryToString(num))
    //console.log(binaryToString((num ** d) % n))
    //return binaryToString((num ** d) % n)
}

function writeOutput(data) {
    outputs[current] += '<h6 id="">' + "> " + data + '</h6>'
    document.getElementById("outputHTML").innerHTML = outputs[current];
}

function writeInput(data) {
    outputs[current] += '<h6 id="">' + "< " + data + '</h6>'
    document.getElementById("outputHTML").innerHTML = outputs[current];
}

function showModal() {
    $("#modalServer").modal();
}

function getData() {
    url_to_fetch = document.getElementById('url2').value + ":5000"
    let tmp_url = url_to_fetch + "/test"
    writeOutput(tmp_url)
    fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
        if (data.connection == "ok") {
            writeOutput("connection ok")
            writeOutput("you need to register")
            writeOutput("to do so type \"register username\"")
        } else writeOutput("connection failed")
    })
}

function disconnect() {
    let tmp_url = url_to_fetch + "/delete/" + username
    //writeOutput(tmp_url)
    fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
        if (data.delete == "ok") {
            writeOutput("disconnected successfully")
        }
    })
    n = 0
    e = 0
    d = 0
    username = ""
    logged_in = false
}

function sendMessage(string) {
    now = new Date();
    clock = (now.getHours() < 10 ? "0" + now.getHours() : now.getHours()) + ":" + (now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes()) + ":" + (now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds());
    let tmp_url = url_to_fetch + "/send/" + username + "/" + current + "/" + clock + "/" + encrypt(string)
    fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
        if (data.response == "ok") {
            writeOutput(clock + " " + string)
        } else {
            writeOutput("error message failed to send")
        }
    })
}

function recieveMessages() {
    let tmp_url = url_to_fetch + "/getMessages/" + username
    fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
        for (let i = 0; i < data.messages.length; i++) {
            n0 = 0;
            e0 = 0;
            for (let entry of userKeys.entries()) {
                if (data.messages[i].sender == entry[0].user) {
                    n0 = entry[0].n;
                    e0 = entry[0].e;                }
            }
            console.log(data.messages[i])
            messages.push({
                "user": data.messages[i].sender,
                "time": data.messages[i].time,
                "message": decrypt(data.messages[i].message, e0, n0)
            })
        }
    })
    let indexes = []
    let flag = false
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].user == current) {
            writeInput(messages[i].time + " " + messages[i].message)
            indexes.push(i)
            flag = true
        } else {
            let elem = document.getElementById(messages[i].user);
            elem.style.textDecoration = 'blink';
            elem.style.color = 'rgba(255,0,0,0.5)';
        }
    }
    if (flag) {
        for (let i = messages.length - 1; i >= 0; i--) {
            messages.splice(indexes[i], 1);
        }
    }
}

function parseInput(string) {
    let temp = string.split(" ")
    if (temp[0] == "register") {
        let tmp_url = url_to_fetch + "/register/" + temp[1]
        fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
            username = temp[1]
            if (data.response == "error") {
                writeOutput("error username already taken")
                writeOutput("try again")
            } else {
                n = data.keys.private.n
                d = data.keys.private.d
                e = data.keys.public.e
                writeOutput("registered as " + username)
                writeOutput("private: " + n + " , " + d)
                writeOutput("public: " + n + " , " + e)
                logged_in = true
                setInterval(getUsers, 1000);
                setInterval(getKeys, 1000);
                setInterval(recieveMessages, 1000);
            }
        })
    } else sendMessage(string)
}

function getUsers() {
    if (logged_in) {
        let tmp_url = url_to_fetch + "/users"
        //writeOutput(tmp_url)
        fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
            document.getElementById("table-container").innerHTML = "<a class = \"drop-btn\" id=\"main\" href = \"#\"onclick=\"redirect(this.id)\">main</a>"
            for (let i = 0; i < data.users.length; i++) {
                if (data.users[i] != username) {
                    users.add(data.users[i])
                    document.getElementById("table-container").innerHTML += "<a class = \"drop-btn\" id=\"" + data.users[i] + "\" href = \"#\"onclick=\"redirect(this.id)\">" + data.users[i] + "</a>";
                }
            }
        })
    }
}

function getKeys() {
    if (logged_in) {
        for (let entry of users.entries()) {
            tmp_url = url_to_fetch + "/pubKey/" + entry[0]
            fetch(tmp_url).then((resp) => resp.json()).then(function(data) {
                userKeys.add({
                    "user": entry[0],
                    "n": data.n,
                    "e": data.e
                })
            })
        }
        //console.log(userKeys)
    }
}

function redirect(str) {
    if (outputs[str] == undefined) {
        outputs[str] = ""
        document.getElementById("outputHTML").innerHTML = ""
    } else {
        document.getElementById("outputHTML").innerHTML = outputs[str]
    }
    current = str
    let indexes = []
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].user == str) {
            writeInput(messages[i].time + " " + messages[i].message)
            indexes.push(i)
        }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
        messages.splice(indexes[i], 1);
    }
    let elem = document.getElementById(current);
    elem.style.textDecoration = 'none';
    elem.style.color = '#777';
}

function handle(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        parseInput(document.querySelectorAll('.input')[0].value)
    }
}