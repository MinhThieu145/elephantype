export default function Footer() {
  return (
    <footer className="w-full py-4 text-center text-sm opacity-70 mt-16">
      <div className="flex justify-center gap-4">
        <span>monkeytype clone</span>
        <span>•</span>
        <a 
          href="https://github.com/MinhThieu145/monkeytype" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
        >
          github
        </a>
      </div>
    </footer>
  );
} 