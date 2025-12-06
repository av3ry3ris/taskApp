import sqlite3
from flask import Flask, render_template, request, jsonify, g
from datetime import date

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
    cur = db.execute("SELECT rowid, * FROM tasks ORDER BY position")
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

@app.route("/add-task", methods=["POST"])
def addTask():
    data = request.get_json()
    title = data.get("title")
    due_date = data.get("due_date")
    time = data.get("time")
    time_est = data.get("time_est")
    priority = data.get("priority")
    
    db = get_db()
    cursor = db.execute(
    "INSERT INTO tasks (title, due_date, time, est_time, priority, complete) VALUES (?, ?, ?, ?, ?, 0)",
    (title, due_date, time, time_est, priority)
    
)
    new_id = cursor.lastrowid

    db.commit()

    return jsonify({"status": "ok",
                        "task": {
                            "taskID": new_id,
                            "title": title,
                            "due_date": due_date,
                            "time": time,
                            "time_est": time_est,
                            "priority": priority,
                            "complete": 0
                        }
                    })

@app.route("/delete-task", methods=["POST"])
def deleteTask():
    data = request.get_json()
    task_id = data.get("id")
    db = get_db()
    db.execute(
        "DELETE FROM tasks WHERE rowid = ?",
        (int(task_id),)
    )
    db.commit()
    return jsonify({"status": "ok"})

@app.route("/edit-task", methods=["POST"])
def editTask():
    data = request.get_json()
    task_id = data.get("id")
    title = data.get("title")
    due_date = data.get("due_date")
    time = data.get("time")
    time_est = data.get("est_time")
    priority = data.get("priority")
    
    db = get_db()
    db.execute(
        "UPDATE tasks SET title = ?, due_date = ?, time = ?, est_time = ?, priority = ? WHERE rowid = ?",
        (title, due_date, time, time_est, priority, int(task_id))
    )
    db.commit()

    return jsonify({"status": "ok"})

@app.route("/reorder-tasks", methods=["POST"])
def reorder_tasks():
    data = request.get_json()
    order_list = data.get("order", [])
    print(f'Order list: {order_list}')
    db = get_db()
    for item in order_list:
        task_id = item["id"]
        position = item["position"]
        db.execute(
            "UPDATE tasks SET position = ? WHERE rowid = ?",
            (position, task_id)
        )
    db.commit()

    return jsonify({"status": "ok"})


@app.route("/today")
def today_view():
    db = get_db()

    requested_date = request.args.get("date")
    if requested_date is None:
        requested_date = date.today().isoformat()  

    
    cur = db.execute(
        "SELECT rowid, * FROM tasks WHERE due_date = ? ORDER BY time",
        (requested_date,)
    )
    tasks = cur.fetchall()

    # bucket tasks by hour for the schedule layout
    tasks_by_hour = {h: [] for h in range(24)}
    for t in tasks:
        t_time = t["time"] or ""           
        hour = int(t_time.split(":")[0]) if ":" in t_time else None
        if hour is not None and hour in tasks_by_hour:
            tasks_by_hour[hour].append(t)

    return render_template(
        "today.html",
        tasks_by_hour=tasks_by_hour,
        selected_date=requested_date,
    )


