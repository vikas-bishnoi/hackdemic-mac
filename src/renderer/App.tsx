import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

function Hello() {
  return <div className="h-screen bg-black"></div>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
