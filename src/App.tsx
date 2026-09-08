function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4">GreenITESO</h1>
        <p className="text-gray-600 text-lg mb-8">Frontend ready to go</p>
        <div className="flex gap-4 justify-center">
          <div className="p-4 bg-white rounded-lg shadow">
            <span className="font-mono text-sm">React 18</span>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <span className="font-mono text-sm">TypeScript</span>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <span className="font-mono text-sm">Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
