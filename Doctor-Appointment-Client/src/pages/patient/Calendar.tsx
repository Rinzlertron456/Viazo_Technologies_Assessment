import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { statusLabel } from "../../utils/statusLabels";
import "./Calendar.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Appointment {
  _id: string;
  patientId?: { firstName: string; lastName: string };
  doctorId?: { firstName: string; lastName: string };
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
}

export function CalendarPage() {
  const [today] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">(
    "month",
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0);
        const params = `start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}`;
        const res = await api.get<{
          success: boolean;
          data: { appointments: Appointment[] };
        }>(`/calendar?${params}`);
        if (res.success) setAppointments(res.data.appointments);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentMonth, currentYear]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else setCurrentMonth(currentMonth - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else setCurrentMonth(currentMonth + 1);
  }

  function goToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(today);
  }

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  function hasAppointment(
    day: number,
    month = currentMonth,
    year = currentYear,
  ) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a) => a.date?.startsWith(dateStr));
  }

  function isToday(d: number, m = currentMonth, y = currentYear) {
    return (
      d === today.getDate() &&
      m === today.getMonth() &&
      y === today.getFullYear()
    );
  }

  function renderMonthView() {
    const cells: React.ReactNode[] = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push(
        <div key={`p-${d}`} className="dayCell otherMonth">
          <div className="dayNum">{d}</div>
        </div>,
      );
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const apps = hasAppointment(d);
      cells.push(
        <div
          key={d}
          className={`dayCell ${isToday(d) ? "todayCell" : ""}`}
          onClick={() => setSelectedDay(new Date(currentYear, currentMonth, d))}
        >
          <div className="dayNum">{d}</div>
          {apps.length > 0 && (
            <div className="eventDots">
              {apps.slice(0, 4).map((a) => (
                <span
                  key={a._id}
                  className="eventDot"
                  title={`${a.startTime} ${statusLabel(a.status)}`}
                />
              ))}
            </div>
          )}
        </div>,
      );
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push(
        <div key={`n-${d}`} className="dayCell otherMonth">
          <div className="dayNum">{d}</div>
        </div>,
      );
    }
    return cells;
  }

  function renderWeekView() {
    const start = new Date(currentYear, currentMonth, 1);
    start.setDate(start.getDate() - start.getDay());
    return (
      <div className="weekGrid">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          const apps = hasAppointment(
            day.getDate(),
            day.getMonth(),
            day.getFullYear(),
          );
          return (
            <div key={i} className="weekCell">
              <strong>
                {DAYS[i]} {day.getDate()}
              </strong>
              {apps.map((a) => (
                <div key={a._id} className="weekAppt">
                  {a.startTime} - {statusLabel(a.status)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  function renderDetailTable(apps: Appointment[]) {
    if (apps.length === 0)
      return (
        <p
          style={{
            color: "#64748b",
            marginTop: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          No appointments
        </p>
      );
    return (
      <table className="detailTable">
        <thead>
          <tr>
            <th>Time</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a._id}>
              <td>
                {a.startTime}
                {a.endTime ? ` - ${a.endTime}` : ""}
              </td>
              <td>
                Dr. {a.doctorId?.firstName} {a.doctorId?.lastName}
              </td>
              <td>
                <span className={`badge badge-${a.status?.toLowerCase()}`}>
                  {statusLabel(a.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderDayView() {
    const day = selectedDay || today;
    return (
      <div style={{ marginTop: "0.75rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "0.5rem",
          }}
        >
          Appointments for {day.toDateString()}
        </h3>
        {renderDetailTable(
          hasAppointment(day.getDate(), day.getMonth(), day.getFullYear()),
        )}
      </div>
    );
  }

  function renderAgendaView() {
    if (appointments.length === 0)
      return (
        <p
          style={{
            color: "#64748b",
            marginTop: "0.75rem",
            fontSize: "0.875rem",
          }}
        >
          No appointments this month
        </p>
      );
    return (
      <div style={{ marginTop: "0.75rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "0.5rem",
          }}
        >
          All Appointments
        </h3>
        {[...appointments]
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )
          .map((a) => (
            <div key={a._id} className="agendaCard">
              <strong>{new Date(a.date).toLocaleDateString()}</strong> -{" "}
              {a.startTime} | Dr. {a.doctorId?.firstName} {a.doctorId?.lastName}
              <span
                className={`badge badge-${a.status?.toLowerCase()}`}
                style={{ float: "right" }}
              >
                {statusLabel(a.status)}
              </span>
            </div>
          ))}
      </div>
    );
  }

  if (loading)
    return (
      <div className="wrap">
        <p style={{ color: "#64748b", textAlign: "center", padding: "2rem 0" }}>
          Loading...
        </p>
      </div>
    );

  return (
    <div className="wrap">
      {/* Month navigation */}
      <div className="headerNav">
        <h2>
          {MONTHS[currentMonth]} {currentYear}
        </h2>
        <div className="monthNav">
          <button className="navBtn" onClick={prevMonth}>
            &larr; Prev
          </button>
          <button className="navBtn" onClick={nextMonth}>
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Toolbar: Today + Views */}
      <div className="toolbar">
        <button className="todayBtn" onClick={goToday}>
          Today
        </button>
        <div className="viewToggles">
          {["month", "week", "day", "agenda"].map((v) => (
            <button
              key={v}
              className={`viewToggle ${view === v ? "viewToggleActive" : ""}`}
              onClick={() => setView(v as any)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {view === "month" && (
        <>
          <div className="dayHeaders">
            {DAYS.map((d) => (
              <div key={d} className="dayHeader">
                {d}
              </div>
            ))}
          </div>
          <div className="grid">{renderMonthView()}</div>
        </>
      )}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}
      {view === "agenda" && renderAgendaView()}

      {/* Selected day detail */}
      {selectedDay && view !== "day" && view !== "agenda" && (
        <div style={{ marginTop: "1rem" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.5rem",
            }}
          >
            Appointments for {selectedDay.toDateString()}
          </h3>
          {renderDetailTable(
            hasAppointment(
              selectedDay.getDate(),
              selectedDay.getMonth(),
              selectedDay.getFullYear(),
            ),
          )}
        </div>
      )}
    </div>
  );
}
