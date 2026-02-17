import { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import CheckInForm from './components/CheckInForm';
import CheckInList from './components/CheckInList';
import LinearChart from './components/LinearChart';
import InsightEngine from './components/InsightEngine';
import { getEntries, getHeader, saveHeader } from './utils/storage';

function App() {
  const [entries, setEntries] = useState([]);
  const [headerData, setHeaderData] = useState(getHeader());
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState(headerData.title);
  const [editSubtitle, setEditSubtitle] = useState(headerData.subtitle);

  useEffect(() => {
    loadEntries();
    const savedHeader = getHeader();
    setHeaderData(savedHeader);
    setEditTitle(savedHeader.title);
    setEditSubtitle(savedHeader.subtitle);
  }, []);

  const loadEntries = () => {
    const data = getEntries();
    setEntries(data);
  };

  const handleSave = () => {
    loadEntries();
  };

  const handleSaveHeader = () => {
    saveHeader(editTitle, editSubtitle);
    setHeaderData({ title: editTitle, subtitle: editSubtitle });
    setIsEditingHeader(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(headerData.title);
    setEditSubtitle(headerData.subtitle);
    setIsEditingHeader(false);
  };

  return (
    <div className="h-screen overflow-y-auto lg:overflow-hidden flex flex-col">
      {/* Header */}
      <header className="glass-card m-2 sm:m-4 mb-2 sm:mb-4 p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-center justify-center">
          <div className="w-full">
            {isEditingHeader ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-green-600/50 focus:outline-none focus:border-green-600 text-center text-white w-full sm:w-auto"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="text-sm sm:text-base text-gray-300 bg-transparent border-b-2 border-green-600/30 focus:outline-none focus:border-green-600/50 w-full sm:w-64 text-center text-white"
                  placeholder="Subtitle"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveHeader}
                    className="p-2 text-green-600 hover:text-green-500 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative flex flex-col items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-center shiny-gradient-title" data-text={headerData.title}>
                  {headerData.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 text-center">{headerData.subtitle}</p>
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-green-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Grid Layout */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden px-2 sm:px-4 pb-4">
        <div className="min-h-full lg:h-full flex flex-col lg:grid lg:grid-cols-12 gap-4">
          {/* Lewa kolumna - Formularz Check-in i lista */}
          <div className="w-full lg:col-span-4 lg:overflow-y-auto space-y-4">
            <CheckInForm onSave={handleSave} />
            <CheckInList entries={entries} onDelete={handleSave} />
          </div>

          {/* Środkowa kolumna - Wykres */}
          <div className="w-full lg:col-span-5 lg:overflow-y-auto space-y-4">
            <LinearChart entries={entries} onDelete={handleSave} />
          </div>

          {/* Prawa kolumna - Wnioski */}
          <div className="w-full lg:col-span-3 lg:overflow-y-auto">
            <div className="lg:sticky lg:top-0">
              <InsightEngine entries={entries} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
