import sqlite3
from datetime import date, datetime, timedelta
from flask import Flask, render_template, request, jsonify, g, url_for
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "data", "tasks.db")



def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def row_to_task(row):
    """Convert a sqlite3.Row to a plain dict with effective date/time."""
    effective_date = row["scheduled_date"] or row["due_date"]
    effective_time = row["scheduled_time"] or row["time"]

    # Safely check if `position` exists
    try:
        position = row["position"]
    except KeyError:
        position = None

    return {
        "id": row["rowid"],
        "title": row["title"],
        "due_date": row["due_date"],
        "time": row["time"],
        "est_time": row["est_time"],
        "priority": row["priority"],
        "complete": bool(row["complete"]),
        "scheduled_date": row["scheduled_date"],
        "scheduled_time": row["scheduled_time"],
        "effective_date": effective_date,
        "effective_time": effective_time,
        "position": position
    }



@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------- HELPERS ----------

def get_effective_date(row: sqlite3.Row) -> str:
    """Use scheduled_date if set, else due_date."""
    return row["scheduled_date"] or row["due_date"]

def get_effective_time(row: sqlite3.Row) -> str:
    """Use scheduled_time if set, else time."""
    return row["scheduled_time"] or row["time"]


# ---------- MAIN LIST VIEW ----------

@app.route("/")
def index():
    db = get_db()
    # include scheduled_* in SELECT; order by position if you have it, else due/effective date
    cur = db.execute("""
        SELECT rowid, title, due_date, time, est_time, priority, complete,
               scheduled_date, scheduled_time,
               position
        FROM tasks
        ORDER BY position
    """)
    tasks = cur.fetchall()
    return render_template("index.html", tasks=tasks)


# ---------- COMPLETE / ADD / DELETE / EDIT ----------

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
    time_ = data.get("time")
    time_est = data.get("time_est")
    priority = data.get("priority")

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO tasks (title, due_date, time, est_time, priority, complete,
                           scheduled_date, scheduled_time, position)
        VALUES (?, ?, ?, ?, ?, 0, NULL, NULL,
                (SELECT IFNULL(MAX(position), -1) + 1 FROM tasks))
        """,
        (title, due_date, time_ or "", time_est or "", priority)
    )
    db.commit()

    new_id = cur.lastrowid
    # send back enough data to append in UI
    return jsonify({
        "status": "ok",
        "task": {
            "taskID": new_id,
            "title": title,
            "due_date": due_date,
            "time": time_,
            "time_est": time_est,
            "priority": priority
        }
    })


@app.route("/delete-task", methods=["POST"])
def deleteTask():
    data = request.get_json()
    task_id = data.get("id")

    db = get_db()
    db.execute(
        "DELETE FROM tasks WHERE rowid = ?",
        (task_id,)
    )
    db.commit()

    return jsonify({"status": "ok"})


@app.route("/edit-task", methods=["POST"])
def editTask():
    data = request.get_json()
    task_id = data.get("id")
    title = data.get("title")
    due_date = data.get("due_date")
    time_ = data.get("time")
    est_time = data.get("est_time")
    priority = data.get("priority")

    db = get_db()
    db.execute(
        """
        UPDATE tasks
        SET title = ?, due_date = ?, time = ?, est_time = ?, priority = ?
        WHERE rowid = ?
        """,
        (title, due_date, time_, est_time, priority, task_id)
    )
    db.commit()

    return jsonify({"status": "ok"})


@app.route("/reorder-tasks", methods=["POST"])
def reorder_tasks():
    data = request.get_json()
    order_list = data.get("order", [])

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



@app.route("/schedule-task", methods=["POST"])
def schedule_task():
    """
    Update scheduled_date / scheduled_time for a task.
    Month view might only send date; week view sends both.
    """
    data = request.get_json()
    task_id = data["id"]
    scheduled_date = data.get("scheduled_date")
    scheduled_time = data.get("scheduled_time")

    db = get_db()

    if scheduled_time is None:
        # update date only, leave time as-is
        db.execute(
            "UPDATE tasks SET scheduled_date = ? WHERE rowid = ?",
            (scheduled_date, task_id)
        )
    else:
        db.execute(
            "UPDATE tasks SET scheduled_date = ?, scheduled_time = ? WHERE rowid = ?",
            (scheduled_date, scheduled_time, task_id)
        )

    db.commit()
    return jsonify({"status": "ok"})



@app.route("/today")
def today_view():
    db = get_db()

    requested_date = request.args.get("date")
    if requested_date is None:
        requested_date = date.today().isoformat()  # "YYYY-MM-DD"

    cur = db.execute("""
        SELECT rowid, title, due_date, time, est_time, priority, complete,
               scheduled_date, scheduled_time
        FROM tasks
    """)
    rows = cur.fetchall()

    tasks_by_hour = {h: [] for h in range(24)}

    for t in rows:
        eff_date = get_effective_date(t)
        if eff_date != requested_date:
            continue
        eff_time = get_effective_time(t) or ""
        hour = int(eff_time.split(":")[0]) if ":" in eff_time else None
        if hour is not None and 0 <= hour < 24:
            tasks_by_hour[hour].append(t)

    return render_template(
        "today.html",
        tasks_by_hour=tasks_by_hour,
        selected_date=requested_date
    )


@app.route("/week")
def week_view():
    db = get_db()

    start_param = request.args.get("start")
    if start_param:
        start_date = datetime.strptime(start_param, "%Y-%m-%d").date()
    else:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())  # Monday

    days = [start_date + timedelta(days=i) for i in range(7)]
    end_date = days[-1]

    # load all and filter by effective_date
    cur = db.execute("""
        SELECT rowid, title, due_date, time, est_time, priority, complete,
               scheduled_date, scheduled_time
        FROM tasks
    """)
    rows = cur.fetchall()

    tasks_by_day_hour = {}
    for d in days:
        d_str = d.isoformat()
        tasks_by_day_hour[d_str] = {h: [] for h in range(24)}

    for t in rows:
        eff_date = get_effective_date(t)
        if eff_date is None:
            continue
        if eff_date < start_date.isoformat() or eff_date > end_date.isoformat():
            continue

        eff_time = get_effective_time(t) or ""
        if ":" in eff_time:
            hour = int(eff_time.split(":")[0])
        else:
            hour = None

        if hour is not None and 0 <= hour < 24:
            tasks_by_day_hour[eff_date][hour].append(t)

    prev_start = start_date - timedelta(days=7)
    next_start = start_date + timedelta(days=7)

    return render_template(
        "week.html",
        days=days,
        tasks_by_day_hour=tasks_by_day_hour,
        start_date=start_date,
        prev_start=prev_start,
        next_start=next_start
    )


# ---------- MONTH VIEW (uses effective date, ignore time) ----------

@app.route("/month")
def month_view():
    import calendar
    db = get_db()

    today = date.today()
    year = request.args.get("year", type=int) or today.year
    month = request.args.get("month", type=int) or today.month

    first_of_month = date(year, month, 1)
    _, days_in_month = calendar.monthrange(year, month)
    last_of_month = date(year, month, days_in_month)

    first_weekday = first_of_month.weekday()  # Monday=0
    grid_start = first_of_month - timedelta(days=first_weekday)

    last_weekday = last_of_month.weekday()
    days_to_add = 6 - last_weekday
    grid_end = last_of_month + timedelta(days=days_to_add)

    cur = db.execute("""
        SELECT rowid, title, due_date, time, est_time, priority, complete,
               scheduled_date, scheduled_time
        FROM tasks
    """)
    rows = cur.fetchall()

    tasks_by_date = {}
    current = grid_start
    while current <= grid_end:
        d_str = current.isoformat()
        tasks_by_date[d_str] = []
        current += timedelta(days=1)

    for t in rows:
        eff_date = get_effective_date(t)
        if eff_date in tasks_by_date:
            tasks_by_date[eff_date].append(t)

    weeks = []
    current = grid_start
    while current <= grid_end:
        week = []
        for _ in range(7):
            d_str = current.isoformat()
            week.append({
                "date": current,
                "date_str": d_str,
                "is_current_month": current.month == month,
                "is_today": current == today,
                "tasks": tasks_by_date.get(d_str, []),
            })
            current += timedelta(days=1)
        weeks.append(week)

    prev_month = month - 1 or 12
    prev_year = year - 1 if month == 1 else year
    next_month = month + 1 if month < 12 else 1
    next_year = year + 1 if month == 12 else year

    return render_template(
        "month.html",
        weeks=weeks,
        year=year,
        month=month,
        month_name=calendar.month_name[month],
        prev_year=prev_year,
        prev_month=prev_month,
        next_year=next_year,
        next_month=next_month,
    )

@app.route("/api/tasks", methods=["GET"])
def api_list_tasks():
    """
    JSON endpoint for listing tasks.
    Optional query params:
      - completed=0/1
      - date=YYYY-MM-DD (matches effective_date)
    """
    db = get_db()
    cur = db.execute("""
        SELECT rowid, *
        FROM tasks
    """)
    rows = cur.fetchall()

    tasks = [row_to_task(r) for r in rows]

    # optional filters for the assistant
    completed = request.args.get("completed")
    if completed is not None:
        completed_val = 1 if completed == "1" else 0
        tasks = [t for t in tasks if int(t["complete"]) == completed_val]

    date_filter = request.args.get("date")
    if date_filter:
        tasks = [t for t in tasks if t["effective_date"] == date_filter]

    return jsonify({"tasks": tasks})

@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def api_update_task(task_id):
    """
    JSON endpoint for updating a task.
    Body can include any of:
      title, due_date, time, est_time, priority,
      complete, scheduled_date, scheduled_time
    Only supplied fields are updated.
    """
    data = request.get_json(force=True) or {}

    fields = []
    values = []

    # whitelist fields allowed to be updated
    allowed = ["title", "due_date", "time", "est_time",
               "priority", "complete", "scheduled_date", "scheduled_time"]

    for key in allowed:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])

    if not fields:
        return jsonify({"error": "No valid fields to update"}), 400

    values.append(task_id)

    db = get_db()
    db.execute(
        f"UPDATE tasks SET {', '.join(fields)} WHERE rowid = ?",
        tuple(values)
    )
    db.commit()

    # return updated task
    cur = db.execute("SELECT rowid, * FROM tasks WHERE rowid = ?", (task_id,))
    row = cur.fetchone()
    if row is None:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"task": row_to_task(row)})

@app.route("/api/tasks", methods=["POST"])
def api_create_task():
    data = request.get_json(force=True) or {}

    title = data.get("title") or data.get("title")
    due_date = data.get("due_date")
    time_ = data.get("time") or ""
    est_time = data.get("est_time") or ""
    priority = data.get("priority") or "Medium"

    if not title:
        return jsonify({"error": "title is required"}), 400

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO tasks (title, due_date, time, est_time, priority, complete,
                           scheduled_date, scheduled_time, position)
        VALUES (?, ?, ?, ?, ?, 0, NULL, NULL,
                (SELECT IFNULL(MAX(position), -1) + 1 FROM tasks))
        """,
        (title, due_date, time_, est_time, priority)
    )
    db.commit()

    new_id = cur.lastrowid
    cur = db.execute("SELECT rowid, * FROM tasks WHERE rowid = ?", (new_id,))
    row = cur.fetchone()

    return jsonify({"task": row_to_task(row)}), 201


