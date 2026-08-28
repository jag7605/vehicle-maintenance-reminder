import "./CustomerGarageInfoPage.css";

function CustomerGarageInfoPage() {
  return (
    <div className="customer-garage-page">

      <h1 className="customer-garage-title">
        Garage Information
      </h1>

      <div className="customer-garage-banner">

        <div className="customer-garage-main">

          <div className="customer-garage-logo">
            AUT
          </div>

          <div>
            <h2>
              AUT Service Centre
            </h2>

            <p>
              Vehicle servicing and maintenance
            </p>
          </div>

        </div>

        <span className="customer-garage-badge">
          Open Monday - Saturday
        </span>

      </div>

      <div className="customer-garage-contact-grid">

        <div className="customer-garage-contact-card">

          <p className="customer-garage-label">
            ADDRESS
          </p>

          <strong>
            123 Example Road
          </strong>

          <span>
            Auckland, New Zealand
          </span>

        </div>


        <div className="customer-garage-contact-card">

          <p className="customer-garage-label">
            PHONE
          </p>

          <strong>
            09 123 4567
          </strong>

          <span>
            Call during business hours
          </span>

        </div>


        <div className="customer-garage-contact-card">

          <p className="customer-garage-label">
            EMAIL
          </p>

          <strong>
            service@aut.co.nz
          </strong>

          <span>
            General enquiries
          </span>

        </div>

      </div>

      <div className="customer-garage-hours-card">

        <p className="customer-garage-label">
          OPENING HOURS
        </p>

        <div className="customer-garage-hours-row">

          <strong>
            Monday - Friday
          </strong>

          <span>
            9:00 AM - 5:00 PM
          </span>

        </div>


        <div className="customer-garage-hours-row">

          <strong>
            Saturday
          </strong>

          <span>
            9:00 AM - 5:00 PM
          </span>

        </div>


        <div className="customer-garage-hours-row">

          <strong>
            Sunday
          </strong>

          <span className="customer-garage-closed">
            Closed
          </span>

        </div>

      </div>

    </div>
  );
}

export default CustomerGarageInfoPage;