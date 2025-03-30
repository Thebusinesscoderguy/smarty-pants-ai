
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaPaypal } from 'react-icons/fa';

const Pricing = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">EduAI</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold mb-10">Pricing</h2>
        
        <Card className="w-full max-w-md bg-black border border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">$16/month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-xl">Full access to all features</p>
            <ul className="space-y-2 text-lg">
              <li>• Adaptive Learning AI</li>
              <li>• Voice Messages</li>
              <li>• Unlimited Chats</li>
              <li>• Progress Tracking</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2">
              <FaPaypal />
              Subscribe Now
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-10">
          <Link to="/features">
            <Button variant="outline" className="border-white/30 hover:bg-white/10">
              Continue to App
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-white/70">
        © 2025 EduAI
      </footer>
    </div>
  );
};

export default Pricing;
