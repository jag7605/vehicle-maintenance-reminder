const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
 
const boxStyle = { backgroundColor: "white", padding: "20px", minWidth: "300px" };
 
// ---------------------------------------------------------------------------
// Delete Vehicle confirmation modal. Renders nothing if `popup.vehicle`
// is null. `popup` shape matches useCustomerProfile().deletePopup.
// ---------------------------------------------------------------------------
function DeleteVehicleModal({ popup }) {
  const { vehicle, loading, error, close, onConfirm } = popup;
 
  if (!vehicle) return null;
 
  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <h3>Delete Vehicle: {vehicle.make} {vehicle.model}</h3>
        <p>Year: {vehicle.year}</p>
        <p>Rego: {vehicle.rego}</p>
        <p>Mileage: {vehicle.mileage}</p>
        <p>Are you sure you want to delete this vehicle?</p>
 
        {error && <p style={{ color: "red" }}>{error}</p>}
 
        <button onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </button>{" "}
        <button type="button" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}
 
export default DeleteVehicleModal;