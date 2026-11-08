import { usePaperclipStore } from "../../networking/sync/paperclipStore";

export function CompanySwitcher() {
  const connected = usePaperclipStore((s) => s.connected);
  const companies = usePaperclipStore((s) => s.companies);
  const company = usePaperclipStore((s) => s.company);
  const setActiveCompany = usePaperclipStore((s) => s.setActiveCompany);
  const fetchCompanies = usePaperclipStore((s) => s.fetchCompanies);
  const connect = usePaperclipStore((s) => s.connect);

  return (
    <div className="company-switcher">
      <label className="cs-label">COMPANY</label>
      <select
        className="cs-select"
        value={company?.id ?? ""}
        disabled={!connected || companies.length === 0}
        onChange={(e) => {
          const id = e.target.value;
          if (id) setActiveCompany(id);
        }}
      >
        {companies.length === 0 && (
          <option value="">{connected ? "— none —" : "— control panel offline —"}</option>
        )}
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        className="cs-refresh"
        title={connected ? "Refresh companies" : "Retry connecting to the control panel"}
        onClick={() => {
          if (connected) fetchCompanies();
          else connect("The Delegation");
        }}
      >
        ⟳
      </button>
    </div>
  );
}
