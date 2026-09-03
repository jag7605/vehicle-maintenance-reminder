import { useState } from "react";
import { vehicleMakesModels } from "../../data/vehicleMakesModels";
import MessagePopup from "../MessagePopup";
import { isPastDate, formatDate } from "../../utils/formatters";
import "../FormControls.css";

const OTHER_OPTION = "__other__";
const MAX_SUGGESTION_DISTANCE = 2; // allows small typos, not wildly different words

function capitalizeWords(str) {
  return str
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Standard Levenshtein distance — the number of single-character edits
// (insertions, deletions, substitutions) needed to turn `a` into `b`.
// Lower = more similar. Used to catch typos, not just casing differences.
function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(
          matrix[i - 1][j],     // deletion
          matrix[i][j - 1],     // insertion
          matrix[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return matrix[rows - 1][cols - 1];
}

// Finds the closest match to `value` among `candidates`, first checking
// for an exact case-insensitive match, then falling back to the closest
// typo-tolerant match within MAX_SUGGESTION_DISTANCE edits.
function findClosestMatch(value, candidates) {
  const lowerValue = value.toLowerCase();

  const exactMatch = candidates.find(
    (candidate) => candidate.toLowerCase() === lowerValue && candidate !== value
  );
  if (exactMatch) return exactMatch;

  let closest = null;
  let closestDistance = MAX_SUGGESTION_DISTANCE + 1;

  for (const candidate of candidates) {
    if (candidate === value) continue;
    const distance = levenshteinDistance(lowerValue, candidate.toLowerCase());
    if (distance <= MAX_SUGGESTION_DISTANCE && distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  }

  return closest || "";
}

function AddVehicleForm({ customerName, form }) {
  const {
    make,
    model,
    year,
    mileage,
    rego,
    lastWofDate,
    lastOilChangeDate,
    error,
    loading,
    availableModels,
    addedVehicleDetails,
    setMake,
    setModel,
    setYear,
    setMileage,
    setRego,
    setLastWofDate,
    setLastOilChangeDate,
    onSubmit,
    closeAddedVehicleDetails,
  } = form;

  const [customMake, setCustomMake] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [makeSuggestion, setMakeSuggestion] = useState("");
  const [modelSuggestion, setModelSuggestion] = useState("");

  function handleMakeSelectChange(e) {
    if (e.target.value === OTHER_OPTION) {
      setCustomMake(true);
      setCustomModel(true); // a custom make has no known model list — go straight to free text
      setMake({ target: { value: "" } });
      return;
    }
    setCustomMake(false);
    setCustomModel(false);
    setMake(e);
  }

  function handleModelSelectChange(e) {
    if (e.target.value === OTHER_OPTION) {
      setCustomModel(true);
      setModel("");
      return;
    }
    setModel(e.target.value);
  }

  // Capitalizes the typed value, and checks whether it's close to a known
  // make (exact casing mismatch, or a small typo) — if so, offers a
  // "Did you mean?" correction rather than silently accepting it as-is.
  function handleMakeBlur() {
    if (!make) return;

    const capitalized = capitalizeWords(make);
    setMake({ target: { value: capitalized } });

    const suggestion = findClosestMatch(capitalized, Object.keys(vehicleMakesModels));
    setMakeSuggestion(suggestion);
  }

  function acceptMakeSuggestion() {
    setCustomMake(false);
    setCustomModel(false);
    setMake({ target: { value: makeSuggestion } });
    setMakeSuggestion("");
  }

  function handleModelBlur() {
    if (!model) return;

    const capitalized = capitalizeWords(model);
    setModel(capitalized);

    // Only meaningful if we know the model list for this make (i.e. make
    // itself isn't also custom) — otherwise there's nothing to check against.
    if (customMake) return;

    const suggestion = findClosestMatch(capitalized, availableModels);
    setModelSuggestion(suggestion);
  }

  function acceptModelSuggestion() {
    setCustomModel(false);
    setModel(modelSuggestion);
    setModelSuggestion("");
  }

  function buildConfirmationMessage(details) {
    const wofLine = details.nextWofDate
      ? `Next WoF Date: ${formatDate(details.nextWofDate)}${
          isPastDate(details.nextWofDate) ? " (Overdue)" : ""
        }`
      : "Next WoF Date: —";

    const oilChangeLine = details.nextOilChangeDate
      ? `Next Oil Change Date: ${formatDate(details.nextOilChangeDate)}${
          isPastDate(details.nextOilChangeDate) ? " (Overdue)" : ""
        }`
      : "Next Oil Change Date: —";

    return (
      `Vehicle added successfully.\n\n` +
      `${details.year} ${details.make} ${details.model} (${details.rego})\n` +
      `${wofLine}\n` +
      `${oilChangeLine}`
    );
  }

  return (
    <>
      <h2>Add Vehicle for {customerName}</h2>
      <form onSubmit={onSubmit} className="standalone-form">
        <div>
          <label>Make</label><br />
          {customMake ? (
            <>
              <input
                className="input-control"
                value={make}
                onChange={setMake}
                onBlur={handleMakeBlur}
                placeholder="Enter make"
                required
              />

              {makeSuggestion && (
                <div className="field-suggestion-row">
                  <span>Did you mean: </span>
                  <button type="button" className="link-button" onClick={acceptMakeSuggestion}>
                    {makeSuggestion}
                  </button>
                </div>
              )}

              <div className="field-choose-list-row">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setCustomMake(false);
                    setCustomModel(false);
                    setMake({ target: { value: "" } });
                    setMakeSuggestion("");
                  }}
                >
                  Choose from list instead?
                </button>
              </div>
            </>
          ) : (
            <select className="select-control" value={make} onChange={handleMakeSelectChange} required>
              <option value="" disabled>Select a make</option>
              {Object.keys(vehicleMakesModels).map((makeOption) => (
                <option key={makeOption} value={makeOption}>{makeOption}</option>
              ))}
              <option value={OTHER_OPTION}>Other (enter manually)</option>
            </select>
          )}
        </div>

        <div>
          <label>Model</label><br />
          {customModel ? (
            <>
              <input
                className="input-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                onBlur={handleModelBlur}
                placeholder="Enter model"
                disabled={!make}
                required
              />

              {modelSuggestion && (
                <div className="field-suggestion-row">
                  <span>Did you mean: </span>
                  <button type="button" className="link-button" onClick={acceptModelSuggestion}>
                    {modelSuggestion}
                  </button>
                </div>
              )}

              {!customMake && (
                <div className="field-choose-list-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setCustomModel(false);
                      setModel("");
                      setModelSuggestion("");
                    }}
                  >
                    Choose from list instead?
                  </button>
                </div>
              )}
            </>
          ) : (
            <select
              className="select-control"
              value={model}
              onChange={handleModelSelectChange}
              disabled={!make}
              required
            >
              <option value="" disabled>Select a model</option>
              {availableModels.map((modelOption) => (
                <option key={modelOption} value={modelOption}>{modelOption}</option>
              ))}
              <option value={OTHER_OPTION}>Other (enter manually)</option>
            </select>
          )}
        </div>

        <div>
          <label>Year</label><br />
          <input className="input-control" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        </div>

        <div>
          <label>Mileage</label><br />
          <input className="input-control" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required />
        </div>

        <div>
          <label>Rego</label><br />
          <input className="input-control" value={rego} onChange={(e) => setRego(e.target.value.toUpperCase())} required />
        </div>

        <div>
          <label>Last WoF Date (optional)</label><br />
          <input
            className="input-control"
            type="date"
            value={lastWofDate}
            onChange={(e) => setLastWofDate(e.target.value)}
          />
          <br />
          <small>
            If known, we'll calculate the next WoF due date from this date instead of today.
          </small>
        </div>

        <div>
          <label>Last Oil Change Date (optional)</label><br />
          <input
            className="input-control"
            type="date"
            value={lastOilChangeDate}
            onChange={(e) => setLastOilChangeDate(e.target.value)}
          />
          <br />
          <small>
            If known, we'll calculate the next Oil Change due date automatically.
          </small>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div>
          {/* Invisible label matching the shape of every other field's
              label — this is what actually aligns the button with the
              inputs beside it (same top offset), rather than trying to
              guess a pixel margin that would break if label size/spacing
              ever changes. */}
          <label aria-hidden="true">&nbsp;</label><br />
          <button type="submit" className={`btn ${loading ? "btn-disabled" : "btn-primary"}`} disabled={loading}>
            {loading ? "Saving..." : "Add Vehicle"}
          </button>
        </div>
      </form>

      {addedVehicleDetails && (
        <MessagePopup
          message={buildConfirmationMessage(addedVehicleDetails)}
          onClose={closeAddedVehicleDetails}
        />
      )}
    </>
  );
}

export default AddVehicleForm;