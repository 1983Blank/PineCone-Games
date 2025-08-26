import Layout from "./Layout.jsx";

import Game from "./Game";

import AdminCardGeneration from "./AdminCardGeneration";

import TicTacToe from "./TicTacToe";

import Leaderboard from "./Leaderboard";

import Home from "./Home";

import Multiplication from "./Multiplication";

import Fashion from "./Fashion";

import ConnectFour from "./ConnectFour";

import Coloring from "./Coloring";

import DrawingManager from "./DrawingManager";

import AdminPanel from "./AdminPanel";

import LiquidSort from "./LiquidSort";

import Tetris from "./Tetris";

import BrickBreaker from "./BrickBreaker";

import Nails from "./Nails";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Game: Game,
    
    AdminCardGeneration: AdminCardGeneration,
    
    TicTacToe: TicTacToe,
    
    Leaderboard: Leaderboard,
    
    Home: Home,
    
    Multiplication: Multiplication,
    
    Fashion: Fashion,
    
    ConnectFour: ConnectFour,
    
    Coloring: Coloring,
    
    DrawingManager: DrawingManager,
    
    AdminPanel: AdminPanel,
    
    LiquidSort: LiquidSort,
    
    Tetris: Tetris,
    
    BrickBreaker: BrickBreaker,
    
    Nails: Nails,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Game />} />
                
                
                <Route path="/Game" element={<Game />} />
                
                <Route path="/AdminCardGeneration" element={<AdminCardGeneration />} />
                
                <Route path="/TicTacToe" element={<TicTacToe />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Multiplication" element={<Multiplication />} />
                
                <Route path="/Fashion" element={<Fashion />} />
                
                <Route path="/ConnectFour" element={<ConnectFour />} />
                
                <Route path="/Coloring" element={<Coloring />} />
                
                <Route path="/DrawingManager" element={<DrawingManager />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/LiquidSort" element={<LiquidSort />} />
                
                <Route path="/Tetris" element={<Tetris />} />
                
                <Route path="/BrickBreaker" element={<BrickBreaker />} />
                
                <Route path="/Nails" element={<Nails />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}