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

});


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

