import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center px-8 py-6 bg-transparent">
      <ThemeToggle />
    </nav>
  );
}
