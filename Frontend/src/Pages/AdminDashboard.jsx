import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Style/animations.css";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:5000"; // Backend API

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const managerName = user.display_name || "Admin";

  // 🔔 Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [pendingScroll, setPendingScroll] = useState(false);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);

  const [viewMode, setViewMode] = useState("ticket");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderTicket, setReminderTicket] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [technicianList, setTechnicianList] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    ALL: 0,
    NOT_ASSIGNED: 0,
    ASSIGNED: 0,
    NOT_STARTED: 0,
    INPROCESS: 0,
    COMPLETE: 0,
    REJECTED: 0,
  });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("");
  const [remarks, setRemarks] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const [mailLoading, setMailLoading] = useState(false);
  const [mailMessage, setMailMessage] = useState("Processing...");
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ Logout
  const handleLogout = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">You have been logged out.</p>
          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => closeToast()}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-light text-dark"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                closeToast();
                navigate("/login", { replace: true });
              }}
            >
              OK
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        hideProgressBar: true,
        className: "bg-danger text-white",
      }
    );
  };

  // ✅ Sound
  const playSuccessSound = () => {
    const audio = new Audio(
      "https://cdn.pixabay.com/audio/2022/03/15/audio_68c4f708a0.mp3"
    );
    audio.volume = 0.4;
    const p = audio.play();
    if (p) p.catch(() => {});
  };

  const showToast = (type, text) => {
    const opts = { position: "top-right", autoClose: 3000, theme: "colored" };
    if (type === "success") {
      toast.success(text, opts);
      playSuccessSound();
      setShowSuccessIcon(true);
      setTimeout(() => setShowSuccessIcon(false), 1500);
    } else if (type === "warning") toast.warning(text, opts);
    else if (type === "info") toast.info(text, opts);
    else toast.error(text, opts);
  };

  // ✅ Load only overdue tickets
  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter(
          (t) =>
            t.end_date &&
            new Date(t.end_date) < new Date() &&
            !["COMPLETE", "REJECTED"].includes(t.status)
        );
        setNotifications(filtered);
      }
    } catch (err) {
      console.error("❌ Notification load failed:", err);
    }
  };

  const handleNotificationClick = (ticketId) => {
    setShowNotifications(false);
    setHighlightedTicketId(ticketId);
    setTimeout(() => setHighlightedTicketId(null), 5000);
    const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) return;
    const targetPage = Math.floor(ticketIndex / ticketsPerPage) + 1;
    setScrollTarget(ticketId);
    if (currentPage !== targetPage) setCurrentPage(targetPage);
    setPendingScroll(true);
  };

  useEffect(() => {
    if (!pendingScroll || !scrollTarget) return;
    const row = document.getElementById(`ticket-row-${scrollTarget}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("zoom3x");
      setTimeout(() => row.classList.remove("zoom3x"), 2000);
      setPendingScroll(false);
      setScrollTarget(null);
    }
  }, [pendingScroll, scrollTarget, currentPage]);

  const indexOfLast = currentPage * ticketsPerPage;
  const currentTickets = tickets.slice(indexOfLast - ticketsPerPage, indexOfLast);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ manager: managerName });
      if (filter !== "ALL") q.set("status", filter);
      const res = await fetch(`${API}/api/admin/tickets?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Load tickets failed:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const res = await fetch(`${API}/api/admin/technicians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTechnicianList(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadCounts = async () => {
    try {
      const res = await fetch(`${API}/api/admin/tickets/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const total =
        (data?.NOT_ASSIGNED || 0) +
        (data?.ASSIGNED || 0) +
        (data?.NOT_STARTED || 0) +
        (data?.INPROCESS || 0) +
        (data?.COMPLETE || 0) +
        (data?.REJECTED || 0);
      setCounts({
        ALL: total,
        NOT_ASSIGNED: data?.NOT_ASSIGNED || 0,
        ASSIGNED: data?.ASSIGNED || 0,
        NOT_STARTED: data?.NOT_STARTED || 0,
        INPROCESS: data?.INPROCESS || 0,
        COMPLETE: data?.COMPLETE || 0,
        REJECTED: data?.REJECTED || 0,
      });
    } catch {}
  };

  useEffect(() => {
    loadTickets(true);
    loadCounts();
    loadNotifications();
    const i = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTickets(true);
        loadCounts();
        loadNotifications();
      }
    }, 5000);
    return () => clearInterval(i);
  }, [filter]);

  useEffect(() => {
    loadTechnicians();
    loadCounts();
  }, []);

  const unseenCount = notifications.filter((n) => !n.notification).length;
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.notification === b.notification) return b.id - a.id;
    return a.notification - b.notification;
  });

  const getStatusBadge = (s) =>
    ({
      ALL: "bg-secondary",
      NOT_ASSIGNED: "bg-info text-dark",
      ASSIGNED: "bg-warning text-dark",
      NOT_STARTED: "bg-dark text-light",
      INPROCESS: "bg-primary",
      COMPLETE: "bg-success",
      REJECTED: "bg-danger",
    }[s?.toUpperCase()] || "bg-secondary");

  // ========== START UI ==============
  return (
    <div
      className="container-fluid py-4"
      style={{
        background: "linear-gradient(135deg, #f5f8ff, #e9ecef)",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        className="p-4 mb-4 rounded-4 text-white shadow-sm"
        style={{
          background: "linear-gradient(90deg, #007bff, #6610f2)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <h3 className="fw-bold mb-0">Admin Dashboard — {managerName}</h3>
          <div className="d-flex align-items-center gap-3">
            <small>{new Date().toLocaleString("en-IN")}</small>
            <div className="position-relative">
              <i
                className={`bi bi-bell-fill fs-4 ${
                  unseenCount > 0 ? "text-warning animate-bell" : "text-light"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setShowNotifications(!showNotifications)}
              ></i>
              {unseenCount > 0 && (
                <span className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-danger">
                  {unseenCount}
                </span>
              )}
            </div>
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div
            className="position-absolute end-0 mt-3 me-3 bg-white shadow-lg rounded-3 p-3"
            style={{ width: "340px", zIndex: 2000 }}
          >
            <h6 className="fw-semibold mb-2 text-primary">
              Overdue Tickets ({unseenCount})
            </h6>
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {sortedNotifications.length === 0 ? (
                <p className="text-muted small text-center mb-0">
                  No overdue tickets 🎉
                </p>
              ) : (
                sortedNotifications.map((n) => {
                  const isSeen = !!n.notification;
                  return (
                    <div
                      key={n.id}
                      className={`border-bottom py-2 small rounded-2 ${
                        isSeen ? "bg-light text-muted" : "bg-white"
                      }`}
                      style={{
                        cursor: "pointer",
                        color: isSeen ? "#6c757d" : "#212529",
                        transition: "background 0.3s",
                      }}
                      onClick={async () => {
                        await fetch(`${API}/api/admin/tickets/${n.id}/seen`, {
                          method: "PATCH",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        await loadNotifications();
                        handleNotificationClick(n.id);
                      }}
                    >
                      <strong>{n.full_name}</strong> —{" "}
                      <span className="text-muted">
                        {n.remarks || "No issue mentioned"}
                      </span>
                      <br />
                      <span className="d-block mt-1">
                        <strong>{n.assigned_to || "Unassigned"}</strong> —{" "}
                        <span
                          className={`badge ${
                            n.status === "COMPLETE"
                              ? "bg-success"
                              : n.status === "REJECTED"
                              ? "bg-danger"
                              : n.status === "INPROCESS"
                              ? "bg-warning text-dark"
                              : n.status === "ASSIGNED"
                              ? "bg-info text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {n.status}
                        </span>
                      </span>
                      <span className="text-danger fw-semibold d-block mt-1">
                        End:{" "}
                        {n.end_date
                          ? new Date(n.end_date).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* STATUS CARDS */}
      <div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
        {["ALL","NOT_ASSIGNED","ASSIGNED","NOT_STARTED","INPROCESS","COMPLETE","REJECTED"].map((key) => (
          <div
            key={key}
            className={`text-center text-white p-3 shadow-sm ${getStatusBadge(key)}`}
            style={{ borderRadius: "12px", width: "12%", minWidth: "120px" }}
          >
            <h6 className="fw-semibold text-uppercase small mb-1">
              {key.replace("_", " ")}
            </h6>
            <h3 className="fw-bold mb-0">{counts[key] || 0}</h3>
          </div>
        ))}
      </div>

      {/* FILTER BUTTONS */}
      <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
        {["ALL","NOT_ASSIGNED","ASSIGNED","NOT_STARTED","INPROCESS","COMPLETE","REJECTED"].map((s) => (
          <div key={s} className="text-center" style={{ width: "12%" }}>
            <button
              className={`btn btn-sm w-100 fw-semibold ${
                filter === s ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setFilter(s)}
            >
              {s} ({counts[s] || 0})
            </button>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow-lg rounded-4">
        <div
          className="card-header text-white rounded-top-4"
          style={{ background: "linear-gradient(90deg, #0d6efd, #6f42c1)" }}
        >
          <h5 className="mb-0 fw-semibold">Tickets Overview</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-primary text-center">
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>IP</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Issue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-3 text-muted">
                      Loading...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-3 text-muted">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  currentTickets.map((t) => {
                    const isOverdue =
                      t.end_date &&
                      new Date(t.end_date) < new Date() &&
                      !["COMPLETE", "REJECTED"].includes(t.status);
                    const isComplete = t.status === "COMPLETE";
                    const isHighlighted = highlightedTicketId === t.id;

                    return (
                      <tr
                        id={`ticket-row-${t.id}`}
                        key={t.id}
                        className={`text-center ${
                          isHighlighted
                            ? "table-warning"
                            : isOverdue
                            ? "table-danger"
                            : isComplete
                            ? "table-success"
                            : ""
                        }`}
                        style={{ transition: "background-color 0.4s ease" }}
                      >
                        <td>{t.emp_id || "-"}</td>
                        <td>
                          <strong>{t.full_name}</strong>
                          <br />
                          <small className="text-muted">{t.username}</small>
                        </td>
                        <td>{t.department}</td>
                        <td>{t.system_ip || "-"}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(t.status)} px-3 py-2`}>
                            {t.status || "Not Assigned"}
                          </span>
                        </td>
                        <td>{t.assigned_to || "-"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowIssueModal(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2 flex-wrap">
                            {t.end_date &&
                            new Date(t.end_date) < new Date() &&
                            t.status !== "COMPLETE" &&
                            t.status !== "REJECTED" ? (
                              <button
                                className="btn btn-sm btn-info text-white"
                                onClick={() => {
                                  setReminderTicket(t);
                                  const dueDate = t.end_date
                                    ? new Date(t.end_date).toLocaleDateString()
                                    : "N/A";
                                  setReminderMessage(
                                    `Dear ${t.assigned_to || "Technician"},\n\nThis is a kind reminder regarding the following issue:\n\n"${
                                      t.remarks || t.issue_text || "No issue mentioned"
                                    }".\n\nIt was due on ${dueDate}. Please review and complete it as soon as possible.\n\n- ${managerName}`
                                  );
                                  setShowReminderModal(true);
                                }}
                              >
                                Remind
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm btn-warning"
                                  disabled={t.status !== "NOT_ASSIGNED"}
                                  onClick={() => {
                                    setSelectedTicket(t);
                                    setShowModal(true);
                                  }}
                                >
                                  Assign
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      {tickets.length > 0 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
            </li>

            {[...Array(totalPages)].map((_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() =>
                  setCurrentPage((p) => (p < totalPages ? p + 1 : p))
                }
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && selectedTicket && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-info text-white rounded-top-4">
                <h5 className="modal-title">Issue Details — {selectedTicket.emp_id}</h5>
                <button className="btn-close" onClick={() => setShowIssueModal(false)}></button>
              </div>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  className={`btn btn-sm fw-semibold ${
                    viewMode === "ticket" ? "btn-primary text-white" : "btn-outline-primary"
                  }`}
                  onClick={() => setViewMode("ticket")}
                >
                  Ticket Info
                </button>

                <button
                  className={`btn btn-sm fw-semibold ${
                    viewMode === "assign" ? "btn-primary text-white" : "btn-outline-primary"
                  }`}
                  onClick={() => setViewMode("assign")}
                  disabled={selectedTicket.status === "NOT_ASSIGNED"}
                >
                  Assign Info
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {viewMode === "ticket" && (
                  <>
                    <p>
                      <strong>Employee:</strong> {selectedTicket.full_name}
                    </p>
                    <p>
                      <strong>Department:</strong> {selectedTicket.department}
                    </p>
                    <p>
                      <strong>IP Address:</strong> {selectedTicket.system_ip}
                    </p>
                    <hr />
                    <p>
                      <strong>Issue:</strong>
                      <br />
                      {selectedTicket.issue_text}
                    </p>
                    <hr />
                    <p>
                      <strong>Submitted On:</strong>{" "}
                      {selectedTicket.created_at
                        ? new Date(selectedTicket.created_at).toLocaleString()
                        : "Not Available"}
                    </p>
                  </>
                )}

                {viewMode === "assign" && selectedTicket.status !== "NOT_ASSIGNED" && (
                  <div
                    className="p-3 rounded-3"
                    style={{ background: "rgba(13,110,253,0.08)", border: "1px solid #b6d4fe" }}
                  >
                    <h6 className="fw-bold text-primary mb-3">Assignment Details</h6>
                    <p>
                      <strong>Technician:</strong> {selectedTicket.assigned_to || "—"}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {selectedTicket.start_date
                        ? new Date(selectedTicket.start_date).toLocaleDateString()
                        : "—"}
                    </p>
                    <p>
                      <strong>End Date:</strong>{" "}
                      {selectedTicket.end_date
                        ? new Date(selectedTicket.end_date).toLocaleDateString()
                        : "—"}
                    </p>
                    <p>
                      <strong>Priority:</strong> {selectedTicket.priority || "—"}
                    </p>
                    <p>
                      <strong>Remarks:</strong> {selectedTicket.remarks ? selectedTicket.remarks : "—"}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="btn btn-danger"
                  disabled={["REJECTED", "ASSIGNED", "COMPLETE"].includes(selectedTicket.status)}
                  onClick={() => {
                    if (!window.confirm("Are you sure you want to reject this ticket?")) return;
                    handleReject(selectedTicket.id);
                  }}
                >
                  Reject
                </button>

                <button className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showModal && selectedTicket && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title">Assign Ticket — {selectedTicket.emp_id}</h5>
                <button className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Assign To (Technician)</label>
                    <select
                      className="form-select"
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                    >
                      <option value="">Select Technician</option>
                      {technicianList.map((t) => (
                        <option key={t.username} value={t.name || t.full_name || t.username}>
                          {t.name || t.full_name || t.username} ({t.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate || new Date().toISOString().split("T")[0]}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate || ""}
                      min={startDate || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="">Select Priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Remarks</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={async () => await assign()}>
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMINDER MODAL */}
      {showReminderModal && reminderTicket && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-info text-white rounded-top-4">
                <h5 className="modal-title">
                  Reminder — {reminderTicket.assigned_to || "Technician"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderMessage("Please complete the assigned ticket soon.");
                  }}
                ></button>
              </div>

              <div className="modal-body">
                <p className="text-muted small mb-2">
                  Ticket ID: <strong>{reminderTicket.id}</strong>
                </p>
                <textarea
                  rows="6"
                  className="form-control"
                  placeholder="Enter your reminder message to technician..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderMessage("Please complete the assigned ticket soon.");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-info text-white"
                  onClick={async () => {
                    if (!reminderMessage.trim())
                      return showToast("danger", "Please enter a message!");
                    try {
                      setMailLoading(true);
                      setMailMessage("Sending reminder to technician...");
                      const res = await fetch(
                        `${API}/api/admin/tickets/${reminderTicket.id}/remind`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ message: reminderMessage }),
                        }
                      );
                      const data = await res.json();
                      if (res.ok) {
                        showToast("success", `✅ Reminder sent to ${reminderTicket.assigned_to}`);
                      } else {
                        showToast("danger", data?.error || "Failed to send reminder");
                      }
                    } catch (err) {
                      console.error("❌ Reminder error:", err);
                      showToast("danger", "Server error while sending reminder");
                    } finally {
                      setMailLoading(false);
                      setShowReminderModal(false);
                      setReminderMessage("Please complete the assigned ticket soon.");
                    }
                  }}
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADER OVERLAY */}
      {mailLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ background: "rgba(255,255,255,0.8)", zIndex: 2000 }}
        >
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} role="status"></div>
          <p className="fw-semibold text-primary">{mailMessage}</p>
        </div>
      )}

      {/* SUCCESS POP */}
      {showSuccessIcon && (
        <div
          className="position-fixed top-50 start-50 translate-middle text-success"
          style={{ zIndex: 3000, animation: "pop 1s ease" }}
        >
          <i className="bi bi-check-circle-fill" style={{ fontSize: "4rem", animation: "zoomIn 0.5s ease" }}></i>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
    </div>
  );
}
