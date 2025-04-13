import Header from './components/Header';
import TypingTest from './components/TypingTest';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4 flex flex-col items-center justify-center">
        <h1 className="sr-only">MonkeyType - Typing Test</h1>
        <TypingTest />
      </main>
      
      <Footer />
    </div>
  );
}
