import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import Contact from './pages/contact'
import About from './pages/about'
import Navbar from './component/navbar'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={
          <>
          <About/> <Navbar/></>
        } />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>

  );
}

export default App
