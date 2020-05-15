from flask import Flask
from flask import request
import random
import sympy
import json

from flask_cors import CORS
app = Flask(__name__)
CORS(app)

big_primes = set(sympy.sieve.primerange(10000000, 100000000))

key_dict = {}
users = []
messages_queue = []

def modInverse(a, n): 
    n_init = n
    y = 0
    x = 1
    if (n == 1): 
        return 0
    while (a > 1): 
        q = a // n
        temp = n
        n = a % n
        a = temp
        temp = y
        y = x - q * y
        x = temp
    if (x < 0):
        x += n_init
    return x

def generateRSAKeys():
    p = random.sample(big_primes, 1)[0]
    big_primes.remove(p)
    q = random.sample(big_primes, 1)[0]
    big_primes.remove(q)
    print("p:%s q:%s" % (p,q))
    n = p*q
    euler = (p-1)*(q-1)
    e = random.sample(big_primes, 1)[0]
    d = modInverse(e, euler)
    print("euler:%s n:%s, e:%s, d:%s" % (euler,n, e, d))
    return {"private": {"n": n, "d": d}, "public": {"n": n, "e": e}}

def getKeysForMyself(username):
    return key_dict[username]

@app.route('/pubKey/<username>')
def getPubKey(username):
    return json.dumps(key_dict[username]['public'])


@app.route('/register/<username>')
def register(username):
    if username not in users:
        users.append(username)
        key_dict[username] = generateRSAKeys()
        #print (getKeysForMyself(username))
        return json.dumps({"keys": getKeysForMyself(username)})
    else:
        #print (json.dumps({"error": "username already taken"}))
        return json.dumps({"response": "error"})


@app.route('/send/<sender>/<reciever>/<time>/<message>')
def store_message(sender, reciever, time, message):
    if reciever in users:
        messages_queue.append({"reciever": reciever,
                               "sender": sender,
                               "time": time,
                               "message": message})
        return json.dumps({"response": "ok"})
    else:
        return json.dumps({"response": "error"})

@app.route('/getMessages/<username>')
def getMessageForUser(username):
    temp = [d for d in messages_queue if d.get('reciever') == username]
    messages_queue[:] = [d for d in messages_queue if d.get('reciever') != username]
    return json.dumps({"messages": temp})

@app.route('/test')
def test():
    return json.dumps({"connection": "ok"})

@app.route('/delete/<username>')
def delete(username):
    users.remove(username)
    del key_dict[username]
    return json.dumps({"delete": "ok"})

@app.route('/users')
def getUserList():
    return json.dumps({"users": users})