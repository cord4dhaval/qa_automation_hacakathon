import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TaskForm from "./pages/TaskForm";
import TaskList from "./pages/TaskList";
import ValidationResults from "./pages/ValidationResults";
import TaskDetail from "./pages/TaskDetail";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/new" element={<TaskForm />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
          <Route path="tasks/:taskId/edit" element={<TaskForm />} />
          <Route
            path="validation/:validationId"
            element={<ValidationResults />}
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
