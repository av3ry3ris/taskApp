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

            $(".addTask-btn").on("click", function() {
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