const express = require('express')
const path = require('path')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
var isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let database;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const hasPriorityAndStatusProperties = (requestQuery) => {
  return {
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  };
};
const hasPriorityProperty = (requestQuery) => {
  return {
    requestQuery.priority !== undefined;
  };
};
const hasStatusProperty = (requestQuery) => {
  return {
    requestQuery.status !== undefined;
  };
};
const hasCatogeryAndStatus = (requestQuery) => {
  return {
    requestQuery.category !== undefined && requestQuery.status !== undefined
  };
};
const hasCatogeryAndPriority = (requestQuery) => {
  return {
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  };
};
const hasSearchProperty = (requestQuery) => {
  return {
    requestQuery.search_q !== undefined
  };
};
const hasCatogeryProperty = (requestQuery) => {
  return {
    requestQuery.category !== undefined
  };
};
const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
          SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break ;
    case hasCatogeryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LAERNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
          SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
      }
      break;

      case hasCatogeryAndPriority(request.query):
        if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LAERNING"
      ) {
        if (
          priority === "HIGH" || 
          priority === "MEDIUM" || 
          priority === "LOW"
        ) {
          getTodosQuery = `
          SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
      }
      break;

      case hasPriorityProperty(request.query):
        if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
          getTodosQuery = `
          SELECT * FROM todo WHERE priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      break;
      
      case hasStatusProperty(request.query):
        if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
          getTodosQuery = `
          SELECT * FROM todo WHERE status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      break;

      case hasSearchProperty(request.query):
        getTodosQuery = `
        SELECT * FROM todo WHERE todo like '%${search_q}%';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      break;

      case hasCatogeryProperty(request.query):
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LAERNING"
        ) {
          getTodosQuery = `
          SELECT * FROM todo WHERE category '${category}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      break;

      default:
        getTodosQuery = `
        SELECT * FROM todo;`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));

    };
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `select * from todo where id = ${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  response.send(outputResult(responseResult));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `select * from todo where due_date = '${newDate}';`;
    const responseResult = await database.all(requestQuery);
    response.send(responseResult.map((eachItem) => outputResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date")
  };
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (category === "WORK" ||
          category === "HOME" ||
          category === "LAERNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const PostNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const PostToDoQuery = `
          INSERT INTO todo (id, todo, priority, status, category, dueDate)
          VALUES
          (${id}, '${todo}', '${category}', '${priority}', '${status}', '${PostNewDueDate}');`;
          await database.run(PostToDoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date")
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    }
    else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
});
app.put("/todos/:todoId/", async(request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previoueTodo.todo,
    priority= previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if(status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `Update todo SET 
        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id= ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Status Updated")
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if(priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `Update todo SET 
        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id= ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Priority Updated")
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
        updateTodoQuery = `Update todo SET 
        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id= ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Todo Updated")
      break;

    case requestBody.category !== undefined:
      if(category === "WORK" || category === "HOME" || category === "LAERNING") {
        updateTodoQuery = `Update todo SET 
        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id= ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Category Updated")
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `Update todo SET 
        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id= ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Due Date Updated")
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }

});
app.delete("/todos/:todoId/", async(request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;

