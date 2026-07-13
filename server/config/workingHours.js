// Working hours constants — Sprint 4, Step 4.
// Decision (confirmed at sprint start): 9am-5pm, Monday-Saturday, closed Sundays only.
// Public holiday logic was originally in scope but was dropped — do not add it
// back without checking, the Jira user story was updated to reflect this.
//
// Slot approach (confirmed): fixed-length slots. Every appointment occupies
// exactly one slot of SLOT_DURATION_MINUTES, regardless of the actual job
// length — chosen for Sprint 4 scope over a variable-duration grid.

const OPEN_HOUR = 9; // 9am, 24hr clock
const CLOSE_HOUR = 17; // 5pm, 24hr clock
const SLOT_DURATION_MINUTES = 60;

// JS Date.getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
const CLOSED_DAYS_OF_WEEK = [0];

module.exports = {
  OPEN_HOUR,
  CLOSE_HOUR,
  SLOT_DURATION_MINUTES,
  CLOSED_DAYS_OF_WEEK,
};