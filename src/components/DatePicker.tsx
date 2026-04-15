import { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
  parse,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
} from "lucide-react";
interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  compact?: boolean;
  align?: "left" | "right";
  icon?: React.ReactNode;
}
export default function DatePicker({
  value,
  onChange,
  label,
  className = "",
  size = "md",
  compact = false,
  align = "left",
  icon,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value + "T12:00:00") : new Date(),
  );
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null); // Sync internal input text with prop value
  useEffect(() => {
    if (value) {
      const date = new Date(value + "T12:00:00");
      if (isValid(date)) {
        setInputValue(format(date, "dd/MM/yyyy"));
        setCurrentMonth(date);
      }
    } else {
      setInputValue("");
    }
  }, [value]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleDateClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val); // Simple validation for DD/MM/YYYY
    if (val.length === 10) {
      const parsed = parse(val, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
        setCurrentMonth(parsed);
      }
    }
  };
  const days = [];
  const startMonth = startOfMonth(currentMonth);
  const endMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(startMonth);
  const endDate = endOfWeek(endMonth);
  const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["do", "lu", "ma", "mi", "ju", "vi", "sa"];
  const selectedDate = value ? new Date(value + "T12:00:00") : null;
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {" "}
      {label && (
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1.5 flex items-center gap-2 mb-2">
          {icon} {label}
        </label>
      )}
      {" "}
      <div
        className={`w-full transition-all flex items-center justify-center cursor-pointer
          ${compact
            ? `px-2 py-1.5 rounded-xl ${isOpen ? "bg-white shadow-sm" : "hover:bg-white/80"}`
            : `border-gray-200 border rounded-2xl ${size === "sm" ? "px-3 py-1.5" : "px-5 py-3.5"} ${isOpen ? "ring-4 ring-farm/10 border-farm/50 bg-white" : "bg-gray-50/50 hover:bg-white hover:border-farm/30"}`
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="flex items-center gap-1 w-full justify-center"
          onClick={(e) => isOpen && e.stopPropagation()}
        >
          {!compact && (
            <CalendarIcon
              size={size === "sm" ? 14 : 20}
              className={`cursor-pointer transition-colors ${isOpen ? "text-farm" : "text-gray-300"}`}
            />
          )}
          <input
            type="text"
            placeholder="DD/MM/AA"
            value={inputValue}
            onChange={handleManualInput}
            className={`bg-transparent border-none outline-none placeholder:text-gray-300 cursor-pointer text-center
              ${compact
                ? "text-[11px] font-medium text-gray-500 w-full tracking-tight"
                : `font-black text-gray-900 w-full ${size === "sm" ? "text-xs" : "text-sm"}`
              }`}
          />
        </div>
        {!isOpen && !compact && (
          <ChevronDown
            size={size === "sm" ? 14 : 18}
            className="text-gray-300 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          />
        )}
      </div>
      {isOpen && (
        <div
          className={` absolute z-[9999] mt-3 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_70px_-15px_rgba(0,180,100,0.15)] border border-white/40 p-5 min-w-[280px] animate-in zoom-in-95 duration-200 ${align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"} `}
        >
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-farm"
            >
              {" "}
              <ChevronLeft size={18} />{" "}
            </button>{" "}
            <h3 className="text-sm font-semibold text-gray-900 capitalize tracking-tight">
              {" "}
              {format(currentMonth, "MMMM yyyy", { locale: es })}{" "}
            </h3>{" "}
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-farm"
            >
              {" "}
              <ChevronRight size={18} />{" "}
            </button>{" "}
          </div>{" "}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {" "}
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-gray-300 uppercase text-center py-1.5"
              >
                {" "}
                {d}{" "}
              </div>
            ))}{" "}
          </div>{" "}
          <div className="grid grid-cols-7 gap-1">
            {" "}
            {dayInterval.map((day, i) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={` h-[2.1rem] w-full rounded-xl text-[11px] font-bold transition-all relative flex items-center justify-center ${!isCurrentMonth ? "text-gray-200" : "text-gray-700"} ${isSelected ? "bg-farm text-white shadow-[0_8px_20px_-6px_rgba(0,180,100,0.4)] scale-105 z-10" : "hover:bg-farm/10 hover:text-farm"} ${isTodayDate && !isSelected ? "bg-farm/5 text-farm font-black ring-1 ring-farm/20" : ""} `}
                >
                  {" "}
                  {format(day, "d")}{" "}
                  {isTodayDate && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-farm rounded-full shadow-[0_0_8px_rgba(0,180,100,0.5)]"></div>
                  )}{" "}
                </button>
              );
            })}{" "}
          </div>{" "}
          <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end items-center">
            {" "}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              {" "}
              Cerrar <X size={12} />{" "}
            </button>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
