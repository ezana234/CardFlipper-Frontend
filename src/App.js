import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import Login from '../src/containers/Login'
import Dashboard from '../src/containers/Dashboard'
import Game from '../src/containers/Game'
import useToken from "./components/useToken";
import Header from "./containers/Header"

// Runs the app
function App() {
  // Retrieve token
  const { token, setToken } = useToken();
  // if token doesn't exist, then route to Login page and Login
  if (!token) {
    return <Login setToken={setToken} />
  }
  // Routes
  return (
    <Router>
      <div>
        <Header />
        <Routes>
          <Route exact path="/" element={<Dashboard token={token}/>}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/game" element={<Game />}></Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
