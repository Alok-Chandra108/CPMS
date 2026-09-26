import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Dropdown Component with rounded options
const CustomSelect = ({ value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none cursor-pointer hover:border-brand-blue/50 transition-all flex items-center justify-between"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-3 w-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-medium text-left transition-all ${
                  option.value === value
                    ? 'bg-brand-blue text-white'
                    : 'text-neutral-700 hover:bg-brand-blue/10 hover:text-brand-blue'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DatePicker = ({ value, onChange, name, error, placeholder = 'Select date', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to parse a date string (YYYY-MM-DD or full ISO) into a local Date object safely
  const parseDateLocal = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && val.length === 10 && val.includes('-')) {
      return new Date(val + 'T00:00:00'); // Force local midnight
    }
    return new Date(val);
  };

  const [selectedDate, setSelectedDate] = useState(parseDateLocal(value));
  const [tempMonth, setTempMonth] = useState(value ? parseDateLocal(value).getMonth() : new Date().getMonth());
  const [tempYear, setTempYear] = useState(value ? parseDateLocal(value).getFullYear() : new Date().getFullYear());
  const datePickerRef = useRef(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthOptions = months.map((month, idx) => ({ value: idx, label: month }));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 150 }, (_, i) => currentYear - i);
  const yearOptions = years.map(year => ({ value: year, label: String(year) }));

  // Get days in current month
  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(tempYear, tempMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Fill empty slots for days before the first day of the month
  const calendarDays = Array.from({ length: firstDayOfMonth }, () => null).concat(days);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      const newDate = parseDateLocal(value);
      setSelectedDate(newDate);
      setTempMonth(newDate.getMonth());
      setTempYear(newDate.getFullYear());
    }
  }, [value]);

  const handleDateClick = (day) => {
    const newDate = new Date(tempYear, tempMonth, day);
    setSelectedDate(newDate);
    const formattedDate = `${tempYear}-${String(tempMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange({ target: { name, value: formattedDate } });
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setTempMonth(today.getMonth());
    setTempYear(today.getFullYear());
    handleDateClick(today.getDate());
  };

  const handleClearClick = () => {
    setSelectedDate(null);
    onChange({ target: { name, value: '' } });
    setIsOpen(false);
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      tempMonth === today.getMonth() &&
      tempYear === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
      tempMonth === selectedDate.getMonth() &&
      tempYear === selectedDate.getFullYear();
  };

  return (
    <div ref={datePickerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-neutral-50 border rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between group hover:border-brand-blue/50 ${error ? 'border-red-300 bg-red-50' : isOpen ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-neutral-200'
          }`}
      >
        <span className={selectedDate ? 'text-neutral-800 font-medium' : 'text-neutral-400 text-sm'}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        {selectedDate && (
          <X
            onClick={(e) => {
              e.stopPropagation();
              handleClearClick();
            }}
            className="h-3.5 w-3.5 text-neutral-300 hover:text-red-400 transition-colors"
          />
        )}
        <div className="relative">
          <Calendar className={`h-4 w-4 transition-colors ${isOpen ? 'text-brand-blue' : 'text-neutral-400 group-hover:text-brand-blue'}`} />
          <div className={`absolute -right-1 -bottom-1 w-2 h-2 rounded-full transition-all ${isOpen ? 'bg-brand-blue' : 'bg-brand-blue/50 group-hover:bg-brand-blue/70'}`}></div>
        </div>
      </div>

      {error && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{error.message}</p>}

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 p-3 w-[300px] left-0"
            style={{ transformOrigin: 'top left' }}
          >
            {/* Month & Year Selectors - Custom Rounded Dropdowns */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <CustomSelect
                  value={tempMonth}
                  options={monthOptions}
                  onChange={setTempMonth}
                  placeholder="Month"
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  value={tempYear}
                  options={yearOptions}
                  onChange={setTempYear}
                  placeholder="Year"
                />
              </div>
            </div>

            {/* Day Headers - Minimal */}
            <div className="grid grid-cols-7 gap-0.5 mb-1.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-[9px] font-semibold text-neutral-400 py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Clean & Visible */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {calendarDays.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`w-full h-full flex items-center justify-center text-xs font-semibold rounded-lg transition-all duration-200 ${isSelected(day)
                          ? 'bg-brand-blue text-white shadow-md ring-2 ring-brand-blue/30'
                          : isToday(day)
                            ? 'text-brand-orange bg-brand-orange/10 ring-1 ring-brand-orange/50'
                            : 'text-neutral-700 hover:bg-brand-blue/10 hover:text-brand-blue'
                        }`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons - Premium */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleTodayClick}
                className="px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue-dark rounded transition-all duration-200 hover:shadow-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClearClick}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-red-500 rounded transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
