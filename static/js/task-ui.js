$(document).ready(function() {
            $(".complete-checkbox").on("change", function() {
                const taskId = $(this).data("id");
                const complete = $(this).is(":checked") ? 1 : 0;
                
                
                if($(this).is(":checked")) 
                {
                    $(this).siblings(".task-content").addClass('done');
                } else {   
                    $(this).siblings(".task-content").removeClass('done');
                } 

                $.ajax({
                    url: "/complete-task",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                        id: taskId,
                        complete: complete
                    }),
                    success: function(response) {
                        console.log("Updated:", response);
                    },
                    error: function(xhr) {
                        console.error("Error updating task:", xhr.responseText);
                    }
                });
            });

            
});

        $(".addTask-btn").on("click", function(e) {
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
                    success: function(response) {
                        console.log("Added:", response);
                        appendTask(response);
                    },
                    error: function(xhr) {
                        console.error("Error adding task:", xhr.responseText);
                    }
                });
            });

            $(".delete-task").on("click", function() {
                const taskId = $(this).data("id");
                $.ajax({
                    url: "/delete-task",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                        id: taskId
                    }),
                    success: function(response) {
                        console.log("Deleted:", response);
                    },
                    error: function(xhr) {
                        console.error("Error deleting task:", xhr.responseText);
                    }
                });
            });

            $(".edit-task").on("click", function() {
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
            
            $(".task-content").on("click", ".submit-edit", function() {
                const parent = $(this).closest('.task-content');
                const taskId = $(this).parents('.task').data("id");
                var title = parent.find(".title");
                var due_date = parent.find(".due_date");
                var time = parent.find(".time");
                var est_time = parent.find(".est_time");
                var priority = parent.find(".priority");
                console.log("Inside Click event: " + taskId);
                submitTaskEdit(taskId, title, due_date, time, est_time, priority);
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
                    success: function(response) {
                        console.log(`Updated ${taskId}: `, response);
                    },
                    error: function(xhr) {
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

                const newTaskHtml = `<div class="task">
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
                                            <i class="delete-task fa-solid fa-trash" data-id="${taskID}"></i>
                                        </div>
                                    </div>`;

                $(".task-container").append(newTaskHtml);
}

