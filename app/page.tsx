import Header from './components/Header';
import TypingTest from './components/TypingTest';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-8 px-4 flex flex-col items-center justify-center">
        <h1 className="sr-only">MonkeyType - Typing Test</h1>
        <TypingTest />
      </main>
      
      <Footer />
    </div>
  )
}
