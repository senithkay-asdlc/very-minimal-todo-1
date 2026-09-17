screen MyTodos "A user's private list of open and done todos"
  navbar "Todo"
  heading "My Todos"
  row
    button "New Todo" primary -> NewTodo
    right
    select "Filter: All | Open | Done"
  list "Buy milk | Open" -> TodoDetail
  list "Write report | Done"
  list "Call dentist | Open" -> TodoDetail

screen NewTodo "Capture a new todo"
  navbar "Todo"
  heading "New Todo"
  textarea "What do you need to do?"
  row
    right
    button "Cancel" -> MyTodos
    button "Create" primary -> MyTodos

screen TodoDetail "A single open todo, with the option to mark it done"
  navbar "Todo"
  heading "Todo"
  text "Buy milk"
  badge "Open" warning
  row
    right
    button "Mark as Done" primary -> MyTodos

flow "Manage my todos"
  role "User"
  description "A signed-in user creates todos and marks them done"
  MyTodos
  NewTodo
  TodoDetail
