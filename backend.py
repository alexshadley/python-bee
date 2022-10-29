import collections

from flask import Flask, jsonify, request
from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from evaluator import test_function

import json
import random
from os import environ

names = json.load(open("./usernames.json"))
FIRSTS, LASTS = names["firsts"], names["lasts"]


app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# code = ""
# users = []
# roles = dict()
# scores = collections.defaultdict(lambda: 0)
# current_turn = ""

# game_state = {
#     "question_id": 0,
#     "code": "",
#     "users": [],
#     "roles": dict(),
#     "scores": collections.defaultdict(lambda: 0),
#     "current_turn": "",
# }


class GameState:
    def __init__(self):
        self.question_id = 0
        self.code = ""
        self.users = []
        self.roles = dict()
        self.scores = collections.defaultdict(lambda: 0)
        self.current_turn = ""
        self.question = None
        self.submission_results = []

    def next_turn(self):
        index = next(u for u in self.users if u["id"] == self.current_turn)["index"] + 1
        users_by_index = {user["index"]: user for user in self.users}
        while index not in users_by_index:
            index += 1
            # if we came to the end, loop back around
            if index > max([user["index"] for user in self.users]):
                index = 0

        self.current_turn = users_by_index[index]["id"]

    def broadcast(self):
        emit(
            "updateState",
            {
                "code": self.code,
                "users": self.users,
                "roles": self.roles,
                "scores": self.scores,
                "currentTurn": self.current_turn,
                "question": self.question,
                "submissionResults": self.submission_results,
            },
            broadcast=True,
        )


game_state = GameState()


questions = json.load(open("./questions.json"))


def get_name():
    return random.choice(FIRSTS) + " " + random.choice(LASTS)


@socketio.on("connect")
def connect():
    print("Client connected")

    index = (
        max([user["index"] for user in game_state.users]) + 1 if game_state.users else 0
    )
    new_user = {"name": get_name(), "index": index, "id": request.sid}
    game_state.users.append(new_user)

    # tell everyone about the new user
    # emit("setUsers", users, broadcast=True)
    get_question()

    # initial state setup for new client
    # emit("assignUser", new_user)
    # emit("setCode", code)

    if len(game_state.users) == 1:
        game_state.current_turn = new_user["id"]
    game_state.broadcast()


@socketio.on("disconnect")
def disconnect():
    print("Client disconnected")

    # if it was the player's turn and they left, go to next
    if request.sid == game_state.current_turn:
        game_state.next_turn()

    game_state.users = [u for u in game_state.users if u["id"] != request.sid]
    game_state.broadcast()


@socketio.on("keyPress")
def key_press(key):
    print("key pressed:", key)

    # bail if it's not the player's turn
    if game_state.current_turn != request.sid:
        return

    if len(key) == 1:
        game_state.code += key
    elif key == "Enter":
        game_state.code += "\n"
    elif key == "Tab":
        game_state.code += "    "
    elif key == "Backspace":
        game_state.code = "\n".join(game_state.code.split("\n")[:-1])
        # unless we're at the start, stay on the same line
        if len(game_state.code) > 0:
            game_state.code += "\n"

    game_state.next_turn()
    game_state.broadcast()
    # emit("setCode", code, broadcast=True)
    # emit("setTurn", current_turn, broadcast=True)


@socketio.on("getQuestion")
def get_question():
    id = str(random.choice(list(questions.keys())))

    question_name, question_description, question_stub = (
        questions[id]["name"],
        questions[id]["description"],
        questions[id]["stub"],
    )
    game_state.question_id = id
    game_state.question = {
        "name": question_name,
        "description": question_description,
        "stub": question_stub,
    }
    game_state.roles = dict()
    rand_user = random.randint(0, len(game_state.users) - 1)
    for i, user in enumerate(game_state.users):
        if i == rand_user:
            game_state.roles[user["id"]] = "saboteur"
        else:
            game_state.roles[user["id"]] = "player"
        print(game_state.roles[user["id"]])

    game_state.code = ""
    game_state.submission_results = []

    game_state.broadcast()


@socketio.on("submit")
def submit():
    print("submitted")
    # global code
    # global question_id
    # TODO: why isn't value unpacking working?
    results, correct = test_function(
        questions[str(game_state.question_id)]["stub"] + game_state.code,
        questions[str(game_state.question_id)]["test_cases"],
    )
    game_state.submission_results = results
    print(results)
    # emit("submissionResults", json.dumps(results), broadcast=True)
    # scoreboard = dict()
    for user in game_state.users:
        user_id = user["id"]
        if game_state.roles.get(user_id) == "saboteur":
            game_state.scores[user_id] += 0 if correct else 1
        else:
            game_state.scores[user_id] += 1 if correct else -1
        # scoreboard[user["name"]] = scores[user["id"]]
    # emit("scoreboardUpdate", json.dumps(scoreboard), broadcast=True)

    game_state.broadcast()


@socketio.on("clearCode")
def clear_code():
    game_state.broadcast()


@app.route("/web")
def index():
    return send_from_directory("dist", "index.html")


@app.route("/web/<path:path>")
def files(path):
    print("serving", path)
    return send_from_directory("dist", path)


if __name__ == "__main__":
    if environ.get("PROD") == "1":
        socketio.run(app, host="0.0.0.0", port=80, use_reloader=True)
    else:
        socketio.run(app, port=5001, use_reloader=True)
