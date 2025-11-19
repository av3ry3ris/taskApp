import sqlite3
from flask import Flask, render_template, request, jsonify, g

app = Flask(__name__)

DATABASE = "tasks.db"

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()

@app.route("/")
def index():
    db = get_db()
    cur = db.execute("SELECT rowid, * FROM tasks")
    tasks = cur.fetchall()
    return render_template("index.html", tasks=tasks)


@app.route("/complete-task", methods=["POST"])
def completeTask():
    data = request.get_json()
    task_id = data.get("id")
    complete = data.get("complete")

    db = get_db()
    db.execute(
        "UPDATE tasks SET complete = ? WHERE rowid = ?",
        (complete, task_id)
    )
    db.commit()

    return jsonify({"status": "ok"})
