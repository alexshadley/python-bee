from numpy import broadcast
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from evaluator import test_function

import json
import random

FIRSTS = ["obfuscated", "abstruse", "erudite", "obscure", "intransigent"]
LASTS = ["condor", "mockingbird", "falcon", "sparrow"]


app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

question_id = 0
code = ""
users = []


def get_name():
    return random.choice(FIRSTS) + " " + random.choice(LASTS)


@socketio.on("connect")
def connect():
    print("Client connected")

    index = max([user["index"] for user in users]) + 1 if users else 0
    new_user = {"name": get_name(), "index": index, "id": request.sid}
    users.append(new_user)
    emit("assignUser", new_user)
    emit("setUsers", users, broadcast=True)

    if len(users) == 1:
        emit("setTurn", new_user["id"])


@socketio.on("disconnect")
def disconnect():
    global users
    print("Client disconnected")

    users = [u for u in users if u["id"] != request.sid]


@socketio.on("keyPress")
def key_press(key):
    global code
    print("key pressed:", key)

    if len(key) == 1:
        code += key
    elif key == "Enter":
        code += "\n"
    elif key == "Backspace":
        # TODO: clearline
        pass

    print(code)
    emit("setCode", code, broadcast=True)

@socketio.on('submit')
def submit():
    global code
    global question_id
    results = test_function(code, [((2,3), 5)])
    emit("submissionResults", results, broadcast=True)

    

# @socketio.on('add_note')
# def add_note(message):
#     notes[(message['id'], message['user'])] = {
#         'id': message['id'],
#         'pitch': message['pitch'],
#         'start': message['start'],
#         'duration': message['duration'],
#         'user': message['user'],
#         'voice': message['voice'] }
#     emit('add_note', message, broadcast=True)

#     print('note added')

# @socketio.on('update_notes')
# def update_notes(message):
#     for note in message['notes']:
#         notes[(note['id'], note['user'])] = {
#             'id': note['id'],
#             'pitch': note['pitch'],
#             'start': note['start'],
#             'duration': note['duration'],
#             'user': note['user'],
#             'voice': note['voice'] }

#     emit('update_notes', message, broadcast=True)
#     print('notes updated')

# @socketio.on('remove_notes')
# def remove_note(message):
#     for id in message['notes']:
#         del notes[(id[0], id[1])]

#     emit('remove_notes', message, broadcast=True)

#     print('notes removed')

# @socketio.on('add_user')
# def add_user(message):

#     def transform_color(c):
#         return 255 - abs((c % 512) - 255)

#     base = random.randrange(512)
#     color = [transform_color(c) for c in [base, base + 128, base + 256]]
#     users[message['name']] = {'name': message['name'], 'color': color, 'sid': request.sid}

#     emit('user_registered', users[message['name']])
#     emit('set_users', [user for _, user in users.items()], broadcast=True)

#     print(f'{message["name"]} added with color {color}')


# @socketio.on('remove_user')
# def remove_user(name):
#     del users[name]
#     emit('set_users', [user for _, user in users.items()], broadcast=True)

#     print(f'{name} disconnected')


# @socketio.on('connect')
# def test_connect():
#     print('Client connected')

#     emit('set_notes', {'notes': [note for _, note in notes.items()]})
#     emit('set_users', [user for _, user in users.items()])

# @socketio.on('disconnect')
# def test_disconnect():
#     user = [u for u in users.values() if u['sid'] == request.sid][0]
#     del users[user['name']]
#     emit('set_users', [user for _, user in users.items()], broadcast=True)

#     print('Client disconnected')

if __name__ == "__main__":
    socketio.run(app, port=5001, use_reloader=True)
