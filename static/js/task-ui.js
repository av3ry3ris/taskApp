$(document).ready(function () {
    $(".incomplete").sortable({
        animation: 150,
        handle: ".drag-handle",

        onEnd: function (evt) {
            var order = getTaskOrder();
            console.log("Drag finished! New order: ", order);
            $.ajax({
                url: "/reorder-tasks",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ order: order }),
                success: function (response) {
                    console.log("Reorder saved:", response);
                },
                error: function (xhr) {
                    console.error("Error saving order:", xhr.responseText);
                }
            });
        }
    });

    $(document).on("change", ".complete-checkbox", function () {
        const checkbox = this;
        const $checkbox = $(checkbox);
        const taskId = $checkbox.data("id");
        const $task = $checkbox.closest(".task");
        const $completedArea = $(".completed");   
        const $incompleteArea = $(".incomplete");  
        const header = $('.section-header'); 
        console.log("Change fired, checked?", $checkbox.is(":checked"));
        console.log("Task parent:", $task.parent().attr("class"));

        $.ajax({
            url: "/complete-task",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                id: taskId,
                complete: $checkbox.is(":checked") ? 1 : 0
            }),
            success: function (response) {
                console.log("Updated:", response);

                
                const isComplete = $checkbox.is(":checked");

                if (isComplete) {
                    
                    $task.addClass("done");
                    $task.insertAfter(header);
                } else {
                    
                    $task.removeClass("done");
                    $task.prependTo($incompleteArea);
                }

                console.log("New parent:", $task.parent().attr("class"));
            },
            error: function (xhr) {
                console.error("Error updating task:", xhr.responseText);
            }
        });
    });




});

$(document).on("click", '.addTask-btn', function (e) {
    e.preventDefault();
    const task_title = $('#title').val();
    const date = $('#due_date').val();
    const task_time = $('#time').val();
    const est_time = $('#time_est').val();
    const pri = $('#priority').val();

    $.ajax({
        url: "/add-task",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            title: task_title,
            due_date: date,
            time: task_time,
            time_est: est_time,
            priority: pri,
            complete: 0
        }),
        success: function (response) {
            console.log("Added:", response);
            appendTask(response);
        },
        error: function (xhr) {
            console.error("Error adding task:", xhr.responseText);
        }
    });
});



$(document).on("click", ".promptDelete", function () {

    var task = $(this).closest('.task');

    var content = task.find('.task-content');
    var checkbox = task.find('.complete-checkbox');

    var buttons = task.find('.btns-box');

    task.data("oldTitle", task.find(".title").text());
    task.data("oldDate", task.find(".due_date").text());
    task.data("oldTime", task.find(".time").text());
    task.data("oldEst", task.find(".est_time").text());
    task.data("oldPri", task.find(".priority").text());

    var promptHtml = `<div class="delete-prompt">
                                    <h2>Delete?</h2>
                                    <div class="button-group"><button class="button btn-cancel delete-task">Delete</button><button class="button cancel-edit">Cancel</button></div>
                                  </div>`

    content.html(promptHtml);
    buttons.addClass('hidden');
    checkbox.addClass('hidden');

});

$(document).on("click", '.delete-task', function () {

    const parentTask = $(this).closest('.task');
    const taskId = parentTask.data("id");

    console.log(parentTask);
    $.ajax({
        url: "/delete-task",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            id: taskId
        }),
        success: function (response) {
            console.log("Deleted:", response);
            parentTask.remove();
        },
        error: function (xhr) {
            console.error("Error deleting task:", xhr.responseText);
        }
    });
});

$(".task").on("click", ".edit-task", function () {
    $(this).addClass('hidden');
    var parent = $(this).parents('.task').children('.task-content');

    var title = parent.find(".title");
    var due_date = parent.find(".due_date");
    var time = parent.find(".time");
    var est_time = parent.find(".est_time");
    var priority = parent.find(".priority");

    var title_text = parent.find(".title").text();
    var due_date_text = parent.find(".due_date").text();
    var time_text = parent.find(".time").text();
    var est_time_text = parent.find(".est_time").text();
    var priority_text = parent.find(".priority").text();

    task = $(this).closest('.task');
    task.data("oldTitle", task.find(".title").text());
    task.data("oldDate", task.find(".due_date").text());
    task.data("oldTime", task.find(".time").text());
    task.data("oldEst", task.find(".est_time").text());
    task.data("oldPri", task.find(".priority").text());


    // console.log(title_text, due_date_text, time_text, est_time_text, priority_text);

    title.replaceWith('<input class="title">');
    due_date.replaceWith('<input class="due_date" type="date">');
    time.replaceWith('<input class="time" type="time">');
    est_time.replaceWith('<input class="est_time">');
    priority.replaceWith(`<select name="priority" class="priority">
                                            <option value="Highest">Highest</option>
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                            <option value="Lowest">Lowest</option>
                                    </select>`);

    title = parent.find(".title");
    due_date = parent.find(".due_date");
    time = parent.find(".time");
    est_time = parent.find(".est_time");
    priority = parent.find(".priority");

    title.val(title_text);
    due_date.val(due_date_text);
    time.val(time_text);
    est_time.val(est_time_text);
    priority.val(priority_text);

    parent.append('<div class="button-group"><button class="button btn-primary submit-edit">Submit</button><button class="button btn-cancel cancel-edit">Cancel</button></div>');



});

$(document).on("click", ".cancel-edit", function () {
    console.log('Cancel!');

    var task = $(this).closest('.task');

    var buttons = task.find('.btns-box');
    var checkbox = task.find('.complete-checkbox');

    const parent = $(this).closest('.task-content');
    const taskId = $(this).parents('.task').data("id");



    const oldTitle = task.data("oldTitle");
    const oldDate = task.data("oldDate");
    const oldTime = task.data("oldTime");
    const oldEst = task.data("oldEst");
    const oldPri = task.data("oldPri");

    var oldContent = `<div class="task-content">
                                            <i>Task ID: <span>${taskId}</span></i>
                                            <h2 class="title">${oldTitle}</h2>
                                            <p>Due: <span class="due_date">${oldDate}</span> <span class="time">${oldTime}</span></p>
                                            <p>Est. task time: <span class="est_time">${oldEst}</span></p>
                                            <p>Priority: <span class="priority">${oldPri}</span></p>
                                        </div>`;


    var editBtn = $(this).closest('.task').find('.edit-task');
    console.log(editBtn);
    editBtn.removeClass('hidden');
    parent.replaceWith(oldContent);

    buttons.removeClass('hidden');
    checkbox.removeClass('hidden');
});

$(".task").on("click", ".submit-edit", function () {
    const parent = $(this).closest('.task-content');
    const taskId = $(this).parents('.task').data("id");
    var title = parent.find(".title");
    var due_date = parent.find(".due_date");
    var time = parent.find(".time");
    var est_time = parent.find(".est_time");
    var priority = parent.find(".priority");

    submitTaskEdit(taskId, title, due_date, time, est_time, priority);

    var new_title = parent.find(".title").val();
    var new_due_date = parent.find(".due_date").val();
    var new_time = parent.find(".time").val();
    var new_est_time = parent.find(".est_time").val();
    var new_priority = parent.find(".priority").val();

    console.log(new_priority);

    var newContent = `<div class="task-content">
                                    <i>Task ID: <span>${taskId}</span></i>
                                    <h2 class="title">${new_title}</h2>
                                    <p>Due: <span class="due_date">${new_due_date}</span> <span class="time">${new_time}</span></p>
                                    <p>Est. task time: <span class="est_time">${new_est_time}</span></p>
                                    <p>Priority: <span class="priority">${new_priority}</span></p>
                                </div>`;

    parent.replaceWith(newContent);
});

$("#sort-by, #sort-dir").on("change", function () {
    applySortAndSave();
});


function submitTaskEdit(taskId, title, due_date, time, est_time, priority) {

    var new_title = title.val();
    var new_due_date = due_date.val();
    var new_time = time.val();
    var new_est_time = est_time.val();
    var new_pri = priority.val();

    $.ajax({
        url: "/edit-task",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            id: taskId,
            title: new_title,
            due_date: new_due_date,
            time: new_time,
            est_time: new_est_time,
            priority: new_pri
        }),
        success: function (response) {
            console.log(`Updated ${taskId}: `, response);
        },
        error: function (xhr) {
            console.error(`Error updating ${taskId}: `, xhr.responseText);
        }
    });


}

function appendTask(response) {
    const taskID = response.task.taskID;
    const title = response.task.title;
    const due_date = response.task.due_date;
    const time = response.task.time;
    const est_time = response.task.time_est;
    const pri = response.task.priority;

    const newTaskHtml = `<div class="task drag-handle" data-id="${taskID}">
                                        <input class="complete-checkbox" type="checkbox" data-id="${taskID}"></input>
                                        <div class="task-content">
                                            <i>Task ID: ${taskID}</i>
                                            <h2>${title}</h2>
                                            <p>Due: ${due_date} ${time}</p>
                                            <p>Est. task time: ${est_time}</p>
                                            <p>Priority: ${pri}</p>
                                        </div>
                                        <div class="btns-box">
                                            <i class="edit-task fa-solid fa-pencil" data-id="${taskID}"></i>
                                            <i class="promptDelete fa-solid fa-trash" data-id="${taskID}"></i>
                                        </div>
                                    </div>`;

    $(".incomplete").append(newTaskHtml);
}

function sortTasksInBrowser() {
    const sortBy = $("#sort-by").val();
    const sortDir = $("#sort-dir").val();

    const $tasks = $(".incomplete .task").toArray();

    if (sortBy === "manual") {
        return $tasks;
    }

    $tasks.sort(function (a, b) {
        const $a = $(a);
        const $b = $(b);

        let aVal, bVal;

        if (sortBy === "due_date") {
            aVal = $a.find(".due_date").text() || "";
            bVal = $b.find(".due_date").text() || "";
        } else if (sortBy === "est_time") {
            aVal = parseFloat($a.find(".est_time").text()) || 0;
            bVal = parseFloat($b.find(".est_time").text()) || 0;
        } else if (sortBy === "priority") {
            const P = { Highest: 5, High: 4, Medium: 3, Low: 2, Lowest: 1 };
            aVal = P[$a.find(".priority").text().trim()] || 0;
            bVal = P[$b.find(".priority").text().trim()] || 0;
        }

        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
    });

    if (sortDir === "desc") $tasks.reverse();

    return $tasks;
}

function computeNewPositions(tasksArray) {
    return tasksArray.map((el, index) => ({
        id: $(el).data("id"),
        position: index
    }));
}

function getTaskOrder() {
        const order = [];
        document.querySelectorAll('.task').forEach((task, index) => {
            order.push({
                id: task.dataset.id,
                position: index
            });
        });
        return order;
    }

function saveTaskOrder(newOrder) {
    $.ajax({
        url: "/reorder-tasks",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ order: newOrder }),
        success: function (response) {
            console.log("Saved:", response);
        },
        error: function (xhr) {
            console.error("Error:", xhr.responseText);
        }
    });
}

function applySortAndSave() {
    const sorted = sortTasksInBrowser();
    const newOrder = computeNewPositions(sorted);

    saveTaskOrder(newOrder);

    $(".incomplete").append(sorted);
}