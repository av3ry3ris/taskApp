from flask import Flask, render_template
import sqlite3

con = sqlite3.connect("tasks.db")

cur = con.cursor()

results = cur.execute("SELECT * FROM tasks")

tasklist = results.fetchall()

app = Flask(__name__)

@app.route("/")
def home():
    print(tasklist)
    return render_template('home.html', tasklist = tasklist)