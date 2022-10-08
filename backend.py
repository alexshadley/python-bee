import collections

from flask import Flask, jsonify, request
from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from evaluator import test_function

import json
import random

names = json.load(open("./usernames.json"))
FIRSTS, LASTS = names["firsts"], names["lasts"]


app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

question_id = 0
code = ""
users = []
roles = dict()
scores = collections.defaultdict(lambda: 0)
current_turn = ""

questions = json.load(open("./questions.json"))


def next_turn():
    global current_turn
    index = next(u for u in users if u["id"] == current_turn)["index"] + 1
    users_by_index = {user["index"]: user for user in users}
    while index not in users_by_index:
        index += 1
        # if we came to the end, loop back around
        if index > max([user["index"] for user in users]):
            index = 0

    current_turn = users_by_index[index]["id"]


def get_name():
    return random.choice(FIRSTS) + " " + random.choice(LASTS)


@socketio.on("connect")
def connect():
    print("Client connected")

    index = max([user["index"] for user in users]) + 1 if users else 0
    new_user = {"name": get_name(), "index": index, "id": request.sid}
    users.append(new_user)

    # tell everyone about the new user
    emit("setUsers", users, broadcast=True)
    get_question()

    # initial state setup for new client
    emit("assignUser", new_user)
    emit("setCode", code)

    if len(users) == 1:
        global current_turn
        current_turn = request.sid
    emit("setTurn", current_turn)


@socketio.on("disconnect")
def disconnect():
    global users
    print("Client disconnected")

    # if it was the player's turn and they left, go to next
    if request.sid == current_turn:
        next_turn()

    users = [u for u in users if u["id"] != request.sid]
    emit("setUsers", users, broadcast=True)


@socketio.on("keyPress")
def key_press(key):
    global code
    print("key pressed:", key)

    if len(key) == 1:
        code += key
    elif key == "Enter":
        code += "\n"
    elif key == "Tab":
        code += "    "
    elif key == "Backspace":
        code = "\n".join(code.split("\n")[:-1])
        # unless we're at the start, stay on the same line
        if len(code) > 0:
            code += "\n"

    next_turn()
    emit("setCode", code, broadcast=True)
    emit("setTurn", current_turn, broadcast=True)


@socketio.on("getQuestion")
def get_question(id=None):
    global question_id
    global code
    if id is None:
        id = random.choice(list(questions.keys()))
    print(id)
    id = str(id)

    question_name, question_description, question_stub = (
        questions[id]["name"],
        questions[id]["description"],
        questions[id]["stub"],
    )
    emit("setCode", code, broadcast=True)
    question_id = id
    emit(
        "questionContent",
        json.dumps(
            {
                "name": question_name,
                "description": question_description,
                "stub": question_stub,
            }
        ),
        broadcast=True,
    )
    roles = dict()
    rand_user = random.randint(0, len(users) - 1)
    for i, user in enumerate(users):
        if i == rand_user:
            roles[user["id"]] = "saboteur"
        else:
            roles[user["id"]] = "player"
        print(roles[user["id"]])
        emit("setRole", roles[user["id"]], room=user["id"])


@socketio.on("submit")
def submit():
    print("submitted")
    global code
    global question_id
    results, correct = test_function(
        questions[str(question_id)]["stub"] + code,
        questions[str(question_id)]["test_cases"],
    )
    print(results)
    emit("submissionResults", json.dumps(results), broadcast=True)
    scoreboard = dict()
    for user in users:
        user_id = user["id"]
        if roles.get(user_id) == "saboteur":
            scores[user_id] += 0 if correct else 1
        else:
            scores[user_id] += 1 if correct else -1
        scoreboard[user["name"]] = scores[user["id"]]
    emit("scoreboardUpdate", json.dumps(scoreboard), broadcast=True)


@socketio.on("clearCode")
def clear_code():
    global code
    code = ""
    emit("setCode", code, broadcast=True)


@app.route("/web")
def index():
    return send_from_directory("dist", "index.html")


@app.route("/web/<path:path>")
def files(path):
    print("serving", path)
    return send_from_directory("dist", path)


if __name__ == "__main__":
    socketio.run(app, port=5001, use_reloader=True)
