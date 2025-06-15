
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="w-full px-4 md:px-6 py-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <p className="text-white/60 text-sm">© 2025 Teachly. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/how-it-works" className="text-white/60 hover:text-white text-sm">How it Works</Link>
          <a href="#" className="text-white/60 hover:text-white text-sm">Terms</a>
          <a href="#" className="text-white/60 hover:text-white text-sm">Privacy</a>
          <Link to="/pricing" className="text-white/60 hover:text-white text-sm">Pricing</Link>
        </div>
      </div>
    </footer>
  );
};
